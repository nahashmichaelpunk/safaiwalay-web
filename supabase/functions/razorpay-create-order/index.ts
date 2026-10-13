import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

/** Keep in sync with PLATFORM_FEE_RUPEES in src/lib/pricing.ts */
const PLATFORM_FEE_RUPEES = 13

function expectedPayableRupees(booking: { price: string; total_amount: string | null }) {
  const fromTotal = parseFloat(booking.total_amount ?? '')
  if (Number.isFinite(fromTotal) && fromTotal > 0) return fromTotal
  return (parseFloat(booking.price) || 0) + PLATFORM_FEE_RUPEES
}

// Function to create Razorpay order using direct API call
async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  
  const credentials = btoa(`${keyId}:${keySecret}`);
  
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      receipt,
      notes
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  console.log('🔍 Function called with method:', req.method);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration for function');
    }
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseAuthed = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: authError
    } = await supabaseAuthed.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('📋 Reading request body...');
    const body = await req.json().catch((e) => {
      throw new Error(`Invalid JSON: ${e.message}`);
    }) as { amount?: number; booking_id?: string };
    
    // Validate required fields
    if (!body.amount || !body.booking_id) {
      throw new Error('Missing required fields: amount, booking_id');
    }
    
    const { amount, booking_id } = body;
    const user_id = user.id;
    
    // Validate data types
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }
    if (typeof booking_id !== 'string' || !booking_id) {
      throw new Error('Invalid booking_id: must be a non-empty string');
    }
    
    console.log('📊 Request data:', { amount, booking_id, user_id });

    console.log('🔑 Environment check:', {
      hasRazorpayKey: !!Deno.env.get('RAZORPAY_KEY_ID'),
      hasRazorpaySecret: !!Deno.env.get('RAZORPAY_KEY_SECRET'),
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey
    });

    // Validate booking ownership and state before creating payment order
    const { data: booking, error: bookingFetchError } = await supabaseAuthed
      .from('bookings')
      .select('id, user_id, price, total_amount, payment_status')
      .eq('id', booking_id)
      .single();

    if (bookingFetchError || !booking) {
      throw new Error('Booking not found');
    }
    if (booking.user_id !== user_id) {
      throw new Error('Forbidden booking access');
    }
    if (booking.payment_status === 'paid') {
      throw new Error('Booking is already paid');
    }

    const expectedAmountRupees = expectedPayableRupees(booking);
    if (Math.abs(expectedAmountRupees - amount) > 0.01) {
      throw new Error('Amount mismatch for booking total');
    }

    // Create Razorpay order
    console.log('💳 Creating Razorpay order...');
    let order;
    try {
      // Create receipt ID that's safe and unique
      const shortReceipt = `bk_${booking_id.replace(/-/g, '').substring(0, 32)}`;
      console.log('📝 Receipt:', shortReceipt, 'Length:', shortReceipt.length);
      
      order = await createRazorpayOrder(amount, shortReceipt, {
        booking_id,
        user_id
      });
      console.log('✅ Razorpay order created:', order.id);
    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', razorpayError);
      const errorMessage = razorpayError instanceof Error ? razorpayError.message : 'Unknown Razorpay error';
      throw new Error(`Razorpay error: ${errorMessage}`);
    }

    // Create payment record in database
    console.log('💾 Creating payment record in database...');
    
    let data;
    try {
      console.log('📝 Preparing payment record');
      const paymentRecord = {
        booking_id,
        user_id,
        amount,
        payment_method: 'razorpay',
        payment_type: 'full',
        razorpay_order_id: order.id,
        status: 'pending'
      };
      
      // First try without the payment_details to see if that's causing issues
      console.log('💾 Inserting payment record (without details)');
      const { data: paymentData, error } = await supabaseService
        .from('payments')
        .insert(paymentRecord)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Payment insert error:', error);
        throw new Error(`Payment insert error: ${error.message}`);
      }
      
      data = paymentData;
      console.log('✅ Payment record created:', data.id);
      
      // Update booking with order ID
      console.log('📝 Updating booking record:', booking_id);
      const { error: bookingError } = await supabaseService
        .from('bookings')
        .update({
          razorpay_order_id: order.id,
          payment_status: 'pending'
        })
        .eq('id', booking_id);
        
      if (bookingError) {
        console.error('❌ Booking update error:', bookingError);
        throw new Error(`Booking update error: ${bookingError.message}`);
      }
      
      console.log('✅ Booking record updated');
      
    } catch (dbError) {
      console.error('💥 Database operation failed:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        payment_id: data.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
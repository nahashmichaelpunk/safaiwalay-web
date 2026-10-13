import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function createSignature(orderId: string, paymentId: string, secret: string): Promise<string> {
  const message = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

serve(async (req) => {
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

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      booking_id
    } = await req.json() as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
      booking_id?: string;
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !booking_id) {
      throw new Error('Missing required fields');
    }

    // Verify signature
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || ''
    const generated_signature = await createSignature(razorpay_order_id, razorpay_payment_id, secret)

    if (generated_signature !== razorpay_signature) {
      throw new Error('Invalid signature')
    }

    const { data: booking, error: bookingFetchError } = await supabaseAuthed
      .from('bookings')
      .select('id, user_id, price, total_amount, razorpay_order_id, payment_status')
      .eq('id', booking_id)
      .single();

    if (bookingFetchError || !booking) {
      throw new Error('Booking not found');
    }
    if (booking.user_id !== user.id) {
      throw new Error('Forbidden booking access');
    }
    if (booking.razorpay_order_id !== razorpay_order_id) {
      throw new Error('Order does not match booking');
    }

    const { data: payment, error: paymentFetchError } = await supabaseService
      .from('payments')
      .select('id, amount, status, razorpay_payment_id, razorpay_signature')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('booking_id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (paymentFetchError || !payment) {
      throw new Error('Payment record not found');
    }

    const expectedAmountRupees = expectedPayableRupees(booking);
    if (Math.abs(Number(payment.amount) - expectedAmountRupees) > 0.01) {
      throw new Error('Payment amount mismatch for booking total');
    }

    // Idempotent success if same payment already recorded
    if (
      payment.status === 'completed' &&
      payment.razorpay_payment_id === razorpay_payment_id &&
      payment.razorpay_signature === razorpay_signature &&
      booking.payment_status === 'paid'
    ) {
      return new Response(
        JSON.stringify({ success: true, booking_id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    if (payment.status === 'completed' || booking.payment_status === 'paid') {
      throw new Error('Payment already processed with different details');
    }

    // Update payment record
    const { error: paymentError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)

    if (paymentError) {
      throw new Error(paymentError.message)
    }

    // Update booking status
    const { error: bookingError } = await supabaseService
      .from('bookings')
      .update({
        razorpay_payment_id,
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .eq('user_id', user.id)

    if (bookingError) {
      throw new Error(bookingError.message)
    }

    return new Response(
      JSON.stringify({ success: true, booking_id }),
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
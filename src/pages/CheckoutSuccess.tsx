import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { parseBookingPayableRupees } from '@/lib/pricing';
import { downloadBookingInvoice } from '@/lib/invoice-pdf';
import { formatBookingDateTimeForDisplay } from '@/lib/safe-dates';
import { trackEvent } from '@/lib/monitoring/events';

interface BookingDetails {
  id: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  address: string;
  amount: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  total_amount?: string | null;
  price: string;
  base_amount?: number;
  platform_fee?: number;
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingSummaryLine, setPricingSummaryLine] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const bookingId = queryParams.get('bookingId');

  const fetchBookingDetails = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!data) throw new Error('Booking not found');

        const row = data as {
          id: string;
          created_at: string;
          booking_date: string;
          booking_time: string;
          service_name: string;
          address: string;
          price: string;
          total_amount?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
        };

        const baseAmount = parseFloat(row.price) || 0;
        const totalPaid = parseBookingPayableRupees(row);
        const platformFee = Math.max(0, totalPaid - baseAmount);

        setBookingDetails({
          id: row.id,
          created_at: row.created_at,
          booking_date: row.booking_date,
          booking_time: row.booking_time,
          service_name: row.service_name,
          address: row.address,
          amount: totalPaid,
          razorpay_payment_id: row.razorpay_payment_id ?? undefined,
          razorpay_order_id: row.razorpay_order_id ?? undefined,
          total_amount: row.total_amount ?? null,
          price: row.price,
          base_amount: baseAmount,
          platform_fee: platformFee,
        });
        trackEvent('form_submit', { form_name: 'checkout_payment', success: true });
      } catch (error) {
        console.error('Error fetching booking details:', error);
        trackEvent('api_error', {
          endpoint: 'fetch_booking_details',
          message: getSupabaseErrorMessage(error),
        });
        toast({
          title: 'Could not load booking',
          description: getSupabaseErrorMessage(error),
          variant: 'destructive',
        });
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    },
    [navigate, toast]
  );

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      navigate('/cart');
      return;
    }

    try {
      const stored = sessionStorage.getItem(`booking_pricing_${bookingId}`);
      if (stored) {
        setPricingSummaryLine(stored);
        sessionStorage.removeItem(`booking_pricing_${bookingId}`);
      }
    } catch {
      /* ignore */
    }

    setLoading(true);
    void fetchBookingDetails(bookingId);
  }, [bookingId, navigate, fetchBookingDetails]);

  const generateReceipt = async () => {
    if (!bookingDetails) return;
    try {
      trackEvent('click_service_cta', { location: 'checkout_success', target: 'download_receipt' });
      await downloadBookingInvoice(
        {
          id: bookingDetails.id,
          created_at: bookingDetails.created_at,
          booking_date: bookingDetails.booking_date,
          booking_time: bookingDetails.booking_time,
          service_name: bookingDetails.service_name,
          address: bookingDetails.address,
          price: bookingDetails.price,
          total_amount: bookingDetails.total_amount ?? null,
          razorpay_payment_id: bookingDetails.razorpay_payment_id ?? null,
          razorpay_order_id: bookingDetails.razorpay_order_id ?? null,
        },
        { pricingSummaryLine }
      );
    } catch (error) {
      toast({
        title: 'Could not download invoice',
        description: getSupabaseErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const scheduleLabels = bookingDetails
    ? formatBookingDateTimeForDisplay(bookingDetails.booking_date, bookingDetails.booking_time, {
        datePattern: 'EEEE, MMMM d, yyyy',
        timePattern: 'hh:mm a',
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <h1 className="sr-only">Booking confirmed</h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="p-3 rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl text-center">Booking Confirmed!</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Thank you for your booking. We've sent you an email confirmation with all the details.
            </p>

            <Separator />

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : bookingDetails && scheduleLabels ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Booking Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Service Date</p>
                      <p className="text-sm text-muted-foreground">{scheduleLabels.dateLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Service Time</p>
                      <p className="text-sm text-muted-foreground">{scheduleLabels.timeLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Service Location</p>
                      <p className="text-sm text-muted-foreground">{bookingDetails.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{bookingDetails.service_name}</span>
                  </div>

                  {pricingSummaryLine && (
                    <div className="flex justify-between gap-2 mb-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Booking details</span>
                      <span className="text-right text-muted-foreground">{pricingSummaryLine}</span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Service Amount</span>
                    <span>
                      ₹
                      {bookingDetails.base_amount?.toFixed(2) ||
                        (bookingDetails.amount - (bookingDetails.platform_fee || 13)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>₹{bookingDetails.platform_fee?.toFixed(2) || (13).toFixed(2)}</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{bookingDetails.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Booking details not available. Please check your email for confirmation.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {bookingDetails && (
                <Button variant="outline" className="flex items-center gap-2" onClick={generateReceipt}>
                  <Download className="h-4 w-4" />
                  Download Receipt
                </Button>
              )}
              <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

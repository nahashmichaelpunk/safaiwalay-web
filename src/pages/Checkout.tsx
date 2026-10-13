import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/lib/store';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { createBooking } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { useToast } from '@/components/ui/use-toast';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import { parseBookingPayableRupees, PLATFORM_FEE_RUPEES } from '@/lib/pricing';
import { trackEvent, trackMetaPurchase } from '@/lib/monitoring/events';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [payableAmount, setPayableAmount] = useState<number | null>(null);
  const [paymentStep, setPaymentStep] = useState<'booking' | 'payment'>('booking');

  useEffect(() => {
    if (items.length === 0) {
      trackEvent('booking_validation_error', {
        field: 'cart',
        reason: 'empty_cart',
        service_id: 'unknown',
      });
      navigate('/cart');
      return;
    }
    if (items.length > 1) {
      trackEvent('booking_validation_error', {
        field: 'cart',
        reason: 'multiple_items_not_allowed',
        service_id: items[0]?.serviceId ?? 'unknown',
      });
      toast({
        title: 'One service per checkout',
        description:
          'Please remove extra services from your cart and complete checkout one booking at a time.',
        variant: 'destructive',
      });
      navigate('/cart');
    }
  }, [items.length, navigate, toast]);

  const handleConfirmBooking = async () => {
    try {
      setIsLoading(true);
      trackEvent('click_service_cta', { location: 'checkout', target: 'confirm_booking' });

      const booking = await createBooking({
        latitude: items[0].latitude,
        longitude: items[0].longitude,
        serviceName: items[0].serviceName,
        serviceId: items[0].serviceId,
        price: items[0].price,
        date: items[0].date,
        time: items[0].time,
        name: items[0].name,
        email: items[0].email,
        phone: items[0].phone,
        address: items[0].address,
      });

      const payable = parseBookingPayableRupees(booking);
      if (!Number.isFinite(payable) || payable <= 0) {
        toast({
          title: 'Invalid booking total',
          description: 'Could not determine the payment amount. Please try again or contact support.',
          variant: 'destructive',
        });
        return;
      }

      setBookingId(booking.id);
      setPayableAmount(payable);
      setPaymentStep('payment');
      trackEvent('booking_confirmed', {
        booking_id: booking.id,
        service_name: items[0].serviceName,
        value: payable,
      });
      trackEvent('payment_started', { booking_id: booking.id, value: payable });
    } catch (error) {
      console.error('Error creating booking:', error);
      trackEvent('api_error', {
        endpoint: 'create_booking',
        message: getSupabaseErrorMessage(error),
      });
      toast({
        title: 'Error',
        description: getSupabaseErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (data: { booking_id?: string }) => {
    const bid = data?.booking_id;
    const first = items[0];
    if (first?.pricingSummary && bid) {
      try {
        sessionStorage.setItem(`booking_pricing_${bid}`, first.pricingSummary);
      } catch {
        /* ignore quota / private mode */
      }
    }
    if (bid && payableAmount != null && first) {
      trackEvent('purchase', {
        booking_id: bid,
        service_name: first.serviceName ?? 'unknown',
        value: payableAmount,
        currency: 'INR',
      });
      trackMetaPurchase({
        contentIds: [first.serviceId],
        contents: [{ id: first.serviceId, quantity: 1, item_price: first.price }],
        value: payableAmount,
        numItems: 1,
      });
    }
    clearCart();
    navigate(`/checkout/success?bookingId=${bid ?? ''}`);
  };

  const handlePaymentFailure = (error: Error) => {
    console.error('Payment failed:', error);
    trackEvent('payment_failed', { booking_id: bookingId ?? undefined, reason: error.message });
    toast({
      title: 'Payment Failed',
      description: "There was an issue processing your payment. Please try again.",
      variant: 'destructive',
    });
  };

  if (!items.length || items.length > 1) {
    return null;
  }

  const item = items[0];
  const baseAmount = item.price;
  const platformFee = PLATFORM_FEE_RUPEES;
  const summaryTotal = baseAmount + platformFee;
  const displayTotal =
    paymentStep === 'payment' && payableAmount != null ? payableAmount : summaryTotal;

  const canPay =
    paymentStep === 'payment' &&
    bookingId != null &&
    payableAmount != null &&
    Number.isFinite(payableAmount) &&
    payableAmount > 0;

  return (
    <div className="container py-24">
      <h1 className="sr-only">Checkout</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="grid gap-8 md:grid-cols-3">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{item.serviceName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.date} at {item.time}
                      </p>
                      <p className="text-sm">{item.address}</p>
                      {item.pricingSummary && (
                        <p className="text-xs text-muted-foreground mt-1">{item.pricingSummary}</p>
                      )}
                      {item.pricingMetadata && (
                        <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4 space-y-0.5">
                          {item.pricingMetadata.sqft != null && (
                            <li>{item.pricingMetadata.sqft} sq.ft</li>
                          )}
                          {item.pricingMetadata.kw != null && (
                            <li>{item.pricingMetadata.kw} KW</li>
                          )}
                          {(item.pricingMetadata.tankType != null ||
                            item.pricingMetadata.capacityLiters != null) && (
                            <li>
                              Tank {item.pricingMetadata.tankType ?? '—'}
                              {item.pricingMetadata.capacityLiters != null
                                ? `, ${item.pricingMetadata.capacityLiters} L`
                                : ''}
                            </li>
                          )}
                          {item.pricingMetadata.quantity != null && item.pricingMetadata.quantity > 1 && (
                            <li>{item.pricingMetadata.quantity} units</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <p className="font-semibold">₹{item.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 border rounded-lg text-center">
                <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Professional Service</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">24/7 Support</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Satisfaction Guaranteed</p>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Amount</span>
                    <span>₹{baseAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{displayTotal}</span>
                  </div>
                </div>

                {paymentStep === 'booking' ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                ) : canPay ? (
                  <RazorpayCheckout
                    bookingId={bookingId!}
                    amount={payableAmount!}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => handlePaymentFailure(new Error(error))}
                  />
                ) : (
                  <p className="text-sm text-destructive text-center">
                    Payment could not be started. Please go back to your cart and try again.
                  </p>
                )}

                {paymentStep === 'payment' && !canPay && (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/cart')}>
                    Back to cart
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

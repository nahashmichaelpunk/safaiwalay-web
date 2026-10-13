/** Keep in sync with PLATFORM_FEE_RUPEES in supabase/functions razorpay-create-order and razorpay-verify-payment */
export const PLATFORM_FEE_RUPEES = 13;

export function parseBookingPayableRupees(booking: {
  total_amount?: string | null;
  price?: string | null;
}): number {
  const total = parseFloat(booking.total_amount ?? '');
  if (Number.isFinite(total) && total > 0) return total;
  const base = parseFloat(booking.price ?? '') || 0;
  return base + PLATFORM_FEE_RUPEES;
}

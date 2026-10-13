/**
 * Admin data access uses the same browser Supabase client as the rest of the app.
 * Do not ship service-role keys to the frontend — rely on RLS policies that allow
 * authenticated admin users (role checked in policies or via JWT claims).
 */
import { supabase } from './supabase';

/** Back-compat alias: same singleton as `supabase` (no second GoTrue client). */
export const supabaseAdmin = supabase;

// Admin dashboard functions
export async function getDashboardStats() {
  const [
    { data: users, error: usersError },
    { data: bookings, error: bookingsError },
    { data: payments, error: paymentsError },
    { data: reviews, error: reviewsError },
  ] = await Promise.all([
    supabase.from('users').select('count').is('deleted_at', null),
    supabase.from('bookings').select('count').is('deleted_at', null),
    supabase.from('payments').select('amount').eq('status', 'completed').is('deleted_at', null),
    supabase.from('reviews').select('count').is('deleted_at', null),
  ]);

  if (usersError || bookingsError || paymentsError || reviewsError) {
    throw new Error('Error fetching dashboard stats');
  }

  const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

  return {
    total_users: users?.[0]?.count || 0,
    total_bookings: bookings?.[0]?.count || 0,
    total_revenue: totalRevenue,
    total_reviews: reviews?.[0]?.count || 0,
  };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone_number, user_role, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    role: row.user_role ?? 'user',
  }));
}

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      user_id,
      service_id,
      booking_date,
      status,
      amount,
      created_at,
      users (
        first_name,
        last_name,
        email
      ),
      services (
        name
      )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      booking_id,
      user_id,
      amount,
      payment_method,
      status,
      created_at,
      bookings (
        services (
          name
        )
      )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      id,
      booking_id,
      user_id,
      rating,
      comment,
      is_published,
      created_at,
      users (
        first_name,
        last_name
      ),
      bookings (
        services (
          name
        )
      )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin' | 'cleaning_partner') {
  const { error } = await supabase.from('users').update({ user_role: newRole }).eq('id', userId);

  if (error) throw error;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function restoreUser(userId: string) {
  const { error } = await supabase.from('users').update({ deleted_at: null }).eq('id', userId);

  if (error) throw error;
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
) {
  const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);

  if (error) throw error;
}

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: 'pending' | 'completed' | 'failed' | 'refunded'
) {
  const { error } = await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId);

  if (error) throw error;
}

export async function updateReviewStatus(reviewId: string, isPublished: boolean) {
  const { error } = await supabase.from('reviews').update({ is_published: isPublished }).eq('id', reviewId);

  if (error) throw error;
}

export async function createService(serviceData: {
  name: string;
  description: string;
  price: number;
  image?: string;
  duration_minutes: number;
}) {
  const { data, error } = await supabase.from('services').insert(serviceData).select().single();

  if (error) throw error;
  return data;
}

export async function updateService(
  serviceId: string,
  serviceData: {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    duration_minutes?: number;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase.from('services').update(serviceData).eq('id', serviceId).select().single();

  if (error) throw error;
  return data;
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', serviceId);

  if (error) throw error;
}

export async function getRevenueStats(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'completed')
    .is('deleted_at', null);

  if (error) throw error;
  return data;
}

export async function getBookingStats(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('status, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .is('deleted_at', null);

  if (error) throw error;
  return data;
}

export type AdminDashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
export type AdminUser = Awaited<ReturnType<typeof getAllUsers>>[number];
export type AdminBooking = Awaited<ReturnType<typeof getAllBookings>>[number];
export type AdminPayment = Awaited<ReturnType<typeof getAllPayments>>[number];
export type AdminReview = Awaited<ReturnType<typeof getAllReviews>>[number];

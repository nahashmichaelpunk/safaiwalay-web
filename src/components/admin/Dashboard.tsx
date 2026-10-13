import { useEffect, useState } from 'react';
import { getDashboardStats, getAllBookings, getAllPayments, getAllReviews } from '../../lib/supabase-admin';
import type { AdminDashboardStats, AdminBooking, AdminPayment, AdminReview } from '../../lib/supabase-admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel, excluding getAllUsers as it's unused
        const [statsData, bookingsData, paymentsData, reviewsData] = await Promise.all([
          getDashboardStats(),
          getAllBookings(),
          getAllPayments(),
          getAllReviews()
        ]);

        setStats(statsData);
        setBookings(bookingsData);
        setPayments(paymentsData);
        setReviews(reviewsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Users</h3>
          <p className="text-2xl font-bold">{stats?.total_users}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Bookings</h3>
          <p className="text-2xl font-bold">{stats?.total_bookings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">${stats?.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Reviews</h3>
          <p className="text-2xl font-bold">{stats?.total_reviews}</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-2">{booking.id}</td>
                  <td className="px-4 py-2">{booking.user_id}</td>
                  <td className="px-4 py-2">{booking.service_id}</td>
                  <td className="px-4 py-2">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{booking.status}</td>
                  <td className="px-4 py-2">${booking.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Booking</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 5).map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2">{payment.id}</td>
                  <td className="px-4 py-2">{payment.booking_id}</td>
                  <td className="px-4 py-2">{payment.user_id}</td>
                  <td className="px-4 py-2">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-2">{payment.payment_method}</td>
                  <td className="px-4 py-2">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Booking</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Comment</th>
                <th className="px-4 py-2">Published</th>
              </tr>
            </thead>
            <tbody>
              {reviews.slice(0, 5).map((review) => (
                <tr key={review.id}>
                  <td className="px-4 py-2">{review.id}</td>
                  <td className="px-4 py-2">{review.booking_id}</td>
                  <td className="px-4 py-2">{review.user_id}</td>
                  <td className="px-4 py-2">{review.rating}</td>
                  <td className="px-4 py-2">{review.comment}</td>
                  <td className="px-4 py-2">{review.is_published ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
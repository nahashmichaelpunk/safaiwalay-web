import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/store';
import { fetchDashboardData, deleteUser, restoreUser, updateUser, supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Database } from '@/lib/database.types';
import { Users, Calendar, DollarSign, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type UserRow = Database['public']['Tables']['users']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];

interface UserFormData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'cleaning_partner';
  created_at?: string;
  deleted_at?: string | null;
}

interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  address: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'refunded';
  created_at: string;
  price?: string;
  amount?: number | null;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  service: {
    name: string;
    price: number;
  };
  payments: Array<{
    status: string;
    amount: number;
  }>;
}

interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  byStatus: {
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  byMonth: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_published: boolean;
  user_id: string;
  booking_id: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  booking?: {
    service?: {
      name: string;
    };
  };
}

/** Row shape of the analytics bookings query (booking joined with its service price). */
interface AnalyticsBookingRow {
  status: string;
  created_at: string;
  price: string | null;
  service: { price: number } | null;
}

interface DashboardData {
  users: UserRow[];
  bookings: Booking[];
  reviews: Review[];
  services: ServiceRow[];
  totalRevenue: number;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    users: [],
    bookings: [],
    reviews: [],
    services: [],
    totalRevenue: 0,
  });
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<UserFormData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState<BookingAnalytics>({
    totalBookings: 0,
    totalRevenue: 0,
    byStatus: {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    byMonth: []
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Bulk selection state
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, showDeleted]);

  useEffect(() => {
    loadUsers();
  }, [showDeleted]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Fetch bookings with service information
      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          service:service_id (
            name
          )
        `);

      if (bookingsError) throw bookingsError;

      // Fetch reviews with user and booking information
      const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name
          ),
          booking:booking_id (
            service:service_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch services
      const { data: services, error: servicesError } = await supabaseAdmin
        .from('services')
        .select('*');

      if (servicesError) throw servicesError;

      // Calculate total revenue from completed bookings
      const bookingRows = bookings as unknown as Booking[];
      const totalRevenue = bookingRows
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + (booking.amount || 0), 0);

      setDashboardData({
        users,
        bookings: bookingRows,
        reviews: reviews as unknown as Review[],
        services,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDashboardData();
      if (data) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      
      // Get all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          status,
          created_at,
          price,
          service:service_id (
            price
          )
        `);

      if (bookingsError) throw bookingsError;

      const rows = (bookings ?? []) as unknown as AnalyticsBookingRow[];

      // Calculate analytics
      const analytics: BookingAnalytics = {
        totalBookings: rows.length,
        totalRevenue: rows.reduce((sum, booking) => {
          const bookingPrice = booking.price ? Number(booking.price.replace('₹', '')) : (booking.service?.price || 0);
          return sum + bookingPrice;
        }, 0),
        byStatus: {
          pending: rows.filter(b => b.status === 'pending').length,
          confirmed: rows.filter(b => b.status === 'confirmed').length,
          in_progress: rows.filter(b => b.status === 'in_progress').length,
          completed: rows.filter(b => b.status === 'completed').length,
          cancelled: rows.filter(b => b.status === 'cancelled').length
        },
        byMonth: []
      };

      // Group by month
      const monthlyData = rows.reduce((acc, booking) => {
        const month = new Date(booking.created_at).toLocaleString('default', { month: 'long', year: 'numeric' });
        const bookingPrice = booking.price ? Number(booking.price.replace('₹', '')) : (booking.service?.price || 0);
        const existing = acc.find(m => m.month === month);
        if (existing) {
          existing.bookings++;
          existing.revenue += bookingPrice;
        } else {
          acc.push({ month, bookings: 1, revenue: bookingPrice });
        }
        return acc;
      }, [] as Array<{ month: string, bookings: number, revenue: number }>);

      analytics.byMonth = monthlyData;
      
      setAnalytics(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await restoreUser(userId);
      toast({
        title: "User Restored",
        description: "The user has been restored successfully.",
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast({
        title: "Error",
        description: "Failed to restore user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser?.id) return;
    try {
      await updateUser(selectedUser.id, {
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        user_role: selectedUser.role,
        is_active: !selectedUser.deleted_at
      });
      toast({
        title: "User Updated",
        description: "User profile has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    setLoadingBookings(prev => ({ ...prev, [bookingId]: true }));
    try {
      const updateData: {
        status: Booking['status'];
        completed_at?: string;
        cancelled_at?: string;
        payment_status?: string;
      } = { status: newStatus };
      
      // Add timestamp based on status
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.payment_status = 'paid';
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus}.`,
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBookings(prev => {
        const newState = { ...prev };
        delete newState[bookingId];
        return newState;
      });
    }
  };

  const handleApproveReview = async (review: Review) => {
    try {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ is_published: true })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Review Approved",
        description: "The review has been published successfully.",
      });

      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Error",
        description: "Failed to approve review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproveDialogOpen(false);
      setSelectedReview(null);
    }
  };

  const handleRejectReview = async (review: Review) => {
    try {
      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Review Rejected",
        description: "The review has been removed successfully.",
      });

      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: "Error",
        description: "Failed to reject review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejectDialogOpen(false);
      setSelectedReview(null);
    }
  };

  // Bulk selection functions
  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAllBookings = () => {
    const filteredBookings = dashboardData.bookings
      .filter((booking: Booking) => 
        bookingFilter === 'all' || booking.status === bookingFilter
      );
    
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((booking: Booking) => booking.id));
    }
  };

  const handleBulkCompleteBookings = async () => {
    if (selectedBookings.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          payment_status: 'paid'
        })
        .in('id', selectedBookings);

      if (error) throw error;

      toast({
        title: "Bookings Completed",
        description: `${selectedBookings.length} booking(s) have been marked as completed.`,
      });

      setSelectedBookings([]);
      await loadDashboardData();
    } catch (error) {
      console.error('Error completing bookings:', error);
      toast({
        title: "Error",
        description: "Failed to complete bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkCancelBookings = async () => {
    if (selectedBookings.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString()
        })
        .in('id', selectedBookings);

      if (error) throw error;

      toast({
        title: "Bookings Cancelled",
        description: `${selectedBookings.length} booking(s) have been cancelled.`,
      });

      setSelectedBookings([]);
      await loadDashboardData();
    } catch (error) {
      console.error('Error cancelling bookings:', error);
      toast({
        title: "Error",
        description: "Failed to cancel bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/signin" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.bookings.filter((b) => b.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{dashboardData.totalRevenue.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.reviews && dashboardData.reviews.length > 0
                  ? (dashboardData.reviews
                      .filter((r) => r && typeof r.rating === 'number')
                      .reduce((acc, r) => acc + r.rating, 0) /
                      Math.max(dashboardData.reviews.filter((r) => r && typeof r.rating === 'number').length, 1)
                    ).toFixed(1)
                  : '0.0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  variant={showDeleted ? "default" : "outline"}
                  onClick={() => setShowDeleted(!showDeleted)}
                >
                  {showDeleted ? "Show Active Users" : "Show Deleted Users"}
                </Button>
                  </div>
              <Button onClick={() => {
                setSelectedUser(null);
                setIsEditDialogOpen(true);
              }}>
                Add New User
              </Button>
                </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found
                            </div>
                    ) : (
                      users
                        .filter(user => 
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user) => (
                          <Card key={user.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold">
                                    {user.first_name} {user.last_name}
                                  </h3>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-800'
                                      : user.role === 'cleaning_partner'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {user.role?.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                {!user.deleted_at ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.id || '')}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreUser(user.id || '')}
                                  >
                                    Restore
                                  </Button>
                                )}
                          </div>
                            </div>
                      </Card>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={bookingFilter}
                  onValueChange={(value) => {
                    setBookingFilter(value);
                    setSelectedBookings([]);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter bookings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bookings</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedBookings.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedBookings.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkCompleteBookings}
                    disabled={isBulkActionLoading}
                  >
                    Complete Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkCancelBookings}
                    disabled={isBulkActionLoading}
                  >
                    Cancel Selected
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Booking Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length > 0 && selectedBookings.length === dashboardData.bookings.filter((booking: Booking) => 
                        bookingFilter === 'all' || booking.status === bookingFilter
                      ).length}
                      onChange={handleSelectAllBookings}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {dashboardData.bookings
                      .filter((booking: Booking) => 
                        bookingFilter === 'all' || booking.status === bookingFilter
                      )
                      .map((booking: Booking) => (
                        <Card key={booking.id} className={`p-4 ${selectedBookings.includes(booking.id) ? 'ring-2 ring-primary' : ''}`}>
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedBookings.includes(booking.id)}
                                  onChange={() => handleSelectBooking(booking.id)}
                                  className="mt-1 rounded border-gray-300"
                                />
                                <div className="space-y-1">
                                  <h3 className="font-semibold">{booking.service?.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Customer: {booking.user?.first_name} {booking.user?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Email: {booking.user?.email}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Scheduled: {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Address: {booking.address}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Amount: ₹{booking.service?.price}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge variant={
                                  booking.status === 'completed' ? 'default' :
                                  booking.status === 'in_progress' ? 'secondary' :
                                  booking.status === 'confirmed' ? 'outline' :
                                  booking.status === 'cancelled' ? 'destructive' :
                                  'default'
                                }>
                                  {booking.status.toUpperCase()}
                                </Badge>
                                <Badge variant={booking.payment_status === 'paid' ? 'default' : 'destructive'}>
                                  {booking.payment_status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              {booking.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  disabled={loadingBookings[booking.id]}
                                >
                                  Confirm
                                </Button>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'in_progress')}
                                  disabled={loadingBookings[booking.id]}
                                >
                                  Start
                                </Button>
                              )}
                              {booking.status === 'in_progress' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                  disabled={loadingBookings[booking.id]}
                                >
                                  Complete
                                </Button>
                              )}
                              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  disabled={loadingBookings[booking.id]}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                            </div>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Reviews</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.reviews
                      .filter(review => !review.is_published)
                      .map((review) => (
                        <tr key={review.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {review.booking?.service?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{review.comment}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(review.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setIsApproveDialogOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setIsRejectDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Year Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Data from April 1st to March 31st
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.totalBookings}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">₹{analytics.totalRevenue}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.byStatus.completed}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.byStatus.in_progress}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Monthly Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.byMonth.map((month) => (
                            <div key={month.month} className="flex items-center justify-between">
                              <div className="font-medium">{month.month}</div>
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-muted-foreground">
                                  {month.bookings} bookings
                                </div>
                                <div className="font-medium">
                                  ₹{month.revenue}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Booking Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Pending</div>
                            <div>{analytics.byStatus.pending}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Confirmed</div>
                            <div>{analytics.byStatus.confirmed}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">In Progress</div>
                            <div>{analytics.byStatus.in_progress}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Completed</div>
                            <div>{analytics.byStatus.completed}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Cancelled</div>
                            <div>{analytics.byStatus.cancelled}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No analytics data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={selectedUser.first_name}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      first_name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={selectedUser.last_name}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={selectedUser.phone}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value: 'user' | 'admin' | 'cleaning_partner') => 
                      setSelectedUser({
                        ...selectedUser,
                        role: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cleaning_partner">Cleaning partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this review? It will be published and visible to all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedReview && handleApproveReview(selectedReview)}
              >
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this review? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedReview && handleRejectReview(selectedReview)}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
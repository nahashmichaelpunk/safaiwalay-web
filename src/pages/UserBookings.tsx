import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ServiceTracker from '@/components/ServiceTracker';
import { parseBookingPayableRupees } from '@/lib/pricing';
import { downloadBookingInvoice } from '@/lib/invoice-pdf';
import { trackEvent } from '@/lib/monitoring/events';

interface Booking {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  address: string;
  created_at: string;
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | null;
  price: string;
  total_amount?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
}

export default function UserBookings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
      if ((data || []).length > 1) {
        trackEvent('repeat_booking_detected', { count: (data || []).length });
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      trackEvent('api_error', {
        endpoint: 'load_user_bookings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Error',
        description: 'Failed to load your bookings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeBookings = bookings.filter(
    (booking) => booking.status !== 'completed' && booking.status !== 'cancelled'
  );
  const completedBookings = bookings.filter((booking) => booking.status === 'completed');

  const handleDownloadInvoice = async (booking: Booking) => {
    try {
      await downloadBookingInvoice({
        id: booking.id,
        created_at: booking.created_at,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        service_name: booking.service_name,
        address: booking.address,
        price: booking.price,
        total_amount: booking.total_amount ?? null,
        razorpay_payment_id: booking.razorpay_payment_id ?? null,
        razorpay_order_id: booking.razorpay_order_id ?? null,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Could not download invoice',
        description: 'Please check your network and try again.',
        variant: 'destructive',
      });
    }
  };

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{booking.service_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{booking.address}</p>
          </div>
          <Badge className={getStatusColor(booking.status || '')}>
            {(booking.status || 'scheduled').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ServiceTracker
          status={booking.status || 'scheduled'}
          scheduledDate={booking.booking_date}
          scheduledTime={booking.booking_time}
        />
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">₹{parseBookingPayableRupees(booking).toFixed(2)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => handleDownloadInvoice(booking)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>You haven't made any bookings yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {activeBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No active bookings.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">{activeBookings.map(renderBookingCard)}</div>
              )}
            </TabsContent>
            <TabsContent value="completed">
              {completedBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No completed bookings yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">{completedBookings.map(renderBookingCard)}</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}
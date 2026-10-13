import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/store';
import { Camera, User, Star, Pencil, Trash2, Calendar, Clock, MapPin, Download } from 'lucide-react';
import { fetchUserReviews, createReview, updateReview, deleteReview, fetchUserBookings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { parseBookingPayableRupees } from '@/lib/pricing';
import { formatBookingDateTimeForDisplay, formatCreatedAtLabel } from '@/lib/safe-dates';
import ProfileCompletionForm from '@/components/ProfileCompletionForm';
import AddressInput from '@/components/AddressInput';
import MapPicker from '@/components/MapPicker';
import { Separator } from '@/components/ui/separator';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

// Add interfaces
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_published: boolean;
  booking_id: string;
  bookings?: {
    services: {
      name: string;
    };
  };
}

interface Booking {
  id: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  address: string;
  price: string;
  status: string;
  services: { name: string };
  payment_id?: string;
  order_id?: string;
  review_id?: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
  booking_id: string;
}

// Add ReviewDialog component
function ReviewDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  bookings 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => void;
  initialData?: Review;
  bookings: Booking[];
}) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: initialData?.rating || 5,
    comment: initialData?.comment || '',
    booking_id: initialData?.booking_id || '',
  });

  // Filter completed bookings that don't have reviews
  const availableBookings = bookings.filter(booking => 
    booking.status === 'completed' && 
    !booking.review_id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Review' : 'Write a Review'}</DialogTitle>
          <DialogDescription>
            Share your experience with our service
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="booking">Select Booking</Label>
              <select
                id="booking"
                value={formData.booking_id}
                onChange={(e) => setFormData(prev => ({ ...prev, booking_id: e.target.value }))}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select a booking...</option>
                {availableBookings.map((booking) => {
                  const { dateLabel } = formatBookingDateTimeForDisplay(
                    booking.booking_date,
                    booking.booking_time
                  );
                  return (
                    <option key={booking.id} value={booking.id}>
                      {booking.services.name} - {dateLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= formData.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Write your review here..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => onSubmit(formData)}
            disabled={!initialData && !formData.booking_id}
          >
            {initialData ? 'Update Review' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review>();
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.email) return;

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast({
            title: 'Could not load profile',
            description: getSupabaseErrorMessage(error),
            variant: 'destructive',
          });
          return;
        }

        if (profile) {
          const profileData = profile as Record<string, unknown>;
          setFormData(prev => ({
            ...prev,
            phone: profile.phone_number || '',
            address: profile.shipping_address || '',
            latitude: typeof profileData.latitude === 'number' ? profileData.latitude : 0,
            longitude: typeof profileData.longitude === 'number' ? profileData.longitude : 0,
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Could not load profile',
          description: getSupabaseErrorMessage(error),
          variant: 'destructive',
        });
      }
    };

    loadProfile();
  }, [user]);

  // Check if profile needs completion
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.email) return;

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('phone_number, shipping_address, latitude, longitude')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error checking profile:', error);
          return;
        }

        // If phone or address is missing, show profile completion form
        if (
          !profile?.phone_number ||
          !profile?.shipping_address ||
          profile.latitude == null ||
          profile.longitude == null
        ) {
          setNeedsProfileCompletion(true);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    };

    checkProfileCompletion();
  }, [user]);

  // Load bookings and reviews when component mounts
  useEffect(() => {
    if (user) {
      loadBookings();
      loadReviews();
    }
  }, [user]);

  // Existing functions
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = useCallback((address: string) => {
    setFormData((prev) => ({ ...prev, address }));
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
    
    toast({
      title: "Profile picture updated",
      description: "Your profile picture has been updated successfully.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.email) {
        throw new Error('No user email found');
      }

      const { error } = await supabase
        .from('users')
        .update({
          phone_number: formData.phone,
          shipping_address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const userBookings = await fetchUserBookings();
      setBookings(userBookings);
    } catch (error) {
      console.error('Error loading user bookings:', error);
      toast({
        title: "Error",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadReviews = async () => {
    try {
      const userReviews = await fetchUserReviews();
      setReviews(userReviews);
    } catch (error) {
      console.error('Error loading user reviews:', error);
      toast({
        title: 'Error',
        description: getSupabaseErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleReviewSubmit = async (data: ReviewFormData) => {
    try {
      if (selectedReview) {
        // Update existing review
        await updateReview(selectedReview.id, data);
        toast({
          title: "Review Updated",
          description: "Your review has been updated successfully.",
        });
      } else {
        // Create new review
        await createReview(data);
        toast({
          title: "Review Submitted",
          description: "Your review has been submitted successfully.",
        });
      }
      setIsReviewDialogOpen(false);
      setSelectedReview(undefined);
      loadReviews(); // Refresh reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setIsReviewDialogOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
    try {
      await deleteReview(reviewId);
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
      });
        loadReviews(); // Refresh reviews
    } catch (error) {
        console.error('Error deleting review:', error);
      toast({
        title: "Error",
          description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    }
    }
  };

  const generateReceipt = (booking: Booking) => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('SafaiWalay', 20, 20);
      doc.setFontSize(12);
      doc.text('Receipt', 20, 30);

      doc.setFontSize(10);
      doc.text('Receipt Details:', 20, 45);
      doc.text(`Date: ${formatCreatedAtLabel(booking.created_at)}`, 20, 55);
      doc.text(`Receipt No: RCP-${booking.id.substring(0, 8)}`, 20, 60);
      doc.text(`Payment ID: ${booking.payment_id || 'N/A'}`, 20, 65);

      doc.text('Service Details:', 20, 80);
      doc.text(`Service: ${booking.services.name}`, 20, 90);
      const { dateLabel, timeLabel } = formatBookingDateTimeForDisplay(
        booking.booking_date,
        booking.booking_time
      );
      doc.text(`Date: ${dateLabel}`, 20, 95);
      doc.text(`Time: ${timeLabel}`, 20, 100);
      doc.text(`Address: ${booking.address}`, 20, 105);

      const baseAmount = parseFloat(booking.price) || 0;
      const totalPayable = parseBookingPayableRupees(booking);
      const platformFee = Math.max(0, totalPayable - baseAmount);

      autoTable(doc, {
        startY: 120,
        head: [['Description', 'Amount (₹)']],
        body: [
          ['Service Charge', baseAmount.toFixed(2)],
          ['Platform Fee', platformFee.toFixed(2)],
          ['Total Amount', totalPayable.toFixed(2)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`receipt-${booking.id}.pdf`);
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: 'Could not download receipt',
        description: getSupabaseErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  if (needsProfileCompletion) {
    return <ProfileCompletionForm email={user?.email || ''} fullName={user?.name || ''} userId={user?.id || ''} />;
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  const hasValidProfileLocation =
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude) &&
    formData.latitude !== 0 &&
    formData.longitude !== 0;
  const profileMapInitialLat = hasValidProfileLocation ? formData.latitude : 21.1458;
  const profileMapInitialLng = hasValidProfileLocation ? formData.longitude : 79.0882;

  return (
    <div className="container py-12 md:py-24">
      <h1 className="sr-only">Your profile</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage || "https://github.com/shadcn.png"} alt="Profile Picture" />
                  <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                <Label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer">
                        <Camera className="h-4 w-4" />
                  <Input
                    id="profile-image-upload"
                        type="file"
                    className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                </Label>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{formData.name}</h2>
                <p className="text-muted-foreground">{formData.email}</p>
                {formData.phone && <Badge variant="secondary" className="mt-2">{formData.phone}</Badge>}
                    </div>
                  </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="bookings">Your Bookings</TabsTrigger>
                <TabsTrigger value="reviews">Your Reviews</TabsTrigger>
              </TabsList>

              {/* Profile Information Tab */}
              <TabsContent value="profile" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <AddressInput
                      value={formData.address}
                      onChange={handleAddressChange}
                      onLocationChange={handleLocationChange}
                      placeholder="Enter your complete address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pinpoint your house on map</Label>
                    <MapPicker
                      initialLat={profileMapInitialLat}
                      initialLng={profileMapInitialLng}
                      onLocationSelect={handleLocationChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Saved coordinates:{' '}
                      {hasValidProfileLocation
                        ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                        : 'Not selected yet'}
                    </p>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </TabsContent>

              {/* Your Bookings Tab */}
              <TabsContent value="bookings" className="mt-6">
                {isLoadingBookings ? (
                <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                    </div>
                    </Card>
                    </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground">You have no past bookings.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const schedule = formatBookingDateTimeForDisplay(
                        booking.booking_date,
                        booking.booking_time,
                        { datePattern: 'MMM d, yyyy', timePattern: 'hh:mm a' }
                      );
                      return (
                      <Card key={booking.id} className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                            <h4 className="font-semibold text-lg">{booking.services.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> {schedule.dateLabel}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" /> {schedule.timeLabel}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {booking.address || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                            <p className="font-bold text-lg">
                              ₹{parseBookingPayableRupees(booking).toFixed(0)}
                            </p>
                            <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateReceipt(booking)}
                          >
                            <Download className="h-4 w-4 mr-2" /> Invoice
                          </Button>
                        </div>
                      </Card>
                    );
                    })}
                  </div>
                  )}
              </TabsContent>

              {/* Your Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Your Reviews ({reviews.length})</h3>
                  <Button onClick={() => setIsReviewDialogOpen(true)}>Write a Review</Button>
                </div>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">You haven't written any reviews yet.</p>
                ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                  <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1 text-yellow-400">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-current" />
                                ))}
                              </div>
                          <Badge variant={review.is_published ? 'default' : 'secondary'}>
                            {review.is_published ? 'Published' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2">
                          {formatCreatedAtLabel(review.created_at)}
                          {review.bookings?.services?.name && 
                            ` for ${review.bookings.services.name}`}
                                </p>
                        <p className="mt-2">{review.comment}</p>
                        <div className="flex justify-end gap-2 mt-4">
                              <Button
                            variant="outline" 
                            size="sm" 
                                onClick={() => handleEditReview(review)}
                              >
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                              </Button>
                              <Button
                            variant="destructive" 
                            size="sm" 
                                onClick={() => handleDeleteReview(review.id)}
                              >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </Button>
                        </div>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <ReviewDialog
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        onSubmit={handleReviewSubmit}
        initialData={selectedReview}
        bookings={bookings}
      />
    </div>
  );
}
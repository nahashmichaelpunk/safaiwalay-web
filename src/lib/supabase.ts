import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { PLATFORM_FEE_RUPEES } from './pricing';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom storage implementation
const customStorage: Storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Handle error silently
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle error silently
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch {
      // Handle error silently
    }
  },
  key: (index: number): string | null => {
    try {
      return localStorage.key(index);
    } catch {
      return null;
    }
  },
  length: localStorage.length
};

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: customStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public'
    }
  }
);

// Initialize auth state (session + profile). Returns null when logged out or on recoverable failure.
export async function initializeAuth() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      return null;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.debug('Session invalid, user not found');
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_role, is_active')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    if (!profile) {
      return null;
    }

    if (!profile.is_active) {
      logger.debug('User account is inactive');
      await supabase.auth.signOut();
      throw new Error('Account is inactive');
    }

    return {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      role: profile.user_role ?? 'user',
      isActive: profile.is_active,
      emailVerified: session.user.email_confirmed_at !== null
    };
  } catch (error) {
    console.error('Auth initialization error:', error);
    return null;
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  try {
    logger.debug('Starting sign out process');

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
      throw error;
    }

    try {
      localStorage.removeItem('safaiwalay-auth');
      localStorage.removeItem('cart-storage');
      localStorage.removeItem('chat-storage');
      sessionStorage.clear();
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
    }

    logger.debug('Sign out completed successfully');
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    try {
      localStorage.removeItem('safaiwalay-auth');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  }
}

// Get current user profile
export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) throw profileError;
    return profile;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Fetch services
export async function fetchServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fetch services error:', error);
    throw error;
  }
}

// Create booking
export async function createBooking(bookingData: {
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  price: number;
  name: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    const totalAmount = bookingData.price + PLATFORM_FEE_RUPEES;

    const bookingInsert: Database['public']['Tables']['bookings']['Insert'] = {
      user_id: user.id,
      service_id: bookingData.serviceId,
      service_name: bookingData.serviceName,
      booking_date: bookingData.date,
      booking_time: bookingData.time,
      address: bookingData.address,
      price: bookingData.price.toString(),
      customer_name: bookingData.name,
      customer_email: bookingData.email,
      customer_phone: bookingData.phone,
      location_lat: bookingData.latitude.toString(),
      location_lng: bookingData.longitude.toString(),
      status: 'scheduled',
      payment_type: 'full',
      payment_status: 'pending',
      payment_method: 'razorpay',
      total_amount: totalAmount.toString(),
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingInsert)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
}

// Fetch user reviews
export async function fetchUserReviews() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        bookings (
          services (name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fetch user reviews error:', error);
    throw error;
  }
}

// Create review
export async function createReview(reviewData: {
  rating: number;
  comment: string;
  booking_id: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        booking_id: reviewData.booking_id,
        is_published: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update the booking with the review_id
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ review_id: data.id })
      .eq('id', reviewData.booking_id);

    if (bookingError) throw bookingError;

    return data;
  } catch (error) {
    console.error('Create review error:', error);
    throw error;
  }
}

// Update review
export async function updateReview(reviewId: string, reviewData: {
  rating: number;
  comment: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating: reviewData.rating,
        comment: reviewData.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update review error:', error);
    throw error;
  }
}

// Delete review
export async function deleteReview(reviewId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // First, get the booking_id associated with this review
    const { data: review, error: reviewFetchError } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (reviewFetchError) throw reviewFetchError;

    // Update the booking to remove the review_id reference
    if (review.booking_id) {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ review_id: null })
        .eq('id', review.booking_id);

      if (bookingError) throw bookingError;
    }

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
}

// Fetch user bookings
export async function fetchUserBookings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    throw error;
  }
}

// Verify Razorpay payment
export async function verifyRazorpayPayment(bookingId: string, paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
      body: {
        booking_id: bookingId,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    throw error;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;
    if (!user) throw new Error('No user returned after sign in');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('User profile not found');
    if (!profile.is_active) throw new Error('Account is inactive');

    return {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      role: profile.user_role ?? 'user',
      isActive: profile.is_active,
      emailVerified: user.email_confirmed_at !== null
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign in with email and password (admin)
export async function signInAdmin(email: string, password: string) {
  try {
    const profile = await signIn(email, password);
    if (profile.role !== 'admin') {
      throw new Error('Unauthorized. Admin access only.');
    }
    return profile;
  } catch (error) {
    console.error('Admin sign in error:', error);
    throw error;
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  try {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user returned after sign up');

    return {
      id: user.id,
      email: user.email,
      name: `${firstName} ${lastName}`.trim(),
      role: 'user',
      isActive: true,
      emailVerified: user.email_confirmed_at !== null
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error) throw error;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

// Update profile
export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    const updates: Database['public']['Tables']['users']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.phone !== undefined) updates.phone_number = data.phone;
    if (data.address !== undefined) updates.shipping_address = data.address;
    if (data.profileImage !== undefined) updates.profile_image = data.profileImage;

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) throw updateError;

    return {
      ...updates,
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Admin functions
export async function fetchDashboardData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.user_role !== 'admin') throw new Error('Unauthorized');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;
    const normalizedUsers = (users || []).map((row) => ({
      ...row,
      phone: row.phone_number ?? '',
      address: row.shipping_address ?? '',
      role: row.user_role ?? 'user',
    }));

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    return { users: normalizedUsers, bookings };
  } catch (error) {
    console.error('Fetch dashboard data error:', error);
    throw error;
  }
}

export async function fetchBookingAnalytics() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.user_role !== 'admin') throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('bookings')
      .select('status, created_at, price');

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Fetch booking analytics error:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.user_role !== 'admin') throw new Error('Unauthorized');

    const { error } = await supabase
      .from('users')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

export async function restoreUser(userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.user_role !== 'admin') throw new Error('Unauthorized');

    const { error } = await supabase
      .from('users')
      .update({ is_active: true, deleted_at: null })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Restore user error:', error);
    throw error;
  }
}

export async function updateUser(userId: string, data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  user_role?: 'user' | 'admin' | 'cleaning_partner';
  is_active?: boolean;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.user_role !== 'admin') throw new Error('Unauthorized');

    const updates = {
      ...(data.first_name && { first_name: data.first_name }),
      ...(data.last_name && { last_name: data.last_name }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone_number: data.phone }),
      ...(data.user_role && { user_role: data.user_role }),
      ...(typeof data.is_active === 'boolean' && { is_active: data.is_active }),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}

export async function resendVerificationEmail() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No authenticated user email');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  } catch (error) {
    console.error('Resend verification email error:', error);
    throw error;
  }
}

/** True if Supabase reports a valid session and user (validates JWT with server). */
export async function validateCurrentSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return false;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    return !userError && !!user;
  } catch {
    return false;
  }
}

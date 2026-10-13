import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/lib/store';
import { initializeAuth, supabase, validateCurrentSession } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Analytics from '@/components/Analytics';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Contact from '@/pages/Contact';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import SignIn from '@/pages/SignIn';
import AuthCallback from '@/pages/AuthCallback';
import AuthResetPassword from '@/pages/AuthResetPassword';
import Profile from '@/pages/Profile';
import BookService from '@/pages/BookService';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import Admin from '@/pages/Admin';
// Admin login removed - using consolidated login page
import AdminCreateUser from '@/pages/AdminCreateUser';
import UserBookings from './pages/UserBookings';
import Areas from './pages/Areas';
import LocalTestimonials from './pages/LocalTestimonials';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ServiceLandingPage from './pages/ServiceLandingPage';
import AreaLandingPage from './pages/AreaLandingPage';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';
import RoutedSegmentErrorBoundary from '@/components/RoutedSegmentErrorBoundary';
import WhatsAppChatBubble from '@/components/WhatsAppChatBubble';
import SEOHead from '@/components/seo/SEOHead';
import { getRouteSeo } from '@/lib/seo/route-seo';
import SentryErrorTestButton from '@/components/SentryErrorTestButton';
import { logger } from '@/lib/logger';

function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: 'admin';
}) {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!user) {
        if (!cancelled) {
          setIsValid(false);
          setIsValidating(false);
        }
        return;
      }

      try {
        const valid = await validateCurrentSession();
        if (!cancelled) {
          setIsValid(valid);
        }
      } catch {
        if (!cancelled) {
          setIsValid(false);
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false);
        }
      }
    };

    void validateSession();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="sr-only">Verifying session</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isValid) {
    return <Navigate to="/signin" replace />;
  }

  if (requireRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function NoIndexPage({
  routePath,
  children,
}: {
  routePath: string;
  children: ReactNode;
}) {
  const seo = getRouteSeo(routePath);

  return (
    <>
      {seo && (
        <SEOHead
          title={seo.title}
          description={seo.description}
          canonical={seo.canonical}
          robots={seo.robots ?? 'noindex,nofollow'}
        />
      )}
      {children}
    </>
  );
}

function App() {
  const { setUser, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      logger.debug('Initializing app, current user:', user);
      try {
        // Check if we're on the auth callback route
        const isAuthCallback = window.location.pathname === '/auth/callback';
        
        if (!isAuthCallback) {
          const profile = await initializeAuth();
          
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              isActive: profile.isActive,
              emailVerified: profile.emailVerified,
            });
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        logger.error('Application initialization error:', error);
        setError(error instanceof Error ? error.message : 'Unknown initialization error');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [setUser]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (import.meta.env.DEV) {
        logger.debug('Auth state changed:', event, session?.user?.id);
      }

      try {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const profile = await initializeAuth();
          if (!mounted) return;

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              isActive: profile.isActive,
              emailVerified: profile.emailVerified,
            });
          } else if (session?.user) {
            const stillValid = await validateCurrentSession();
            if (!mounted) return;
            if (!stillValid) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        logger.error('Auth state change error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
          if (import.meta.env.DEV) {
            logger.debug('Network error during auth refresh, keeping current state');
          }
          return;
        }
        if (mounted) {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="sr-only">Loading application</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="sr-only">Application error</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Analytics />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route element={<RoutedSegmentErrorBoundary />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceLandingPage />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/areas/:slug" element={<AreaLandingPage />} />
            <Route path="/testimonials" element={<LocalTestimonials />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<AuthResetPassword />} />
            <Route
              path="/debug"
              element={
                <div className="p-8 sm:p-12">
                  {import.meta.env.PROD ? (
                    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
                      Debug error trigger is disabled in production.
                    </div>
                  ) : (
                    <SentryErrorTestButton />
                  )}
                </div>
              }
            />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/profile">
                    <Profile />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:serviceId"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/checkout">
                    <BookService />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/cart">
                    <Cart />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/checkout">
                    <Checkout />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/checkout/success">
                    <CheckoutSuccess />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <NoIndexPage routePath="/bookings">
                    <UserBookings />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <NoIndexPage routePath="/admin">
                    <Admin />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-user"
              element={
                <ProtectedRoute requireRole="admin">
                  <NoIndexPage routePath="/admin">
                    <AdminCreateUser />
                  </NoIndexPage>
                </ProtectedRoute>
              }
            />
            </Route>
          </Routes>
        </main>
        <Footer />
        <FeatureErrorBoundary name="FeatureErrorBoundary[WhatsApp]">
          <WhatsAppChatBubble />
        </FeatureErrorBoundary>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
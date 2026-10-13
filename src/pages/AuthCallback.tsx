import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import ProfileCompletionForm from '@/components/ProfileCompletionForm';
import SEOHead from '@/components/seo/SEOHead';
import { getRouteSeo } from '@/lib/seo/route-seo';
import { trackEvent } from '@/lib/monitoring/events';
import { logger } from '@/lib/logger';

export default function AuthCallback() {
  const seo = getRouteSeo('/auth/callback');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email: string;
    fullName: string;
    userId: string;
  } | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        logger.debug('Auth callback started');
        
        // Get the session after OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session?.user) {
          console.error('No user in session');
          throw new Error('No user found in session');
        }

        logger.debug('User resolved from session');

        // Check if user exists in public.users table
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Database error:', userError);
          throw userError;
        }

        // If user exists and has complete profile, sign them in
        if (existingUser && existingUser.phone_number && existingUser.shipping_address) {
          logger.debug('User has complete profile, signing in');
          logger.debug('User data loaded from database');
          
          const role = existingUser.user_role ?? 'user';
          const userData = {
            id: existingUser.id,
            email: existingUser.email,
            name: `${existingUser.first_name || ''} ${existingUser.last_name || ''}`.trim(),
            role,
            isActive: existingUser.is_active,
            emailVerified: session.user.email_confirmed_at !== null
          };

          logger.debug('Setting user data');
          setUser(userData);
          trackEvent('login_success', { method: 'google' });
          
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });

          // Redirect based on user role
          logger.debug('User role for redirect:', role);
          if (role === 'admin') {
            logger.debug('Redirecting to admin dashboard');
            navigate('/admin');
          } else {
            logger.debug('Redirecting to home');
            navigate('/');
          }
          return;
        }

        // If user doesn't exist or profile is incomplete, show profile form
        logger.debug('User needs to complete profile');
        
        const fullName = session.user.user_metadata?.full_name || 
                        `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() ||
                        session.user.email?.split('@')[0] || '';

        setUserInfo({
          email: session.user.email || '',
          fullName,
          userId: session.user.id
        });

        setShowProfileForm(true);

      } catch (error) {
        console.error('Auth callback error:', error);
        trackEvent('api_error', {
          endpoint: 'auth_callback',
          message: getSupabaseErrorMessage(error),
        });
        
        toast({
          title: "Authentication Failed",
          description: getSupabaseErrorMessage(error),
          variant: "destructive",
        });

        navigate('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, setUser]);

  if (isLoading) {
    return (
      <>
        {seo && (
          <SEOHead
            title={seo.title}
            description={seo.description}
            canonical={seo.canonical}
            robots={seo.robots}
          />
        )}
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="sr-only">Completing sign in</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </>
    );
  }

  if (showProfileForm && userInfo) {
    return (
      <>
        {seo && (
          <SEOHead
            title={seo.title}
            description={seo.description}
            canonical={seo.canonical}
            robots={seo.robots}
          />
        )}
        <div className="min-h-screen flex items-center justify-center p-4">
          <ProfileCompletionForm
            email={userInfo.email}
            fullName={userInfo.fullName}
            userId={userInfo.userId}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {seo && (
        <SEOHead
          title={seo.title}
          description={seo.description}
          canonical={seo.canonical}
          robots={seo.robots}
        />
      )}
    </>
  );
}
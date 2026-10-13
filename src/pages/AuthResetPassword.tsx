import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase, updatePassword } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import SEOHead from '@/components/seo/SEOHead';
import { getRouteSeo } from '@/lib/seo/route-seo';

export default function AuthResetPassword() {
  const seo = getRouteSeo('/auth/reset-password');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setError('This reset link is invalid or has expired. Please request a new password reset email.');
        }
      } catch (err) {
        console.error('Reset password session error:', err);
        setError(getSupabaseErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Missing information',
        description: 'Please enter and confirm your new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password should be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await updatePassword(newPassword);

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully reset. You can now sign in with your new password.',
      });

      navigate('/signin');
    } catch (err) {
      console.error('Update password error:', err);
      toast({
        title: 'Failed to reset password',
        description: getSupabaseErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="sr-only">Reset password</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
      <div className="container flex items-center justify-center min-h-screen py-12">
        <h1 className="sr-only">Reset your password</h1>
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            {error
              ? error
              : 'Enter a new password for your Safaiwalay account.'}
          </CardDescription>
        </CardHeader>
        {!error && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                    <span>Updating password...</span>
                  </div>
                ) : (
                  'Update password'
                )}
              </Button>
            </form>
          </CardContent>
        )}
        </Card>
      </div>
    </>
  );
}


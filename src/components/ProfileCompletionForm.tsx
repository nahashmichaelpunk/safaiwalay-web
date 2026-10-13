import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddressInput from '@/components/AddressInput';
import MapPicker from '@/components/MapPicker';
import { logger } from '@/lib/logger';

interface ProfileCompletionFormProps {
  email: string;
  fullName: string;
  userId: string;
}

export default function ProfileCompletionForm({ email, fullName, userId }: ProfileCompletionFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    shipping_address: '',
    latitude: 0,
    longitude: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = useCallback((address: string) => {
    setFormData((prev) => ({ ...prev, shipping_address: address }));
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      logger.debug('Starting profile completion');
      
      // Validate inputs
      if (!formData.phone_number || formData.phone_number.length < 10) {
        throw new Error('Please enter a valid phone number');
      }
      
      if (!formData.shipping_address || formData.shipping_address.length < 10) {
        throw new Error('Please enter a complete address');
      }

      if (
        !Number.isFinite(formData.latitude) ||
        !Number.isFinite(formData.longitude) ||
        formData.latitude === 0 ||
        formData.longitude === 0
      ) {
        throw new Error('Please drop the map pin to set your exact house location');
      }

      // Split name into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser || sessionUser.id !== userId) {
        throw new Error('Session expired. Please sign in again.');
      }

      logger.debug('Updating user profile');

      const now = new Date().toISOString();
      const profilePayload = {
        first_name: firstName,
        last_name: lastName,
        phone_number: formData.phone_number,
        shipping_address: formData.shipping_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        updated_at: now
      };

      const { data: existingRow, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (lookupError) {
        console.error('Lookup error:', lookupError);
        throw lookupError;
      }

      if (!existingRow) {
        const { error: insertError } = await supabase.from('users').insert({
          id: userId,
          email,
          ...profilePayload,
          user_role: 'user',
          is_active: true
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      } else {
        const { error: updateError } = await supabase
          .from('users')
          .update(profilePayload)
          .eq('id', userId);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      }

      logger.debug('Profile saved successfully, fetching updated profile');

      // Fetch the updated profile
      const { data: profile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      if (!profile) {
        throw new Error('Failed to fetch updated profile');
      }

      logger.debug('Updated profile fetched');

      // Set user in auth store
      const userData = {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        role: profile.user_role ?? 'user',
        isActive: profile.is_active,
        emailVerified: true
      };

      setUser(userData);

      toast({
        title: "Profile Completed",
        description: "Your profile has been successfully updated.",
      });

      logger.debug('Navigating to home page');
      navigate('/');
      
    } catch (error) {
      console.error('Profile completion error:', error);
      toast({
        title: "Profile Update Failed",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidLocation =
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude) &&
    formData.latitude !== 0 &&
    formData.longitude !== 0;
  const mapInitialLat = hasValidLocation ? formData.latitude : 21.1458;
  const mapInitialLng = hasValidLocation ? formData.longitude : 79.0882;

  return (
    <Card className="w-full max-w-md mx-auto">
      <h1 className="sr-only">Complete your profile</h1>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Please provide your contact information to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone_number"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <AddressInput
              value={formData.shipping_address}
              onChange={handleAddressChange}
              onLocationChange={handleLocationChange}
              placeholder="Enter your complete address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Pinpoint your house on map</Label>
            <MapPicker
              initialLat={mapInitialLat}
              initialLng={mapInitialLng}
              onLocationSelect={handleLocationChange}
            />
            <p className="text-xs text-muted-foreground">
              Selected coordinates:{' '}
              {hasValidLocation
                ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                : 'Not selected yet'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                <span>Updating Profile...</span>
              </div>
            ) : (
              'Complete Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
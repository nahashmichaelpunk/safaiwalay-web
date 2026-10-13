import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCart, useAuth, BookingItem } from '@/lib/store';
import AddressInput from '@/components/AddressInput';
import MapPicker from '@/components/MapPicker';
import { supabase } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import {
  calculateBookingPrice,
  getPricingMode,
  validatePricingInputs,
  type PricingInputs,
} from '@/lib/service-pricing';
import { trackEvent, trackMetaAddToCart, trackMetaViewContent } from '@/lib/monitoring/events';

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  price_description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BookService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const addItem = useCart((state) => state.addItem);
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date: '',
    time: '',
    latitude: 0,
    longitude: 0,
  });

  const [pricingInputs, setPricingInputs] = useState<{
    quantity: number;
    sqft: string;
    kw: string;
    tankType: 'plastic' | 'concrete';
    capacityLiters: string;
  }>({
    quantity: 1,
    sqft: '',
    kw: '',
    tankType: 'plastic',
    capacityLiters: '',
  });

  // Check authentication first
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book a service.',
        variant: 'destructive',
      });
      navigate('/signin');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setIsLoading(false);
        navigate('/services');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Service fetch error:', error);
          throw error;
        }

        if (!data) {
          toast({
            title: 'Service not found',
            description: 'The requested service could not be found.',
            variant: 'destructive',
          });
          navigate('/services');
          return;
        }

        setService(data);
      } catch (error) {
        console.error('Error fetching service:', error);
        toast({
          title: 'Error',
          description: getSupabaseErrorMessage(error),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate, toast]);

  useEffect(() => {
    setPricingInputs({
      quantity: 1,
      sqft: '',
      kw: '',
      tankType: 'plastic',
      capacityLiters: '',
    });
  }, [serviceId]);

  useEffect(() => {
    if (!service) return;
    trackEvent('view_service', {
      service_id: service.id,
      service_name: service.name,
    });
    trackEvent('start_booking', {
      service_id: service.id,
      service_name: service.name,
    });
    trackMetaViewContent({
      contentId: service.id,
      contentName: service.name,
      value: service.price,
      contentCategory: 'Cleaning Services',
    });
  }, [service]);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (error) throw error;

          if (profile) {
            const p = profile as Record<string, unknown>;
            setFormData((prev) => ({
              ...prev,
              name: `${profile.first_name} ${profile.last_name}`.trim(),
              email: profile.email || session.user.email || '',
              phone: profile.phone_number || '',
              address: profile.shipping_address || '',
              latitude: typeof p.latitude === 'number' ? p.latitude : 0,
              longitude: typeof p.longitude === 'number' ? p.longitude : 0,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Hooks must run every render before any early return (fixes React #310)
  const pricingInputsForCalc: PricingInputs = useMemo(
    () => ({
      quantity: pricingInputs.quantity,
      sqft: pricingInputs.sqft === '' ? undefined : Number(pricingInputs.sqft),
      kw: pricingInputs.kw === '' ? undefined : Number(pricingInputs.kw),
      tankType: pricingInputs.tankType,
      capacityLiters:
        pricingInputs.capacityLiters === '' ? undefined : Number(pricingInputs.capacityLiters),
    }),
    [pricingInputs]
  );

  const estimated = useMemo(() => {
    if (!service) return null;
    const err = validatePricingInputs(service.name, pricingInputsForCalc);
    if (err) return null;
    try {
      return calculateBookingPrice(service.name, service.price, pricingInputsForCalc);
    } catch {
      return null;
    }
  }, [service, pricingInputsForCalc]);

  const mode = service ? getPricingMode(service.name) : 'unit';
  const hasValidLocation =
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude) &&
    formData.latitude !== 0 &&
    formData.longitude !== 0;
  const mapInitialLat = hasValidLocation ? formData.latitude : 21.1458;
  const mapInitialLng = hasValidLocation ? formData.longitude : 79.0882;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = useCallback((address: string) => {
    setFormData((prev) => ({ ...prev, address }));
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!service) {
        trackEvent('booking_validation_error', {
          field: 'service',
          reason: 'service_unavailable',
          service_id: serviceId || 'unknown',
        });
        toast({
          title: 'Service unavailable',
          description: 'Please go back and select a service again.',
          variant: 'destructive',
        });
        return;
      }

      try {
        if (!user) {
          trackEvent('booking_validation_error', {
            field: 'auth',
            reason: 'user_not_signed_in',
            service_id: service.id,
          });
          toast({
            title: 'Authentication Required',
            description: 'Please sign in to book a service.',
            variant: 'destructive',
          });
          navigate('/signin');
          return;
        }

        if (!formData.date || !formData.time || !formData.address || !formData.phone) {
          trackEvent('booking_validation_error', {
            field: 'form',
            reason: 'missing_required_fields',
            service_id: service.id,
          });
          toast({
            title: 'Missing Information',
            description: 'Please fill in all required fields.',
            variant: 'destructive',
          });
          return;
        }

        if (
          !Number.isFinite(formData.latitude) ||
          !Number.isFinite(formData.longitude) ||
          formData.latitude === 0 ||
          formData.longitude === 0
        ) {
          trackEvent('booking_validation_error', {
            field: 'location',
            reason: 'missing_map_pin',
            service_id: service.id,
          });
          toast({
            title: 'Location required',
            description: 'Please drop the map pin to set your exact house location.',
            variant: 'destructive',
          });
          return;
        }

        const vErr = validatePricingInputs(service.name, pricingInputsForCalc);
        if (vErr) {
          trackEvent('booking_validation_error', {
            field: 'pricing',
            reason: vErr,
            service_id: service.id,
          });
          toast({ title: 'Pricing', description: vErr, variant: 'destructive' });
          return;
        }

        const { price, metadata } = calculateBookingPrice(
          service.name,
          service.price,
          pricingInputsForCalc
        );

        const booking: BookingItem = {
          id: crypto.randomUUID(),
          serviceId: serviceId || '',
          serviceName: service.name,
          price,
          date: formData.date,
          time: formData.time,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          pricingSummary: metadata.summary,
          pricingMetadata: metadata,
        };

        addItem(booking);
        trackEvent('add_to_cart', {
          service_id: service.id,
          service_name: service.name,
          value: price,
        });
        trackMetaAddToCart({
          contentId: service.id,
          contentName: service.name,
          value: price,
        });
        toast({
          title: 'Service Added to Cart',
          description: 'Your booking has been added to the cart.',
        });
        navigate('/cart');
      } catch (error) {
        toast({
          title: 'Booking Failed',
          description: getSupabaseErrorMessage(error),
          variant: 'destructive',
        });
      }
    },
    [
      service,
      user,
      formData,
      pricingInputsForCalc,
      serviceId,
      addItem,
      navigate,
      toast,
    ]
  );

  useEffect(() => {
    trackEvent('form_start', { form_name: 'book_service' });
  }, []);

  if (isLoading) {
    return (
      <div className="container py-24">
        <h1 className="sr-only">Book a service</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-24">
        <h1 className="sr-only">Book a service</h1>
        <div className="text-center">
          <p>Service not found. ServiceId: {serviceId}</p>
          <button type="button" onClick={() => navigate('/services')} className="mt-4 btn">
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-24">
      <h1 className="sr-only">Book {service.name}</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle>Book {service.name}</CardTitle>
            {estimated && (
              <p className="text-sm text-muted-foreground">
                Estimated: <span className="font-semibold text-foreground">₹{estimated.price}</span>
                {' — '}
                {estimated.metadata.summary}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'unit' && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Units</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    step={1}
                    value={pricingInputs.quantity}
                    onChange={(e) =>
                      setPricingInputs((p) => ({
                        ...p,
                        quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Price per unit from catalog: ₹{service.price}
                  </p>
                </div>
              )}

              {mode === 'sqft' && (
                <div className="space-y-2">
                  <Label htmlFor="sqft">Area (sq.ft)</Label>
                  <Input
                    id="sqft"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={pricingInputs.sqft}
                    onChange={(e) => setPricingInputs((p) => ({ ...p, sqft: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">₹12 per sq.ft</p>
                </div>
              )}

              {mode === 'kw' && (
                <div className="space-y-2">
                  <Label htmlFor="kw">Solar capacity (KW)</Label>
                  <Input
                    id="kw"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={pricingInputs.kw}
                    onChange={(e) => setPricingInputs((p) => ({ ...p, kw: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">₹100 per KW</p>
                </div>
              )}

              {mode === 'water_tank' && (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="space-y-2">
                    <Label>Tank type</Label>
                    <Select
                      value={pricingInputs.tankType}
                      onValueChange={(v: 'plastic' | 'concrete') =>
                        setPricingInputs((p) => ({ ...p, tankType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plastic">Plastic</SelectItem>
                        <SelectItem value="concrete">Concrete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacityLiters">Capacity (liters)</Label>
                    <Input
                      id="capacityLiters"
                      type="number"
                      min={1}
                      step={1}
                      value={pricingInputs.capacityLiters}
                      onChange={(e) =>
                        setPricingInputs((p) => ({
                          ...p,
                          capacityLiters: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plastic up to 2000L: ₹600 flat. ₹2001L–10,000L (any type): ₹1499 flat. Above
                    10,000L: ₹1499 per started 10,000L (e.g. 11,000L = ₹2998).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <AddressInput
                  value={formData.address}
                  onChange={handleAddressChange}
                  onLocationChange={handleLocationChange}
                  label="Service Location"
                  placeholder="Enter your address"
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
              <Button type="submit" className="w-full">
                Add to Cart
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

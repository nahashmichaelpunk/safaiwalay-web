import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { fetchServices, createBooking, getCurrentUser } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/lib/store';
import { useToast } from './ui/use-toast';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import {
  calculateBookingPrice,
  getPricingMode,
  validatePricingInputs,
  type PricingInputs,
} from '@/lib/service-pricing';

// Example FAQ data structure
const FAQ_CATEGORIES = [
  {
    category: 'Services',
    questions: [
      { q: 'What services do you offer?', a: 'We offer home cleaning, kitchen, bathroom, patio, parking, and full home cleaning.' },
      { q: 'Which cities do you serve?', a: 'We serve Nagpur and surrounding areas in Maharashtra.' },
    ],
  },
  {
    category: 'Booking',
    questions: [
      { q: 'How do I book a service?', a: 'Click "Book a Service" and follow the steps to schedule your cleaning.' },
      { q: 'Can I reschedule my booking?', a: 'Yes, contact support to reschedule.' },
    ],
  },
  {
    category: 'Payments',
    questions: [
      { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards and digital wallets via Razorpay.' },
      { q: 'Is online payment safe?', a: 'Yes, all payments are processed securely.' },
    ],
  },
];

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define a type for the service object
interface Service {
  id: string;
  name: string;
  price: number;
  price_description?: string | null;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [view, setView] = useState<'main' | 'faq' | 'booking' | 'payments' | 'support'>('main');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<number>(0);
  const [bookingData, setBookingData] = useState<{
    service?: string;
    datetime?: string;
    address?: string;
  }>({});
  const [chatPricing, setChatPricing] = useState({
    quantity: 1,
    sqft: '',
    kw: '',
    tankType: 'plastic' as 'plastic' | 'concrete',
    capacityLiters: '',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reset view when panel is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setSelectedCategory(null);
        setBookingStep(0);
        setBookingData({});
      }, 300); // delay to allow for closing animation
    }
  }, [isOpen]);

  // Fetch services when booking view is opened
  useEffect(() => {
    if (view === 'booking' && services.length === 0) {
      const loadServices = async () => {
        setIsLoadingServices(true);
        try {
          const fetchedServices = await fetchServices();
          setServices(fetchedServices);
        } catch (error) {
          console.error("Failed to fetch services:", error);
          toast({ title: "Error", description: getSupabaseErrorMessage(error), variant: "destructive" });
        } finally {
          setIsLoadingServices(false);
        }
      };
      loadServices();
    }
  }, [view, services.length]);

  useEffect(() => {
    if (!bookingData.service) return;
    setChatPricing({
      quantity: 1,
      sqft: '',
      kw: '',
      tankType: 'plastic',
      capacityLiters: '',
    });
  }, [bookingData.service]);

  const handleBookServiceClick = () => {
    if (user) {
      setView('booking');
    } else {
      onClose();
      navigate('/signin');
    }
  };

  const handleSubmitBooking = async () => {
    if (!user) {
      toast({ title: "Not logged in", description: "Please sign in to book a service.", variant: "destructive" });
      onClose();
      navigate('/signin');
      return;
    }

    const selectedService = services.find(s => s.id === bookingData.service);

    setIsSubmitting(true);
    try {
      if (!bookingData.datetime || !selectedService || !bookingData.address) {
        toast({ title: "Missing Information", description: "Please complete all booking steps.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const inputs: PricingInputs = {
        quantity: chatPricing.quantity,
        sqft: chatPricing.sqft === '' ? undefined : Number(chatPricing.sqft),
        kw: chatPricing.kw === '' ? undefined : Number(chatPricing.kw),
        tankType: chatPricing.tankType,
        capacityLiters: chatPricing.capacityLiters === '' ? undefined : Number(chatPricing.capacityLiters),
      };
      const vErr = validatePricingInputs(selectedService.name, inputs);
      if (vErr) {
        toast({ title: "Pricing", description: vErr, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const date = new Date(bookingData.datetime);
      if (Number.isNaN(date.getTime())) {
        toast({
          title: 'Invalid date/time',
          description: 'Please choose a valid date and time.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { price } = calculateBookingPrice(selectedService.name, selectedService.price, inputs);

      const profile = await getCurrentUser();
      const phoneFromProfile = profile?.phone?.trim();
      if (!phoneFromProfile) {
        toast({
          title: 'Phone required',
          description: 'Add your phone number in Profile before booking from chat.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      const bookingPayload = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().split(' ')[0],
        address: bookingData.address,
        price,
        name: user.name || 'N/A',
        email: user.email,
        phone: phoneFromProfile,
        latitude: 0,
        longitude: 0,
      };

      await createBooking(bookingPayload);

      toast({ title: "Booking successful!", description: "We've received your request and will be in touch soon." });
      onClose();
    } catch (error) {
      console.error("Booking failed:", error);
      toast({ title: "Booking failed", description: getSupabaseErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services.find(s => s.id === bookingData.service);

  const pricingInputsForCalc: PricingInputs = useMemo(
    () => ({
      quantity: chatPricing.quantity,
      sqft: chatPricing.sqft === '' ? undefined : Number(chatPricing.sqft),
      kw: chatPricing.kw === '' ? undefined : Number(chatPricing.kw),
      tankType: chatPricing.tankType,
      capacityLiters: chatPricing.capacityLiters === '' ? undefined : Number(chatPricing.capacityLiters),
    }),
    [chatPricing]
  );

  const estimatedChat = useMemo(() => {
    if (!selectedService) return null;
    const err = validatePricingInputs(selectedService.name, pricingInputsForCalc);
    if (err) return null;
    return calculateBookingPrice(selectedService.name, selectedService.price, pricingInputsForCalc);
  }, [selectedService, pricingInputsForCalc]);

  const renderPricingFields = () => {
    if (!selectedService) return <p className="text-sm text-muted-foreground">Select a service first.</p>;
    const mode = getPricingMode(selectedService.name);
    if (mode === 'unit') {
      return (
        <div className="space-y-2">
          <Label>Units</Label>
          <Input
            type="number"
            min={1}
            value={chatPricing.quantity}
            onChange={(e) =>
              setChatPricing((p) => ({
                ...p,
                quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
              }))
            }
          />
        </div>
      );
    }
    if (mode === 'sqft') {
      return (
        <div className="space-y-2">
          <Label>Area (sq.ft)</Label>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={chatPricing.sqft}
            onChange={(e) => setChatPricing((p) => ({ ...p, sqft: e.target.value }))}
          />
        </div>
      );
    }
    if (mode === 'kw') {
      return (
        <div className="space-y-2">
          <Label>Capacity (KW)</Label>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={chatPricing.kw}
            onChange={(e) => setChatPricing((p) => ({ ...p, kw: e.target.value }))}
          />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Tank type</Label>
          <Select
            value={chatPricing.tankType}
            onValueChange={(v: 'plastic' | 'concrete') =>
              setChatPricing((p) => ({ ...p, tankType: v }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plastic">Plastic</SelectItem>
              <SelectItem value="concrete">Concrete</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Capacity (L)</Label>
          <Input
            type="number"
            min={1}
            value={chatPricing.capacityLiters}
            onChange={(e) =>
              setChatPricing((p) => ({ ...p, capacityLiters: e.target.value }))
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Plastic up to 2000L: ₹600. ₹2001L–10,000L: ₹1499. Above 10,000L: ₹1499 per started 10,000L.
        </p>
      </div>
    );
  };

  const canGoNext = (step: number): boolean => {
    if (step === 0) return !!bookingData.service;
    if (step === 1) {
      if (!selectedService) return false;
      return !validatePricingInputs(selectedService.name, pricingInputsForCalc);
    }
    if (step === 2) return !!bookingData.datetime;
    if (step === 3) return !!(bookingData.address && bookingData.address.trim());
    return true;
  };

  // Booking flow steps: service → pricing → datetime → address → confirm
  const bookingSteps = [
    {
      label: 'Select Service',
      content: isLoadingServices ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <select
          className="w-full p-2 border rounded"
          value={bookingData.service || ''}
          onChange={(e) => setBookingData({ ...bookingData, service: e.target.value })}
        >
          <option value="" disabled>
            Select a service
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      label: 'Pricing details',
      content: (
        <div className="space-y-3">
          {renderPricingFields()}
          {estimatedChat && (
            <p className="text-sm">
              Est. <strong>₹{estimatedChat.price}</strong> — {estimatedChat.metadata.summary}
            </p>
          )}
        </div>
      ),
    },
    {
      label: 'Choose Date & Time',
      content: (
        <input
          type="datetime-local"
          className="w-full p-2 border rounded"
          value={bookingData.datetime || ''}
          onChange={(e) => setBookingData({ ...bookingData, datetime: e.target.value })}
        />
      ),
    },
    {
      label: 'Enter Address',
      content: (
        <input
          type="text"
          placeholder="Your address"
          className="w-full p-2 border rounded"
          value={bookingData.address || ''}
          onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
        />
      ),
    },
    {
      label: 'Confirm',
      content: (
        <div className="text-sm space-y-2">
          <div>
            <strong>Service:</strong> {selectedService?.name || '...'}
          </div>
          {estimatedChat && (
            <div>
              <strong>Price:</strong> ₹{estimatedChat.price} ({estimatedChat.metadata.summary})
            </div>
          )}
          <div>
            <strong>Date & Time:</strong> {bookingData.datetime}
          </div>
          <div>
            <strong>Address:</strong> {bookingData.address}
          </div>
          <Button onClick={handleSubmitBooking} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Booking'}
          </Button>
        </div>
      ),
    },
  ];

  const renderContent = () => {
    switch (view) {
      case 'faq':
        return (
          <div>
            <Button variant='ghost' onClick={() => !selectedCategory ? setView('main') : setSelectedCategory(null)} className="mb-4">← Back</Button>
            <h2 className='text-xl font-bold mb-4'>FAQs</h2>
            {!selectedCategory ? (
              <div className='flex flex-col gap-2'>
                {FAQ_CATEGORIES.map(cat => (
                  <Button key={cat.category} onClick={() => setSelectedCategory(cat.category)}>{cat.category}</Button>
                ))}
              </div>
            ) : (
              <Accordion type='single' collapsible className='w-full'>
                {FAQ_CATEGORIES.find(cat => cat.category === selectedCategory)?.questions.map((q, i) => (
                  <AccordionItem key={i} value={q.q}>
                    <AccordionTrigger>{q.q}</AccordionTrigger>
                    <AccordionContent>{q.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        );
      case 'booking':
        return (
          <div>
             <Button variant='ghost' onClick={() => setView('main')} className="mb-4">← Back</Button>
             <h2 className='text-xl font-bold mb-4'>Book a Service</h2>
             <div className='mb-4 text-sm text-muted-foreground'>Step {bookingStep + 1} of {bookingSteps.length}: {bookingSteps[bookingStep].label}</div>
             <div className='mb-4'>{bookingSteps[bookingStep].content}</div>
             <div className='flex gap-2'>
               {bookingStep > 0 && <Button variant="outline" onClick={() => setBookingStep(bookingStep - 1)}>Back</Button>}
               {bookingStep < bookingSteps.length - 1 && (
                 <Button onClick={() => setBookingStep(bookingStep + 1)} disabled={!canGoNext(bookingStep)}>
                   Next
                 </Button>
               )}
             </div>
           </div>
        );
      case 'payments':
        return (
          <div>
            <Button variant='ghost' onClick={() => setView('main')} className="mb-4">← Back</Button>
            <h2 className='text-xl font-bold mb-4'>Payments</h2>
            <div className='text-muted-foreground'>For payment issues or to pay for a booking, please visit the Checkout page or contact support.</div>
          </div>
        );
      case 'support':
        return (
          <div>
            <Button variant='ghost' onClick={() => setView('main')} className="mb-4">← Back</Button>
            <h2 className='text-xl font-bold mb-4'>Contact Support</h2>
            <div className='text-muted-foreground'>Email: support@safaiwalay.com<br/>Phone: 123-456-7890</div>
          </div>
        );
      case 'main':
      default:
        return (
          <div>
            <h2 className='text-xl font-bold mb-4'>How can we help you?</h2>
            <div className='flex flex-col gap-3'>
              <Button key="faq" onClick={() => setView('faq')} className="w-full justify-start p-6 text-base">FAQs</Button>
              <Button key="booking" onClick={handleBookServiceClick} className="w-full justify-start p-6 text-base">Book a Service</Button>
              <Button key="payments" onClick={() => setView('payments')} className="w-full justify-start p-6 text-base">Payments</Button>
              <Button key="support" onClick={() => setView('support')} className="w-full justify-start p-6 text-base">Contact Support</Button>
            </div>
          </div>
        );
    }
  };

  return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-background border rounded-lg shadow-lg z-50"
          >
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Help & FAQs</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className='p-6'>
              {renderContent()}
                  </div>
          </Card>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
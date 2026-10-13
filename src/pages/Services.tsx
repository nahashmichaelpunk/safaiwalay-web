import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Car, Sun, Droplets, Home, Warehouse, Sprout } from 'lucide-react';
import { fetchServices } from '@/lib/supabase';
import { getPricingLabelFallback } from '@/lib/service-pricing';
import { useToast } from '@/components/ui/use-toast';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/seo/SEOHead';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { getBreadcrumbSchema } from '@/components/seo/StructuredData';
import { SERVICE_LANDING_PAGES } from '@/content/services/service-pages';
import { logger } from '@/lib/logger';
import {
  trackEvent,
  trackMetaAddToCart,
  trackMetaViewCatalogServices,
} from '@/lib/monitoring/events';

interface Service {
    id: string;
    name: string;
    price: number;
    description: string | null;
    price_description?: string | null;
    image_url?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function Services() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        trackEvent('view_services', {});
        const loadServices = async () => {
            setIsLoading(true);
            try {
                const fetchedServices = await fetchServices();
                logger.debug('Fetched services:', fetchedServices);
                setServices(fetchedServices);
            } catch (error) {
                console.error("Failed to load services:", error);
                trackEvent('api_error', {
                    endpoint: 'fetch_services',
                    message: getSupabaseErrorMessage(error),
                });
                toast({
                    title: "Could not load services",
                    description: getSupabaseErrorMessage(error),
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadServices();
    }, []);

    useEffect(() => {
        if (services.length === 0) return;
        trackMetaViewCatalogServices(services.map((s) => s.id));
    }, [services]);

    const getIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'patio & parking cleaning': return Home;
            case 'solar panel cleaning': return Sun;
            case 'carpet cleaning': return Sprout;
            case 'terrace & roof cleaning': return Warehouse;
            case 'water tank cleaning': return Droplets;
            case 'car wash': return Car;
            default: return Home;
        }
    };

    const getServiceLandingSlug = (name: string) => {
        const normalizedName = name.toLowerCase().trim();
        const match = SERVICE_LANDING_PAGES.find((item) => {
            const normalizedTarget = item.shortTitle.toLowerCase();
            return normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName);
        });
        return match?.slug;
    };
    
    if (isLoading) {
        return (
            <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] w-full">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">Our Services</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Professional cleaning solutions for every need
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, index) => (
                            <Card key={index} className="relative overflow-hidden">
                                <CardHeader>
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-1/4 mb-6" />
                                    <div className="space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Services", url: "/services" }
  ];

  return (
    <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title="Cleaning Services in Nagpur | Professional Home & Office Cleaning | SafaiWalay"
        description="Professional cleaning services in Nagpur. Home cleaning, office cleaning, deep cleaning, carpet cleaning, and more. Transparent per-unit and per-area pricing. Book now!"
        keywords="cleaning services Nagpur, home cleaning Nagpur, office cleaning Nagpur, deep cleaning Nagpur, carpet cleaning Nagpur, professional cleaners Nagpur, घर की सफाई नागपुर, सफाई सेवा नागपुर"
        canonical="/services"
        ogTitle="Professional Cleaning Services in Nagpur | SafaiWalay"
        ogDescription="Professional cleaning services in Nagpur. Home cleaning, office cleaning, deep cleaning, carpet cleaning, and more. Transparent pricing."
        ogImage={BRAND_LOGO_SRC}
        ogUrl="/services"
        structuredData={getBreadcrumbSchema(breadcrumbs)}
      />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional cleaning solutions for every need
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
              const ServiceIcon = getIcon(service.name);
              const detailsSlug = getServiceLandingSlug(service.name);
              return (
                <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary/40 transition-all duration-300 bg-card">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full bg-primary text-primary-foreground`}>
                        <ServiceIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{service.name}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">₹{service.price.toString()}</div>
                    <p className="text-sm text-muted-foreground mb-6">
                      {service.price_description?.trim() || getPricingLabelFallback(service.name)}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <svg
                          className="h-5 w-5 bg-primary text-primary-foreground rounded-full"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">Professional cleaning service</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <svg
                          className="h-5 w-5 bg-primary text-primary-foreground rounded-full"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">Quality guaranteed</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <svg
                          className="h-5 w-5 bg-primary text-primary-foreground rounded-full"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">Eco-friendly products</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          logger.debug('Booking service:', service);
                          trackEvent('click_service_cta', {
                            location: 'services_card',
                            target: `book_${service.id}`,
                          });
                          trackMetaAddToCart({
                            contentId: service.id,
                            contentName: service.name,
                            value: service.price,
                          });
                          navigate(`/book/${service.id}`);
                        }}
                      >
                        Book Now
                      </Button>
                      {detailsSlug && (
                        <Button asChild variant="outline" className="w-full">
                          <Link
                            to={`/services/${detailsSlug}`}
                            onClick={() =>
                              trackEvent('view_service', {
                                service_id: service.id,
                                service_name: service.name,
                              })
                            }
                          >
                            View Service Details
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
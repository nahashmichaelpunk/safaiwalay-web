import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { getBreadcrumbSchema } from '@/components/seo/StructuredData';
import { AREA_LANDING_PAGES } from '@/content/areas/area-pages';

export default function Areas() {
  const nagpurAreas = [
    {
      name: "Sadar",
      description: "Premium residential area with modern homes and offices",
      services: ["Home Cleaning", "Office Cleaning", "Deep Cleaning"],
      landmarks: ["Sadar Bazaar", "Central Museum", "Zero Mile Stone"],
      responseTime: "30 minutes",
      rating: "4.9",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80"
    },
    {
      name: "Civil Lines",
      description: "Commercial hub with government offices and businesses",
      services: ["Office Cleaning", "Commercial Cleaning", "Post-Construction"],
      landmarks: ["Civil Lines", "High Court", "Collectorate"],
      responseTime: "25 minutes",
      rating: "4.8",
      image: "https://images.unsplash.com/photo-1613963931023-5dc59437c8a6?auto=format&fit=crop&q=80"
    },
    {
      name: "Sitabuldi",
      description: "Historic area with mixed residential and commercial spaces",
      services: ["Home Cleaning", "Carpet Cleaning", "Deep Cleaning"],
      landmarks: ["Sitabuldi Fort", "Central Railway Station", "Mahatma Gandhi Garden"],
      responseTime: "20 minutes",
      rating: "4.9",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80"
    },
    {
      name: "Dharampeth",
      description: "Educational and residential area with schools and colleges",
      services: ["Home Cleaning", "School Cleaning", "Deep Cleaning"],
      landmarks: ["Dharampeth College", "Laxmi Narayan Temple", "Dharampeth Market"],
      responseTime: "35 minutes",
      rating: "4.7",
      image: "https://images.unsplash.com/photo-1613963931023-5dc59437c8a6?auto=format&fit=crop&q=80"
    },
    {
      name: "Ramdaspeth",
      description: "Residential area with modern apartments and houses",
      services: ["Home Cleaning", "Apartment Cleaning", "Deep Cleaning"],
      landmarks: ["Ramdaspeth Market", "Gandhi Sagar Lake", "Ramdaspeth Garden"],
      responseTime: "40 minutes",
      rating: "4.8",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80"
    },
    {
      name: "Wardha Road",
      description: "Industrial and residential area with mixed development",
      services: ["Industrial Cleaning", "Home Cleaning", "Office Cleaning"],
      landmarks: ["Wardha Road", "Industrial Area", "IT Park"],
      responseTime: "45 minutes",
      rating: "4.6",
      image: "https://images.unsplash.com/photo-1613963931023-5dc59437c8a6?auto=format&fit=crop&q=80"
    }
  ];

  const getAreaLandingSlug = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    const match = AREA_LANDING_PAGES.find((area) =>
      area.name.toLowerCase().includes(normalizedName) || normalizedName.includes(area.name.toLowerCase())
    );
    return match?.slug;
  };

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Service Areas", url: "/areas" }
  ];

  return (
    <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title="Cleaning Services in Nagpur Areas | Sadar, Civil Lines, Sitabuldi, Dharampeth | SafaiWalay"
        description="Professional cleaning services across all areas of Nagpur. We serve Sadar, Civil Lines, Sitabuldi, Dharampeth, Ramdaspeth, and Wardha Road. Book now for reliable cleaning services in your area."
        keywords="cleaning services Sadar Nagpur, cleaning services Civil Lines Nagpur, cleaning services Sitabuldi Nagpur, cleaning services Dharampeth Nagpur, cleaning services Ramdaspeth Nagpur, cleaning services Wardha Road Nagpur, घर की सफाई सदर नागपुर, सफाई सेवा सिविल लाइन्स नागपुर"
        canonical="/areas"
        ogTitle="Cleaning Services in All Areas of Nagpur | SafaiWalay"
        ogDescription="Professional cleaning services across all areas of Nagpur. We serve Sadar, Civil Lines, Sitabuldi, Dharampeth, Ramdaspeth, and Wardha Road."
        ogImage={BRAND_LOGO_SRC}
        ogUrl="/areas"
        structuredData={getBreadcrumbSchema(breadcrumbs)}
      />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">
            We Serve All Areas of Nagpur
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional cleaning services across Nagpur. From Sadar to Wardha Road, 
            we bring our trusted cleaning expertise to your doorstep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nagpurAreas.map((area, index) => {
            const areaSlug = getAreaLandingSlug(area.name);
            return (
            <motion.div
              key={area.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={area.image}
                    alt={`Cleaning services in ${area.name}, Nagpur`}
                    width={800}
                    height={480}
                    loading={index < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{area.rating}</span>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {area.name}
                  </CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Available Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {area.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Nearby Landmarks:</h4>
                    <p className="text-sm text-gray-600">
                      {area.landmarks.join(", ")}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Response: {area.responseTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {areaSlug && (
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/areas/${areaSlug}`}>Details</Link>
                        </Button>
                      )}
                      <Button asChild size="sm">
                        <Link to="/services">Book Now</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Card className="max-w-2xl mx-auto border-primary/20 bg-card shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold font-brand text-foreground mb-4">
                Don't See Your Area?
              </h3>
              <p className="text-muted-foreground mb-6">
                We're expanding our services across Nagpur. Contact us to check 
                availability in your area or to request service expansion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/contact">Contact Us</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/services">View All Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

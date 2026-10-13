import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Quote } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { getBreadcrumbSchema, getReviewSchema } from '@/components/seo/StructuredData';

export default function LocalTestimonials() {
  const nagpurTestimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      location: "Sadar, Nagpur",
      rating: 5,
      review: "Excellent cleaning service! The team was punctual and did a thorough job cleaning our 3BHK apartment. Highly recommend SafaiWalay for anyone in Nagpur.",
      date: "2024-01-15",
      service: "Home Cleaning",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      location: "Civil Lines, Nagpur",
      rating: 5,
      review: "Professional office cleaning service. They understand the needs of commercial spaces in Nagpur. Our office has never been cleaner!",
      date: "2024-01-12",
      service: "Office Cleaning",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      name: "Anita Deshmukh",
      location: "Sitabuldi, Nagpur",
      rating: 5,
      review: "सफाईवाला ने हमारे घर की सफाई बहुत अच्छी की। टीम बहुत पेशेवर थी और सभी कोनों को साफ किया। नागपुर में सबसे अच्छी सफाई सेवा!",
      date: "2024-01-10",
      service: "Deep Cleaning",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80"
    },
    {
      id: 4,
      name: "Vikram Singh",
      location: "Dharampeth, Nagpur",
      rating: 4,
      review: "Good service for carpet cleaning. The team was knowledgeable about different carpet types and used appropriate cleaning methods.",
      date: "2024-01-08",
      service: "Carpet Cleaning",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80"
    },
    {
      id: 5,
      name: "Meera Joshi",
      location: "Ramdaspeth, Nagpur",
      rating: 5,
      review: "Outstanding deep cleaning service after our home renovation. They cleaned every corner and made our new home spotless. Worth every rupee!",
      date: "2024-01-05",
      service: "Post-Construction Cleaning",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80"
    },
    {
      id: 6,
      name: "Suresh Patil",
      location: "Wardha Road, Nagpur",
      rating: 5,
      review: "Regular cleaning service for our industrial unit. Reliable, punctual, and thorough. Perfect for businesses in Nagpur's industrial area.",
      date: "2024-01-03",
      service: "Industrial Cleaning",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80"
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Customer Reviews", url: "/testimonials" }
  ];

  const structuredReviews = nagpurTestimonials.map(testimonial => ({
    author: testimonial.name,
    rating: testimonial.rating,
    reviewBody: testimonial.review,
    datePublished: testimonial.date
  }));

  return (
    <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title="Customer Reviews & Testimonials | SafaiWalay Cleaning Services Nagpur | Real Customer Stories"
        description="Read real customer reviews and testimonials for SafaiWalay cleaning services in Nagpur. See what our satisfied customers from Sadar, Civil Lines, Sitabuldi, and other areas say about us."
        keywords="SafaiWalay reviews, cleaning service reviews Nagpur, customer testimonials Nagpur, घर की सफाई रिव्यू नागपुर, सफाईवाला रिव्यू, cleaning service feedback Nagpur"
        canonical="/testimonials"
        ogTitle="Customer Reviews & Testimonials | SafaiWalay Cleaning Services Nagpur"
        ogDescription="Read real customer reviews and testimonials for SafaiWalay cleaning services in Nagpur. See what our satisfied customers say about us."
        ogImage={BRAND_LOGO_SRC}
        ogUrl="/testimonials"
        structuredData={[getBreadcrumbSchema(breadcrumbs), getReviewSchema(structuredReviews)]}
      />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">
            What Our Nagpur Customers Say
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real reviews from satisfied customers across Nagpur. 
            From Sadar to Wardha Road, see why Nagpur trusts SafaiWalay.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nagpurTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{testimonial.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {testimonial.rating}/5
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {testimonial.service}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/40" />
                    <p className="text-gray-700 italic pl-4">
                      "{testimonial.review}"
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    {new Date(testimonial.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
                Join Our Happy Customers
              </h3>
              <p className="text-muted-foreground mb-6">
                Experience the same quality service that our customers love. 
                Book your cleaning service today and see why Nagpur chooses SafaiWalay.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <a href="/services">Book Now</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/contact">Get Quote</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

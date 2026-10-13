import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import {
  getBreadcrumbSchema,
  getFAQSchema,
  getServiceSchema,
} from '@/components/seo/StructuredData';
import {
  SERVICE_LANDING_PAGES,
  getServicePageBySlug,
} from '@/content/services/service-pages';
import { trackEvent, trackMetaViewContent } from '@/lib/monitoring/events';

export default function ServiceLandingPage() {
  const { slug = '' } = useParams();
  const service = getServicePageBySlug(slug);

  useEffect(() => {
    if (!service) return;
    trackEvent('view_service', {
      service_id: service.slug,
      service_name: service.shortTitle,
    });
    trackMetaViewContent({
      contentId: service.slug,
      contentName: service.name,
      value: service.startingPrice,
      contentCategory: 'Cleaning Services',
    });
  }, [service]);

  if (!service) {
    return (
      <div className="container py-24">
        <SEOHead
          title="Service not found | SafaiWalay"
          description="Requested service page was not found."
          canonical={`/services/${slug}`}
          robots="noindex,nofollow"
        />
        <h1 className="text-3xl font-bold mb-4">Service page not found</h1>
        <p className="text-muted-foreground mb-6">
          The requested service is unavailable right now.
        </p>
        <Button asChild>
          <Link to="/services">View all services</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.shortTitle, url: `/services/${service.slug}` },
  ];

  const related = SERVICE_LANDING_PAGES.filter((item) => item.slug !== service.slug).slice(0, 3);

  const structuredData = [
    getBreadcrumbSchema(breadcrumbs),
    getFAQSchema(service.faqs),
    getServiceSchema(service.shortTitle, service.longDescription, {
      price: service.startingPrice,
      priceText: service.pricingText,
      servicePath: `/services/${service.slug}`,
    }),
  ];

  return (
    <div className="py-20 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title={`${service.name} | SafaiWalay`}
        description={service.summary}
        canonical={`/services/${service.slug}`}
        ogTitle={`${service.shortTitle} - Professional Service in Nagpur`}
        ogDescription={service.summary}
        ogImage={service.image}
        ogUrl={`/services/${service.slug}`}
        structuredData={structuredData}
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[1100px]">
        <header className="mb-10">
          <h1 className="text-4xl font-bold font-brand mb-4">{service.name}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{service.longDescription}</p>
        </header>

        <img
          src={service.image}
          alt={service.name}
          width={1280}
          height={720}
          className="w-full rounded-2xl shadow-lg mb-10 object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-3">Service Highlights</h2>
              <ul className="space-y-2">
                {service.benefits.map((benefit) => (
                  <li key={benefit} className="text-muted-foreground">
                    • {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Pricing</h3>
              <p className="text-muted-foreground">{service.pricingText}</p>
              <Button asChild className="w-full">
                <Link
                  to="/services"
                  onClick={() =>
                    trackEvent('click_service_cta', {
                      location: `service_page_${service.slug}`,
                      target: 'book_now',
                    })
                  }
                >
                  Book Now
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/contact">Contact on WhatsApp/Call</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {service.faqs.map((faq) => (
              <Card key={faq.question}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Related Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((item) => (
              <Card key={item.slug}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{item.shortTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{item.summary}</p>
                  <Button asChild variant="link" className="px-0">
                    <Link to={`/services/${item.slug}`}>Read details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import { getBreadcrumbSchema, getFAQSchema } from '@/components/seo/StructuredData';
import { AREA_LANDING_PAGES, getAreaPageBySlug } from '@/content/areas/area-pages';
import { trackEvent } from '@/lib/monitoring/events';

export default function AreaLandingPage() {
  const { slug = '' } = useParams();
  const area = getAreaPageBySlug(slug);

  useEffect(() => {
    if (!area) return;
    trackEvent('view_area_page', { area_slug: area.slug });
  }, [area]);

  if (!area) {
    return (
      <div className="container py-24">
        <SEOHead
          title="Area page not found | SafaiWalay"
          description="Requested area page was not found."
          canonical={`/areas/${slug}`}
          robots="noindex,nofollow"
        />
        <h1 className="text-3xl font-bold mb-4">Area page not found</h1>
        <Button asChild>
          <Link to="/areas">Back to areas</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Areas', url: '/areas' },
    { name: area.name, url: `/areas/${area.slug}` },
  ];

  const relatedAreas = AREA_LANDING_PAGES.filter((entry) => entry.slug !== area.slug).slice(0, 3);

  const faqs = [
    {
      question: `Do you provide same-day cleaning in ${area.name}?`,
      answer: `Same-day slots may be available in ${area.name} based on current booking load and team availability.`,
    },
    {
      question: `Which services are popular in ${area.name}?`,
      answer: `Commonly requested services in ${area.name} include ${area.focusServices.join(', ')}.`,
    },
  ];

  return (
    <div className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
      <SEOHead
        title={`Cleaning Services in ${area.name}, Nagpur | SafaiWalay`}
        description={area.overview}
        canonical={`/areas/${area.slug}`}
        ogTitle={`SafaiWalay Services in ${area.name}, Nagpur`}
        ogDescription={area.overview}
        ogUrl={`/areas/${area.slug}`}
        structuredData={[getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)]}
      />

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-4xl font-bold font-brand mb-4">
            Cleaning Services in {area.name}, Nagpur
          </h1>
          <p className="text-lg text-muted-foreground">{area.overview}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Popular services in this area</h2>
              <ul className="space-y-2">
                {area.focusServices.map((service) => (
                  <li key={service} className="text-muted-foreground">
                    • {service}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Service response time</h3>
              <p className="text-muted-foreground mb-6">Typical response: {area.responseTime}</p>
              <Button asChild className="w-full mb-3">
                <Link
                  to="/services"
                  onClick={() =>
                    trackEvent('click_service_cta', {
                      location: `area_${area.slug}`,
                      target: 'book_service',
                    })
                  }
                >
                  Book Service
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/contact">Talk to SafaiWalay</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Nearby landmarks covered</h2>
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              {area.landmarks.join(', ')}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Other Nagpur areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedAreas.map((entry) => (
              <Card key={entry.slug}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{entry.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{entry.overview}</p>
                  <Button asChild variant="link" className="px-0">
                    <Link to={`/areas/${entry.slug}`}>Open area page</Link>
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

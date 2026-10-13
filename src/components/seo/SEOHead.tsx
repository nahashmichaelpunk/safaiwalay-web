import { Helmet } from 'react-helmet-async';
import {
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SOCIAL_LINKS,
  toAbsoluteUrl,
  type RobotsPolicy,
} from '@/lib/seo/site-config';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: object | object[];
  noIndex?: boolean;
  robots?: RobotsPolicy;
  ogImageAlt?: string;
  lang?: string;
}

export default function SEOHead({
  title = 'SafaiWalay - Professional Cleaning Services in Nagpur | घर की सफाई सेवाएं',
  description = 'Professional cleaning services in Nagpur. Home cleaning, office cleaning, deep cleaning, and more. Trusted by 1000+ customers in Nagpur. Book now for reliable cleaning services.',
  keywords = 'cleaning services Nagpur, घर की सफाई नागपुर, office cleaning Nagpur, home cleaning Nagpur, deep cleaning Nagpur, professional cleaners Nagpur, maid service Nagpur, housekeeping Nagpur',
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
  noIndex = false,
  robots,
  ogImageAlt = DEFAULT_OG_IMAGE_ALT,
  lang = 'en',
}: SEOHeadProps) {
  const fullCanonical = toAbsoluteUrl(canonical);
  const fullOgUrl = toAbsoluteUrl(ogUrl);
  const fullOgImage = toAbsoluteUrl(ogImage);
  const fullTwitterImage = toAbsoluteUrl(twitterImage ?? ogImage);
  const robotsContent = robots ?? (noIndex ? 'noindex,nofollow' : 'index,follow');
  const schemaItems = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Viewport and Charset */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:site_name" content={`${BRAND_NAME} - Cleaning Services Nagpur`} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle || title} />
      <meta name="twitter:description" content={twitterDescription || description} />
      <meta name="twitter:image" content={fullTwitterImage} />
      <meta name="twitter:site" content={SOCIAL_LINKS.instagram} />
      
      {/* Additional SEO Tags */}
      <meta name="author" content={BRAND_NAME} />
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* Structured Data */}
      {schemaItems.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(schemaItems.length === 1 ? schemaItems[0] : schemaItems)}
        </script>
      )}
    </Helmet>
  );
}

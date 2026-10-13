import {
  BRAND_DESCRIPTION,
  BRAND_LEGAL_NAME,
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  PRIMARY_PHONE_E164,
  SERVICE_CITY,
  SERVICE_COUNTRY_CODE,
  SERVICE_POSTAL_CODE,
  SERVICE_STATE,
  SITE_URL,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  toAbsoluteUrl,
} from '@/lib/seo/site-config';

const BASE_ADDRESS = {
  '@type': 'PostalAddress',
  addressLocality: SERVICE_CITY,
  addressRegion: SERVICE_STATE,
  postalCode: SERVICE_POSTAL_CODE,
  addressCountry: SERVICE_COUNTRY_CODE,
};

const BASE_GEO = {
  '@type': 'GeoCoordinates',
  latitude: '21.1458',
  longitude: '79.0882',
};

const BASE_PROVIDER = {
  '@type': 'LocalBusiness',
  name: BRAND_NAME,
  url: SITE_URL,
  telephone: PRIMARY_PHONE_E164,
  email: SUPPORT_EMAIL,
  address: BASE_ADDRESS,
};

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: BRAND_NAME,
  legalName: BRAND_LEGAL_NAME,
  description: BRAND_DESCRIPTION,
  url: SITE_URL,
  logo: toAbsoluteUrl(DEFAULT_OG_IMAGE),
  email: SUPPORT_EMAIL,
  telephone: PRIMARY_PHONE_E164,
  sameAs: Object.values(SOCIAL_LINKS),
  areaServed: {
    '@type': 'City',
    name: SERVICE_CITY,
  },
});

// Structured Data for Local Business in Nagpur
export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}#localbusiness`,
  name: BRAND_LEGAL_NAME,
  alternateName: 'सफाईवाला - नागपुर की सफाई सेवाएं',
  description: BRAND_DESCRIPTION,
  url: SITE_URL,
  logo: toAbsoluteUrl(DEFAULT_OG_IMAGE),
  image: toAbsoluteUrl(DEFAULT_OG_IMAGE),
  telephone: PRIMARY_PHONE_E164,
  email: SUPPORT_EMAIL,
  address: BASE_ADDRESS,
  geo: BASE_GEO,
  areaServed: [
    {
      '@type': 'City',
      name: SERVICE_CITY,
      containedInPlace: {
        '@type': 'State',
        name: SERVICE_STATE,
      },
    },
  ],
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: BASE_GEO,
    geoRadius: '50000',
  },
  openingHours: 'Mo-Su 06:00-22:00',
  priceRange: '₹₹',
  paymentAccepted: 'Cash, Credit Card, UPI, Net Banking',
  currenciesAccepted: 'INR',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Cleaning Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Patio & Parking Cleaning',
          description: 'Deep surface cleaning, stain removal, pressure wash and sanitization.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Solar Panel Cleaning',
          description: 'Dust and bird dropping removal to improve panel efficiency.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Water Tank Cleaning',
          description: 'Professional sludge removal and sanitization for safe water storage.',
        },
      },
    ],
  },
  sameAs: Object.values(SOCIAL_LINKS),
});

export const getWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  url: SITE_URL,
  name: BRAND_NAME,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/services?query={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const getServiceSchema = (
  serviceName: string,
  serviceDescription: string,
  options?: {
    price?: number;
    priceText?: string;
    servicePath?: string;
  }
) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${serviceName} in ${SERVICE_CITY}`,
  description: serviceDescription,
  provider: BASE_PROVIDER,
  areaServed: {
    '@type': 'City',
    name: SERVICE_CITY,
  },
  offers: {
    '@type': 'Offer',
    price: options?.price,
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: toAbsoluteUrl(options?.servicePath ?? '/services'),
    priceSpecification: options?.priceText
      ? {
          '@type': 'PriceSpecification',
          priceCurrency: 'INR',
          description: options.priceText,
        }
      : undefined,
  },
});

export const getBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: toAbsoluteUrl(crumb.url),
  })),
});

export const getFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const getReviewSchema = (
  reviews: Array<{
    author: string;
    rating: number;
    reviewBody: string;
    datePublished: string;
  }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BRAND_LEGAL_NAME,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
    reviewCount: reviews.length,
    bestRating: '5',
    worstRating: '1',
  },
  review: reviews.map((review) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
  })),
});

export const getBlogPostingSchema = (input: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: input.title,
  description: input.description,
  image: [toAbsoluteUrl(input.image ?? DEFAULT_OG_IMAGE)],
  datePublished: input.datePublished,
  dateModified: input.dateModified ?? input.datePublished,
  author: {
    '@type': 'Organization',
    name: input.authorName ?? BRAND_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: BRAND_NAME,
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(DEFAULT_OG_IMAGE),
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': toAbsoluteUrl(`/blog/${input.slug}`),
  },
});

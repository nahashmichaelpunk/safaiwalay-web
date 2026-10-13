import { BRAND_NAME, BRAND_DESCRIPTION, type RobotsPolicy } from '@/lib/seo/site-config';

export interface RouteSEOConfig {
  title: string;
  description: string;
  canonical: string;
  robots?: RobotsPolicy;
}

export const ROUTE_SEO: Record<string, RouteSEOConfig> = {
  '/': {
    title: `${BRAND_NAME} - Professional Cleaning Services in Nagpur | घर की सफाई सेवाएं`,
    description: BRAND_DESCRIPTION,
    canonical: '/',
  },
  '/services': {
    title: `Cleaning Services in Nagpur | ${BRAND_NAME}`,
    description:
      'Book professional cleaning services in Nagpur with transparent pricing for water tanks, solar panels, carpet, patio, terrace and car wash.',
    canonical: '/services',
  },
  '/contact': {
    title: `Contact ${BRAND_NAME} | WhatsApp or Call for Cleaning Services`,
    description:
      'Contact SafaiWalay in Nagpur for quick booking and service inquiries via WhatsApp, phone call, or email.',
    canonical: '/contact',
  },
  '/blog': {
    title: `${BRAND_NAME} Cleaning Blog | Tips and Local Guides for Nagpur Homes`,
    description:
      'Read practical cleaning guides, maintenance tips, and service explainers for Nagpur households and businesses.',
    canonical: '/blog',
  },
  '/about': {
    title: `About ${BRAND_NAME} | Cleaning Experts in Nagpur`,
    description:
      'Learn about SafaiWalay, our cleaning standards, service quality process, and commitment to hygienic homes in Nagpur.',
    canonical: '/about',
  },
  '/areas': {
    title: `${BRAND_NAME} Service Areas | Cleaning Services Across Nagpur`,
    description: 'Explore all Nagpur areas where SafaiWalay offers residential and commercial cleaning services.',
    canonical: '/areas',
  },
  '/testimonials': {
    title: `${BRAND_NAME} Reviews | Customer Testimonials from Nagpur`,
    description: 'See what customers in Nagpur say about SafaiWalay cleaning quality and reliability.',
    canonical: '/testimonials',
  },
  '/signin': {
    title: `Sign in | ${BRAND_NAME}`,
    description: 'Sign in to your SafaiWalay account.',
    canonical: '/signin',
    robots: 'noindex,nofollow',
  },
  '/auth/callback': {
    title: `Auth Callback | ${BRAND_NAME}`,
    description: 'Authentication callback page.',
    canonical: '/auth/callback',
    robots: 'noindex,nofollow',
  },
  '/auth/reset-password': {
    title: `Reset Password | ${BRAND_NAME}`,
    description: 'Reset your SafaiWalay account password.',
    canonical: '/auth/reset-password',
    robots: 'noindex,nofollow',
  },
  '/terms': {
    title: `Terms of Service | ${BRAND_NAME}`,
    description: 'Terms of service for SafaiWalay cleaning services.',
    canonical: '/terms',
  },
  '/privacy': {
    title: `Privacy Policy | ${BRAND_NAME}`,
    description: 'Privacy policy for SafaiWalay.',
    canonical: '/privacy',
  },
  '/profile': {
    title: `Your Profile | ${BRAND_NAME}`,
    description: 'Manage your SafaiWalay profile.',
    canonical: '/profile',
    robots: 'noindex,nofollow',
  },
  '/bookings': {
    title: `Your Bookings | ${BRAND_NAME}`,
    description: 'Manage your service bookings.',
    canonical: '/bookings',
    robots: 'noindex,nofollow',
  },
  '/cart': {
    title: `Cart | ${BRAND_NAME}`,
    description: 'Review selected services.',
    canonical: '/cart',
    robots: 'noindex,nofollow',
  },
  '/checkout': {
    title: `Checkout | ${BRAND_NAME}`,
    description: 'Complete your SafaiWalay booking payment.',
    canonical: '/checkout',
    robots: 'noindex,nofollow',
  },
  '/checkout/success': {
    title: `Checkout Success | ${BRAND_NAME}`,
    description: 'Payment success page.',
    canonical: '/checkout/success',
    robots: 'noindex,nofollow',
  },
  '/admin': {
    title: `Admin | ${BRAND_NAME}`,
    description: 'Admin dashboard.',
    canonical: '/admin',
    robots: 'noindex,nofollow',
  },
};

export function getRouteSeo(path: string): RouteSEOConfig | undefined {
  return ROUTE_SEO[path];
}

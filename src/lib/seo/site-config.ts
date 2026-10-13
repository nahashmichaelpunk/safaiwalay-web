import { BRAND_LOGO_SRC } from '@/lib/branding';

export const SITE_URL = 'https://safaiwalay.com' as const;
export const BRAND_NAME = 'SafaiWalay' as const;
export const BRAND_LEGAL_NAME = 'SafaiWalay - Professional Cleaning Services' as const;
export const BRAND_DESCRIPTION =
  'Professional cleaning services in Nagpur. Water tank cleaning, solar panel cleaning, patio and parking cleaning, terrace and roof cleaning, carpet cleaning, and car wash.' as const;

export const SUPPORT_EMAIL = 'support@safaiwalay.com' as const;
export const PRIMARY_PHONE_E164 = '+918600275796' as const;
export const PRIMARY_PHONE_DISPLAY = '+91 86002 75796' as const;

export const SERVICE_CITY = 'Nagpur' as const;
export const SERVICE_STATE = 'Maharashtra' as const;
export const SERVICE_COUNTRY_CODE = 'IN' as const;
export const SERVICE_POSTAL_CODE = '440001' as const;

export const DEFAULT_OG_IMAGE = BRAND_LOGO_SRC;
export const DEFAULT_OG_IMAGE_ALT = 'SafaiWalay cleaning services logo';

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/safaiwalay',
  facebook: 'https://www.facebook.com/safaiwalay',
  linkedin: 'https://www.linkedin.com/company/safaiwalay',
} as const;

export type RobotsPolicy = 'index,follow' | 'noindex,nofollow';

export function toAbsoluteUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    return SITE_URL;
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  if (!pathOrUrl.startsWith('/')) {
    return `${SITE_URL}/${pathOrUrl}`;
  }

  return `${SITE_URL}${pathOrUrl}`;
}

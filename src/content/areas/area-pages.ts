export interface AreaLandingContent {
  slug: string;
  name: string;
  overview: string;
  responseTime: string;
  landmarks: string[];
  focusServices: string[];
}

export const AREA_LANDING_PAGES: AreaLandingContent[] = [
  {
    slug: 'sadar-cleaning-services',
    name: 'Sadar',
    overview: 'Premium residential and mixed commercial area with regular demand for deep home and parking cleaning.',
    responseTime: '30 minutes',
    landmarks: ['Sadar Bazaar', 'Central Museum', 'Zero Mile'],
    focusServices: ['Patio & Parking Cleaning', 'Carpet Cleaning', 'Water Tank Cleaning'],
  },
  {
    slug: 'civil-lines-cleaning-services',
    name: 'Civil Lines',
    overview: 'Business and institutional area requiring office, facade, and maintenance-focused cleaning operations.',
    responseTime: '25 minutes',
    landmarks: ['High Court Zone', 'Government Offices', 'Business Blocks'],
    focusServices: ['Solar Panel Cleaning', 'Terrace & Roof Cleaning', 'Office Cleaning'],
  },
  {
    slug: 'sitabuldi-cleaning-services',
    name: 'Sitabuldi',
    overview: 'High-footfall area with mixed residential and retail spaces requiring periodic deep cleaning.',
    responseTime: '20 minutes',
    landmarks: ['Sitabuldi Fort', 'Railway Vicinity', 'Commercial Streets'],
    focusServices: ['Carpet Cleaning', 'Car Wash', 'Water Tank Cleaning'],
  },
  {
    slug: 'dharampeth-cleaning-services',
    name: 'Dharampeth',
    overview: 'Educational and residential locality with demand for recurring home and terrace maintenance.',
    responseTime: '35 minutes',
    landmarks: ['Dharampeth College Area', 'Temple Belt', 'Market Streets'],
    focusServices: ['Terrace & Roof Cleaning', 'Patio & Parking Cleaning', 'Carpet Cleaning'],
  },
  {
    slug: 'ramdaspeth-cleaning-services',
    name: 'Ramdaspeth',
    overview: 'Apartment-dense locality where periodic hygienic cleaning and water system maintenance are essential.',
    responseTime: '40 minutes',
    landmarks: ['Gandhi Sagar Zone', 'Apartment Blocks', 'Local Market Roads'],
    focusServices: ['Water Tank Cleaning', 'Carpet Cleaning', 'Car Wash'],
  },
  {
    slug: 'wardha-road-cleaning-services',
    name: 'Wardha Road',
    overview: 'Long corridor of residential, IT, and commercial establishments requiring scale-ready cleaning support.',
    responseTime: '45 minutes',
    landmarks: ['IT Park Vicinity', 'Industrial Pockets', 'Residential Corridors'],
    focusServices: ['Solar Panel Cleaning', 'Patio & Parking Cleaning', 'Terrace & Roof Cleaning'],
  },
];

export function getAreaPageBySlug(slug: string): AreaLandingContent | undefined {
  return AREA_LANDING_PAGES.find((area) => area.slug === slug);
}

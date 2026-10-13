export interface ServiceLandingContent {
  slug: string;
  name: string;
  shortTitle: string;
  summary: string;
  longDescription: string;
  pricingText: string;
  startingPrice: number;
  image: string;
  benefits: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export const SERVICE_LANDING_PAGES: ServiceLandingContent[] = [
  {
    slug: 'water-tank-cleaning-nagpur',
    name: 'Water Tank Cleaning in Nagpur',
    shortTitle: 'Water Tank Cleaning',
    summary: 'Professional tank cleaning and sanitization for safer household water.',
    longDescription:
      'SafaiWalay provides complete water tank cleaning in Nagpur for residential and commercial properties. We remove sludge, scrub inner walls, and sanitize the tank to maintain cleaner storage conditions.',
    pricingText:
      'Plastic up to 2000L: ₹600 flat. 2001L–10,000L: ₹1499 flat. Above 10,000L: ₹1499 per started 10,000L.',
    startingPrice: 600,
    image: '/Images/water_tank_cleaning.webp',
    benefits: [
      'Sludge and sediment removal',
      'Inner wall scrubbing and sanitization',
      'Cleaner water storage hygiene process',
      'Trained service teams with safe process checks',
    ],
    faqs: [
      {
        question: 'How often should I clean my water tank in Nagpur?',
        answer:
          'Most homes benefit from professional water tank cleaning every 6 months, or sooner if water quality visibly drops.',
      },
      {
        question: 'Do you clean both plastic and concrete tanks?',
        answer:
          'Yes, SafaiWalay supports common residential and commercial tank types based on size and access conditions.',
      },
    ],
  },
  {
    slug: 'solar-panel-cleaning-nagpur',
    name: 'Solar Panel Cleaning in Nagpur',
    shortTitle: 'Solar Panel Cleaning',
    summary: 'Dust and residue removal to maintain solar efficiency and output.',
    longDescription:
      'Our solar panel cleaning service in Nagpur helps improve energy output by removing dust, bird droppings, and residue buildup. We use safe cleaning methods designed for panel surface protection.',
    pricingText: '₹100 per KW based on installed capacity.',
    startingPrice: 100,
    image: '/Images/solar_panel_cleaning.webp',
    benefits: [
      'Dust and bird dropping removal',
      'Safe process for panel surface care',
      'Improved energy performance consistency',
      'Suitable for homes and small commercial rooftops',
    ],
    faqs: [
      {
        question: 'How often should solar panels be cleaned?',
        answer: 'In dusty conditions, monthly to bi-monthly cleaning is recommended for consistent performance.',
      },
      {
        question: 'Is high-pressure washing used on panels?',
        answer:
          'No. Panels are cleaned with controlled, surface-safe methods to reduce damage risk.',
      },
    ],
  },
  {
    slug: 'patio-parking-cleaning-nagpur',
    name: 'Patio & Parking Cleaning in Nagpur',
    shortTitle: 'Patio & Parking Cleaning',
    summary: 'Deep surface cleaning for stained patios, driveways, and parking spaces.',
    longDescription:
      'SafaiWalay patio and parking cleaning in Nagpur targets oil stains, grime, algae, and surface dirt from residential and commercial spaces using suitable pressure and deep cleaning methods.',
    pricingText: '₹12 per sq.ft based on measured service area.',
    startingPrice: 12,
    image: '/Images/patio_parking_cleaning.webp',
    benefits: [
      'Oil stain and grime removal',
      'Pressure washing with controlled process',
      'Improved curb appeal and safety',
      'Residential and society parking support',
    ],
    faqs: [
      {
        question: 'Can old oil stains be fully removed?',
        answer:
          'Results vary by age and material, but our process significantly improves visible staining in most cases.',
      },
      {
        question: 'Do you provide service for apartment parking lots?',
        answer:
          'Yes, we handle both individual slots and larger parking areas based on access windows.',
      },
    ],
  },
  {
    slug: 'carpet-cleaning-nagpur',
    name: 'Carpet Cleaning in Nagpur',
    shortTitle: 'Carpet Cleaning',
    summary: 'Deep carpet cleaning for dust extraction, odor control, and hygiene.',
    longDescription:
      'Our carpet cleaning service in Nagpur includes deep extraction and surface treatment workflows to reduce dust, odor, and stains while improving freshness for home and office carpets.',
    pricingText: 'Per unit pricing based on carpet type and size.',
    startingPrice: 500,
    image: '/Images/carpet_cleaning.webp',
    benefits: [
      'Deep dust extraction',
      'Stain and odor treatment',
      'Fresher indoor environment',
      'Suitable for homes and office carpets',
    ],
    faqs: [
      {
        question: 'How long does carpet drying usually take?',
        answer:
          'Drying time depends on ventilation and material, commonly between a few hours and one day.',
      },
      {
        question: 'Do you clean wall-to-wall carpets?',
        answer:
          'Yes, we support both loose and fixed carpets after site suitability review.',
      },
    ],
  },
  {
    slug: 'car-wash-nagpur',
    name: 'Car Wash Service in Nagpur',
    shortTitle: 'Car Wash',
    summary: 'Professional interior and exterior car cleaning with attention to detail.',
    longDescription:
      'SafaiWalay car wash service in Nagpur covers complete exterior wash and interior cleanup for routine maintenance and better vehicle hygiene.',
    pricingText: 'Per vehicle pricing based on vehicle category.',
    startingPrice: 249,
    image: '/Images/car_wash.webp',
    benefits: [
      'Exterior body wash and finish',
      'Interior dust and cleanup',
      'Routine maintenance support',
      'Convenient service scheduling',
    ],
    faqs: [
      {
        question: 'Do you offer service for SUVs and premium cars?',
        answer:
          'Yes, pricing and process vary by vehicle category and service depth.',
      },
      {
        question: 'Can I schedule regular weekly cleaning?',
        answer:
          'Yes, recurring plans can be arranged based on your preferred time slots.',
      },
    ],
  },
  {
    slug: 'terrace-roof-cleaning-nagpur',
    name: 'Terrace & Roof Cleaning in Nagpur',
    shortTitle: 'Terrace & Roof Cleaning',
    summary: 'Complete terrace cleaning for debris, drain lines, and surface buildup.',
    longDescription:
      'Our terrace and roof cleaning in Nagpur removes debris, surface stains, and drainage blockages while improving maintenance and usability of rooftop areas.',
    pricingText: '₹12 per sq.ft based on cleaned terrace area.',
    startingPrice: 12,
    image: '/Images/terrace_roof_cleaning.webp',
    benefits: [
      'Debris and drain cleanup',
      'Surface dirt and stain reduction',
      'Improved rooftop maintenance readiness',
      'Suitable for homes and societies',
    ],
    faqs: [
      {
        question: 'Do you clean terrace drains too?',
        answer:
          'Yes, drain and runoff points are checked and cleaned as part of service scope when accessible.',
      },
      {
        question: 'Can you handle moss or algae buildup?',
        answer:
          'Yes, we include suitable treatment steps for common biological surface buildup.',
      },
    ],
  },
];

export function getServicePageBySlug(slug: string): ServiceLandingContent | undefined {
  return SERVICE_LANDING_PAGES.find((service) => service.slug === slug);
}

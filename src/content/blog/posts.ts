export interface BlogPostContent {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  featured?: boolean;
  content: string[];
}

export const BLOG_POSTS: BlogPostContent[] = [
  {
    id: 1,
    title: 'Complete Guide to Home Cleaning in Nagpur: Monsoon Edition',
    slug: 'home-cleaning-nagpur-monsoon-guide',
    excerpt:
      "Learn the best practices for home cleaning during Nagpur's monsoon season. Tips for preventing mold, maintaining hygiene, and keeping your home fresh.",
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-15',
    readTime: '5 min read',
    category: 'Home Cleaning',
    tags: ['Monsoon Cleaning', 'Nagpur', 'Home Maintenance', 'Hygiene'],
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1200',
    featured: true,
    content: [
      "Monsoon season in Nagpur creates extra dust, mud, and moisture buildup across homes. A fixed weekly cleaning schedule helps maintain hygiene and reduce mold risk.",
      'Start with high-touch surfaces and damp corners. Use quick-dry mopping and keep cross ventilation active after every deep cleaning session.',
      'For homes with kids, elderly members, or pets, focus on bathroom disinfection and floor sanitization at higher frequency.',
    ],
  },
  {
    id: 2,
    title: "Office Cleaning Tips for Nagpur's Business Districts",
    slug: 'office-cleaning-tips-nagpur-business',
    excerpt:
      "Professional office cleaning strategies for Civil Lines, Sadar, and other business areas in Nagpur. Boost productivity with a clean workspace.",
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-12',
    readTime: '4 min read',
    category: 'Office Cleaning',
    tags: ['Office Cleaning', 'Productivity', 'Business', 'Nagpur'],
    image: 'https://images.unsplash.com/photo-1613963931023-5dc59437c8a6?auto=format&fit=crop&q=80&w=1200',
    content: [
      'A clean office directly impacts employee productivity and client confidence.',
      'Use zoned cleaning: entry/lobby, workstations, meeting rooms, pantry, and restrooms with separate checklists.',
      'Set monthly deep-cleaning for carpets and glass partitions in high-footfall business areas.',
    ],
  },
  {
    id: 3,
    title: 'Deep Cleaning Checklist: Before and After Monsoon in Nagpur',
    slug: 'deep-cleaning-checklist-nagpur-monsoon',
    excerpt:
      'Essential deep cleaning tasks to prepare your Nagpur home for monsoon and post-monsoon cleanup. Complete checklist for homeowners.',
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-10',
    readTime: '6 min read',
    category: 'Deep Cleaning',
    tags: ['Deep Cleaning', 'Monsoon', 'Checklist', 'Nagpur'],
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=1200',
    content: [
      'Pre-monsoon cleaning should prioritize roof drains, balconies, and moisture-prone walls.',
      'Post-monsoon cleaning should include anti-fungal treatment, mattress vacuuming, and kitchen exhaust cleanup.',
      'Document recurring issue zones to schedule preventive service before each season.',
    ],
  },
  {
    id: 4,
    title: 'Eco-Friendly Cleaning Products: Safe for Nagpur Families',
    slug: 'eco-friendly-cleaning-products-nagpur',
    excerpt:
      'Discover eco-friendly cleaning solutions that are safe for children and pets in Nagpur homes. Chemical-free alternatives for better health.',
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-08',
    readTime: '3 min read',
    category: 'Eco-Friendly',
    tags: ['Eco-Friendly', 'Health', 'Family', 'Safe Cleaning'],
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=1200',
    content: [
      'Eco-friendly cleaning focuses on low-residue, low-toxicity formulations that are safer for children and pets.',
      'For frequent home maintenance, choose products compatible with local water conditions and sensitive surfaces.',
      'Always pair product choice with correct dilution and process control for best hygiene outcomes.',
    ],
  },
  {
    id: 5,
    title: 'Carpet Cleaning in Nagpur: Dealing with Dust and Humidity',
    slug: 'carpet-cleaning-nagpur-dust-humidity',
    excerpt:
      "Professional carpet cleaning tips for Nagpur's climate. How to maintain carpets in high humidity and dust conditions.",
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-05',
    readTime: '4 min read',
    category: 'Carpet Cleaning',
    tags: ['Carpet Cleaning', 'Humidity', 'Dust', 'Nagpur Climate'],
    image: 'https://images.unsplash.com/photo-1575414014277-ff5c6d8c6f7d?auto=format&fit=crop&q=80&w=1200',
    content: [
      'Vacuuming alone is not enough in high-dust environments. Deep extraction helps remove embedded particles.',
      'Humidity can trap odors and moisture in carpet fibers, increasing microbial growth risk.',
      'Plan periodic professional extraction and complete drying for better indoor air quality.',
    ],
  },
  {
    id: 6,
    title: 'Post-Construction Cleaning: Making Your New Nagpur Home Shine',
    slug: 'post-construction-cleaning-nagpur',
    excerpt:
      'Complete guide to post-construction cleaning in Nagpur. From dust removal to final touches, make your new home move-in ready.',
    author: 'SafaiWalay Team',
    publishedAt: '2024-01-03',
    readTime: '5 min read',
    category: 'Post-Construction',
    tags: ['Post-Construction', 'New Home', 'Dust Removal', 'Nagpur'],
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1200',
    content: [
      'Post-construction cleanup requires staged cleaning: debris removal, dust extraction, wet wipe, and finishing polish.',
      'Fine cement dust settles in hidden joints and vents; use detailed checklist-based cleaning to prevent re-soiling.',
      'Before move-in, verify all wet areas, balcony edges, and storage spaces are cleaned and sanitized.',
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPostContent | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

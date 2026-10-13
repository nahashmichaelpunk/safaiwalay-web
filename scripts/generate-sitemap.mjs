import fs from 'node:fs';
import path from 'node:path';

const siteUrl = 'https://safaiwalay.com';
const outputPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
const now = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/areas', changefreq: 'weekly', priority: '0.9' },
  { path: '/testimonials', changefreq: 'weekly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

const serviceRoutes = [
  'water-tank-cleaning-nagpur',
  'solar-panel-cleaning-nagpur',
  'patio-parking-cleaning-nagpur',
  'carpet-cleaning-nagpur',
  'car-wash-nagpur',
  'terrace-roof-cleaning-nagpur',
].map((slug) => ({
  path: `/services/${slug}`,
  changefreq: 'weekly',
  priority: '0.85',
}));

const areaRoutes = [
  'sadar-cleaning-services',
  'civil-lines-cleaning-services',
  'sitabuldi-cleaning-services',
  'dharampeth-cleaning-services',
  'ramdaspeth-cleaning-services',
  'wardha-road-cleaning-services',
].map((slug) => ({
  path: `/areas/${slug}`,
  changefreq: 'weekly',
  priority: '0.75',
}));

const blogRoutes = [
  'home-cleaning-nagpur-monsoon-guide',
  'office-cleaning-tips-nagpur-business',
  'deep-cleaning-checklist-nagpur-monsoon',
  'eco-friendly-cleaning-products-nagpur',
  'carpet-cleaning-nagpur-dust-humidity',
  'post-construction-cleaning-nagpur',
].map((slug) => ({
  path: `/blog/${slug}`,
  changefreq: 'monthly',
  priority: '0.65',
}));

const allRoutes = [...staticRoutes, ...serviceRoutes, ...areaRoutes, ...blogRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`sitemap.xml generated at ${outputPath}`);

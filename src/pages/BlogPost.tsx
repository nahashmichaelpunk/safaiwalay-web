import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/seo/SEOHead';
import {
  getBlogPostingSchema,
  getBreadcrumbSchema,
} from '@/components/seo/StructuredData';
import { getBlogPostBySlug } from '@/content/blog/posts';
import { toAbsoluteUrl } from '@/lib/seo/site-config';
import { trackEvent } from '@/lib/monitoring/events';

export default function BlogPost() {
  const { slug = '' } = useParams();
  const post = getBlogPostBySlug(slug);

  useEffect(() => {
    if (!post) return;
    trackEvent('view_blog_post', { slug: post.slug, category: post.category });
  }, [post]);

  if (!post) {
    return (
      <div className="container py-24">
        <SEOHead
          title="Blog post not found | SafaiWalay"
          description="The requested article was not found."
          canonical={`/blog/${slug}`}
          robots="noindex,nofollow"
        />
        <h1 className="text-3xl font-bold mb-4">Article not found</h1>
        <p className="text-muted-foreground mb-6">
          This article is unavailable or may have been moved.
        </p>
        <Button asChild>
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

  const schema = [
    getBreadcrumbSchema(breadcrumbs),
    getBlogPostingSchema({
      title: post.title,
      description: post.excerpt,
      slug: post.slug,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      image: post.image,
      authorName: post.author,
    }),
  ];

  return (
    <div className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
      <SEOHead
        title={`${post.title} | SafaiWalay Blog`}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        ogTitle={post.title}
        ogDescription={post.excerpt}
        ogImage={toAbsoluteUrl(post.image)}
        ogUrl={`/blog/${post.slug}`}
        structuredData={schema}
      />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-6 -ml-3">
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all posts
          </Link>
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">{post.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString('en-IN')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </header>

        <img
          src={post.image}
          alt={post.title}
          width={1200}
          height={675}
          className="w-full rounded-xl shadow-md mb-10 object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        <div className="space-y-5 text-base leading-7 text-foreground/90">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <section className="mt-12 p-6 rounded-xl border bg-card">
          <h2 className="text-2xl font-semibold mb-3">Need professional help in Nagpur?</h2>
          <p className="text-muted-foreground mb-5">
            Book a verified SafaiWalay cleaning service for homes and businesses.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link
                to="/services"
                onClick={() => trackEvent('click_blog_cta', { slug: post.slug, target: 'services' })}
              >
                Explore Services
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                to="/contact"
                onClick={() => trackEvent('click_blog_cta', { slug: post.slug, target: 'contact' })}
              >
                Contact us
              </Link>
            </Button>
          </div>
        </section>
      </article>
    </div>
  );
}

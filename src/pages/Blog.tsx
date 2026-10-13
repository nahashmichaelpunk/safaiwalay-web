import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { getBlogPostingSchema, getBreadcrumbSchema } from '@/components/seo/StructuredData';
import OptimizedImage from '@/components/OptimizedImage';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { BLOG_POSTS } from '@/content/blog/posts';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/monitoring/events';

export default function Blog() {
  const blogPosts = BLOG_POSTS;

  useEffect(() => {
    trackEvent('view_blog_list', {});
  }, []);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" }
  ];

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title="Cleaning Tips & Guides Blog | SafaiWalay Nagpur | Home & Office Cleaning Advice"
        description="Expert cleaning tips and guides for Nagpur residents. Learn about home cleaning, office maintenance, eco-friendly solutions, and more from SafaiWalay's cleaning experts."
        keywords="cleaning tips Nagpur, home cleaning guide Nagpur, office cleaning advice, eco-friendly cleaning, घर की सफाई टिप्स नागपुर, सफाई गाइड नागपुर"
        canonical="/blog"
        ogTitle="Cleaning Tips & Guides Blog | SafaiWalay Nagpur"
        ogDescription="Expert cleaning tips and guides for Nagpur residents. Learn about home cleaning, office maintenance, and eco-friendly solutions."
        ogImage={BRAND_LOGO_SRC}
        ogUrl="/blog"
        structuredData={[
          getBreadcrumbSchema(breadcrumbs),
          ...blogPosts.map((post) =>
            getBlogPostingSchema({
              title: post.title,
              description: post.excerpt,
              slug: post.slug,
              datePublished: post.publishedAt,
              dateModified: post.updatedAt,
              image: post.image,
              authorName: post.author,
            })
          ),
        ]}
      />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">
            Cleaning Tips & Guides for Nagpur
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Expert advice on home cleaning, office maintenance, and eco-friendly solutions 
            tailored for Nagpur's climate and lifestyle.
          </p>
        </motion.div>

        {/* Featured Post */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative">
                  <OptimizedImage
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-64 lg:h-full object-cover"
                    priority
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(featuredPost.publishedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{featuredPost.title}</h2>
                  <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredPost.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild>
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        onClick={() =>
                          trackEvent('view_blog_post', {
                            slug: featuredPost.slug,
                            category: featuredPost.category,
                          })
                        }
                      >
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <OptimizedImage
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-white/90 text-gray-800">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={`/blog/${post.slug}`}
                        onClick={() =>
                          trackEvent('view_blog_post', { slug: post.slug, category: post.category })
                        }
                      >
                        Read More <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Card className="max-w-2xl mx-auto border-primary/20 bg-card shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold font-brand text-foreground mb-4">
                Need Professional Cleaning Services?
              </h3>
              <p className="text-muted-foreground mb-6">
                While our blog provides great tips, sometimes you need professional help. 
                Let SafaiWalay handle your cleaning needs in Nagpur.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link
                    to="/services"
                    onClick={() =>
                      trackEvent('click_blog_cta', { slug: 'blog_index', target: 'services' })
                    }
                  >
                    Book Cleaning Service
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link
                    to="/contact"
                    onClick={() =>
                      trackEvent('click_blog_cta', { slug: 'blog_index', target: 'contact' })
                    }
                  >
                    Get Free Quote
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

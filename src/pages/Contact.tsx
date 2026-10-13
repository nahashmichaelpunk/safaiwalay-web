import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/seo/SEOHead';
import { getBreadcrumbSchema } from '@/components/seo/StructuredData';
import LocalBusinessInfo from '@/components/LocalBusinessInfo';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { WHATSAPP_CHAT_URL } from '@/lib/contact-links';
import { SUPPORT_EMAIL } from '@/lib/seo/site-config';
import {
  canSubmitNow,
  isLikelyBotSubmission,
  sanitizeExternalUrl,
} from '@/lib/security/web-security';

export default function Contact() {
  const { toast } = useToast();
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    message: '',
    website: '',
  });

  const contactInfo = [
    {
      icon: Phone,
      title: 'Office',
      content: '89569 93132',
      link: 'tel:+918956993132',
    },
    {
      icon: Phone,
      title: 'Mobile',
      content: '93093 49629',
      link: 'tel:+919309349629',
    },
    {
      icon: Phone,
      title: 'WhatsApp',
      content: '86002 75796',
      link: WHATSAPP_CHAT_URL,
    },
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitNow(lastSubmittedAt)) {
      toast({
        title: 'Please wait a moment',
        description: 'For security, wait a few seconds before sending another message.',
        variant: 'destructive',
      });
      return;
    }

    if (
      isLikelyBotSubmission({
        honeypot: formData.website,
        message: formData.message,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
    ) {
      toast({
        title: 'Unable to send message',
        description: 'Please check the form details and try again.',
        variant: 'destructive',
      });
      return;
    }

    const subject = 'Contact Form Submission from SafaiWalay Website';
    const body = `
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}

Message:
${formData.message}
    `.trim();

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const safeMailtoLink = sanitizeExternalUrl(mailtoLink);
    if (!safeMailtoLink) {
      toast({
        title: 'Unable to open email client',
        description: 'The generated email link failed security validation.',
        variant: 'destructive',
      });
      return;
    }

    window.location.href = safeMailtoLink;
    setLastSubmittedAt(Date.now());

    toast({
      title: "Opening Email Client",
      description: "Your default email client will open with the form details.",
    });
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      message: '',
      website: '',
    });
  };

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" }
  ];

  return (
    <div className="py-24 bg-gradient-to-b from-background via-primary/10 to-primary/15">
      <SEOHead
        title="Contact SafaiWalay - Professional Cleaning Services in Nagpur | Get Quote"
        description="Contact SafaiWalay for professional cleaning services in Nagpur. Get a free quote for home cleaning, office cleaning, and more. Call us or fill out our contact form."
        keywords="contact SafaiWalay, cleaning service Nagpur contact, get quote Nagpur, cleaning service phone number, घर की सफाई संपर्क नागपुर, सफाईवाला संपर्क"
        canonical="/contact"
        ogTitle="Contact SafaiWalay - Professional Cleaning Services in Nagpur"
        ogDescription="Contact SafaiWalay for professional cleaning services in Nagpur. Get a free quote for home cleaning, office cleaning, and more."
        ogImage={BRAND_LOGO_SRC}
        ogUrl="/contact"
        structuredData={getBreadcrumbSchema(breadcrumbs)}
      />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold font-brand mb-4 text-foreground">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with us for any questions or concerns
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <a
                    href={item.link}
                    className="text-lg font-bold text-primary hover:text-primary/90 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.content}
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot: hidden field should remain empty for real users */}
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter your complete address"
                    className="min-h-[80px]"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    className="min-h-[120px]"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Local Business Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold font-brand text-center text-foreground mb-8">
            Our Business Information
          </h2>
          <LocalBusinessInfo />
        </motion.div>
      </div>
    </div>
  );
}


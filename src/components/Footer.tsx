
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { trackEmailClick, trackPhoneCall, trackSocialClick } from '@/components/Analytics';

// Hardcoded featured reviews
const featuredReviews = [
  {
    name: "Roshan Khatri",
    location: "Khamla Nagpur",
    service: "Roof/Terrace Cleaning",
    rating: 5,
    comment: "The service is great along with friendly cleaners and professional behaviour. The support team is also great to give us store credit for next service delayed service which was hardly 30 minutes."
  },
  {
    name: "Royal Gayatri Park 2",
    location: "Isasani Hingna",
    service: "Water Tank Cleaning",
    rating: 5,
    comment: "The manager is approachable and is willing to provide service at night if urgent and required. The work is spotless and they also guide on how to wash and what to use."
  },
  {
    name: "Ranas Solar Service",
    location: "Isasani Hingna",
    service: "Solar Panel Cleaning",
    rating: 5,
    comment: "Service is top notch, with required diagnostics of the issue and report. Commercial orders ke liye manager khud jaake service inspection karke report karta hai with images and videos."
  }
];

export default function Footer() {

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61560478442188', name: 'facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/safai_walay/', name: 'instagram' },
    { icon: Twitter, href: 'https://twitter.com/safaiwalay', name: 'twitter' },
    { icon: Youtube, href: 'https://youtube.com/safaiwalay', name: 'youtube' },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] w-full py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={BRAND_LOGO_SRC}
                alt="SafaiWalay logo"
                className="h-8 w-auto object-contain"
                width={120}
                height={32}
              />
              <h3 className="text-lg font-semibold font-brand">SafaiWalay</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional cleaning services for homes and offices. Making spaces sparkle since 2023.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-primary">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Reviews</h3>
            <div className="space-y-2">
              {featuredReviews.map((review, index) => (
                <div key={index} className="text-sm">
                  <div className="flex mb-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">"{review.comment}"</p>
                  <p className="font-medium mt-1 text-primary">
                    - {review.name} ({review.location})
                    <span className="text-muted-foreground text-xs block mt-0.5">
                      {review.service}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Email:{' '}
                <a
                  href="mailto:support@safaiwalay.com"
                  onClick={() => trackEmailClick('support@safaiwalay.com', 'footer')}
                >
                  support@safaiwalay.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Phone:{' '}
                <a href="tel:+918600275796" onClick={() => trackPhoneCall('+918600275796', 'footer')}>
                  +91 86002-75796
                </a>
              </p>
            </div>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackSocialClick(social.name, 'footer')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} punktech.in - All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

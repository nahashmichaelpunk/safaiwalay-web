import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import { getRouteSeo } from '@/lib/seo/route-seo';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function Privacy() {
  const seo = getRouteSeo('/privacy');

  return (
    <div className="min-h-screen py-24 bg-gradient-to-b from-primary/10 to-background">
      {seo && (
        <SEOHead
          title={seo.title}
          description={seo.description}
          canonical={seo.canonical}
          robots={seo.robots}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-2 shadow-lg">
          <CardContent className="p-8 prose prose-neutral max-w-none">
            <motion.h1 
              className="text-4xl font-bold font-brand mb-8 text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Privacy Policy
            </motion.h1>
            
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.section variants={itemVariants}>
                <div className="p-4 rounded-lg bg-primary/5 mb-8">
                  <p className="text-sm text-muted-foreground">
                    <strong>Effective Date:</strong> 10/10/2022<br />
                    <strong>Last Updated:</strong> 02/02/2025
                  </p>
                </div>

                <p className="text-muted-foreground">
                  At <span className="text-primary font-semibold">Safaiwalay.com</span>, we are committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, and safeguard your personal information.
                </p>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">1. Information We Collect</h2>
                
                <div className="bg-white p-6 rounded-lg border border-primary/15 space-y-4">
                  <h3 className="text-xl font-semibold text-primary">1.1 Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name</li>
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Home or service location address</li>
                    <li>Payment details (processed securely by third-party providers)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-primary mt-6">1.2 Non-Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP Address</li>
                    <li>Browser type and version</li>
                    <li>Device type</li>
                    <li>Website usage patterns</li>
                  </ul>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">2. How We Use Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Process bookings and provide services',
                    'Send confirmations and reminders',
                    'Improve service quality',
                    'Process payments securely',
                    'Prevent fraud and ensure security',
                    'Comply with legal obligations'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 rounded-lg bg-primary/5">
                      <div className="h-2 w-2 rounded-full bg-primary/50" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">3. Information Sharing & Disclosure</h2>
                <div className="bg-white p-6 rounded-lg border border-primary/15">
                  <p className="font-semibold text-primary mb-4">We do not sell or rent your personal information. However, we may share it with:</p>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary/50" />
                      </div>
                      <span><strong>Trusted Service Providers:</strong> Payment processors, customer support tools, and analytics platforms</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary/50" />
                      </div>
                      <span><strong>Legal Authorities:</strong> If required by law or for fraud prevention</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary/50" />
                      </div>
                      <span><strong>Business Transfers:</strong> In case of merger, sale, or restructuring</span>
                    </li>
                  </ul>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">4. Your Rights & Choices</h2>
                <div className="space-y-4">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and update your personal data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request details about your data processing</li>
                    <li>Request data deletion (subject to legal requirements)</li>
                  </ul>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">5. Data Security</h2>
                <div className="bg-primary/5 p-6 rounded-lg space-y-4">
                  <p>We implement strong security measures including:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Encryption of sensitive information</li>
                    <li>Secure servers and firewalls</li>
                    <li>Restricted access to authorized personnel</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    While we strive to protect your data, no method of online transmission is 100% secure.
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">6. Contact Us</h2>
                <div className="bg-white p-6 rounded-lg border border-primary/15">
                  <p className="mb-4">For privacy-related questions or concerns, reach out to us at:</p>
                  <div className="space-y-2">
                    <p>📞 Phone: 93093-49629</p>
                    <p>📧 Email: support@safaiwalay.com</p>
                  </div>
                </div>
              </motion.section>

              <motion.div 
                className="mt-8 p-6 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-center"
                variants={itemVariants}
              >
                <p className="font-semibold">
                  BY USING OUR SERVICES, YOU AGREE TO THIS PRIVACY POLICY.<br />
                  THANK YOU FOR TRUSTING SAFAIWALAY.COM!
                </p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
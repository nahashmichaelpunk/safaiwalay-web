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

export default function Terms() {
  const seo = getRouteSeo('/terms');

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
              Terms of Service
            </motion.h1>
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <section>
                <motion.p 
                  className="text-sm text-muted-foreground mb-8 p-4 rounded-lg bg-primary/5"
                  variants={itemVariants}
                >
                  <strong>Effective Date:</strong> 10/10/2022<br />
                  <strong>Last Updated:</strong> 02/02/2025
                </motion.p>

                <p>
                  Welcome to <strong>Safaiwalay.com</strong>! These Terms of Service ("Terms") govern your use of our website and cleaning services. 
                  By accessing or using Safaiwalay.com, you agree to be bound by these Terms. If you do not agree, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">1. ABOUT US</h2>
                <p>
                  Safaiwalay.com is a professional cleaning service provider located in Nagpur, Maharashtra, offering affordable and high-quality cleaning solutions. 
                  Our mission is to ensure a clean and hygienic environment for all, regardless of financial class.
                </p>
                <p className="mt-4">
                  For any inquiries, you can contact us at:<br />
                  📞 Phone: 93093-49629<br />
                  📧 Email: support@safaiwalay.com
                </p>
              </section>

              <section>
                <motion.h2 
                  className="text-2xl font-semibold mt-8 mb-4 text-primary"
                  variants={itemVariants}
                >
                  2. SERVICES OFFERED & PRICING
                </motion.h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-primary/15 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-primary/5">
                        <th className="border border-primary/15 p-3 text-left font-semibold text-primary">Service</th>
                        <th className="border border-primary/15 p-3 text-left font-semibold text-primary">Pricing (indicative)</th>
                        <th className="border border-primary/15 p-3 text-left font-semibold text-primary">Inclusions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-primary/5 transition-colors">
                        <td className="border border-primary/15 p-3">Patio & Parking Cleaning</td>
                        <td className="border border-primary/15 p-3 font-semibold text-primary">₹12 per sq.ft (by area entered at booking)</td>
                        <td className="border border-primary/15 p-3">Deep cleaning, Oil stain removal, Pressure washing, Sanitization</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Solar Panel Cleaning</td>
                        <td className="border p-2">₹100 per KW (by capacity entered at booking)</td>
                        <td className="border p-2">Performance optimization, Dust removal, Bird dropping cleaning</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Carpet Cleaning</td>
                        <td className="border p-2">Per unit (catalog rate × number of units)</td>
                        <td className="border p-2">Deep stain removal, Dust extraction, Deodorization</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Terrace & Roof Cleaning</td>
                        <td className="border p-2">₹12 per sq.ft (by area entered at booking)</td>
                        <td className="border p-2">Waterproofing check, Debris removal, Drain cleaning</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Water Tank Cleaning</td>
                        <td className="border p-2">Plastic up to 2000L: ₹600 flat; ₹2001L–10,000L (any type): ₹1499 flat; above 10,000L: ₹1499 per started 10,000L</td>
                        <td className="border p-2">Complete emptying, Sludge removal, Wall scrubbing</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Car Wash</td>
                        <td className="border p-2">Per unit (catalog rate × number of units)</td>
                        <td className="border p-2">Exterior washing, Interior cleaning, Waxing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">3. SERVICE BOOKING & PAYMENT</h2>
                <h3 className="text-xl font-semibold mt-4 mb-2">3.1 Booking Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Services can be booked via our website, phone, or email</li>
                  <li>Customers must provide accurate details, including address and contact information</li>
                  <li>Booking confirmation will be sent via SMS or email</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4 mb-2">3.2 Payment</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment can be made via cash, UPI, or online payment</li>
                  <li>Full payment is required before or upon service completion</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">4. CANCELLATION & REFUND POLICY</h2>
                <h3 className="text-xl font-semibold mt-4 mb-2">4.1 Cancellation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancellations must be made at least 24 hours in advance</li>
                  <li>Late cancellations may incur a fee</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4 mb-2">4.2 Refunds</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refunds processed within 5-7 business days</li>
                  <li>Unsatisfactory service qualifies for a re-clean</li>
                  <li>No refunds for completed services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">5. CUSTOMER RESPONSIBILITIES</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide access to the property at scheduled time</li>
                  <li>Communicate special cleaning requests in advance</li>
                  <li>Secure valuables and fragile items</li>
                  <li>Report any pre-existing damage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">6. LIABILITY & LIMITATION OF DAMAGES</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We are not liable for normal wear and tear</li>
                  <li>Damage claims must be reported within 24 hours</li>
                  <li>Not responsible for pre-existing conditions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">7. SAFETY & HEALTH MEASURES</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Staff follows strict hygiene protocols</li>
                  <li>Use of eco-friendly cleaning products</li>
                  <li>Safe working environment must be provided</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">8. MODIFICATIONS TO TERMS</h2>
                <p>
                  We reserve the right to modify these terms at any time. Continued use of our services implies acceptance of updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">9. CONTACT US</h2>
                <p>
                  For queries or support:<br />
                  📞 Phone: 93093-49629<br />
                  📧 Email: support@safaiwalay.com
                </p>
              </section>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <motion.p 
                  className="text-center font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  BY USING OUR SERVICES, YOU AGREE TO THESE TERMS.<br />
                  THANK YOU FOR CHOOSING SAFAIWALAY.COM!
                </motion.p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
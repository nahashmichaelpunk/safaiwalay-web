import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Phone, Mail, Star, Award, Users } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import {
  PRIMARY_PHONE_DISPLAY,
  SERVICE_CITY,
  SERVICE_STATE,
  SUPPORT_EMAIL,
} from '@/lib/seo/site-config';

interface LocalBusinessInfoProps {
  showSEO?: boolean;
}

export default function LocalBusinessInfo({ showSEO = false }: LocalBusinessInfoProps) {
  const businessInfo = {
    name: "SafaiWalay - Professional Cleaning Services",
    address: `${SERVICE_CITY}, ${SERVICE_STATE}, India`,
    phone: PRIMARY_PHONE_DISPLAY,
    email: SUPPORT_EMAIL,
    hours: {
      weekdays: "6:00 AM - 10:00 PM",
      weekends: "7:00 AM - 9:00 PM",
      emergency: "24/7 Available"
    },
    stats: {
      customers: "1000+",
      rating: "4.8",
      experience: "1+ Year",
      areas: "20+"
    },
    services: [
      "Home Cleaning",
      "Office Cleaning", 
      "Deep Cleaning",
      "Carpet Cleaning",
      "Post-Construction Cleaning",
      "Industrial Cleaning"
    ],
    areas: [
      "Sadar", "Civil Lines", "Sitabuldi", "Dharampeth", 
      "Ramdaspeth", "Wardha Road", "And More"
    ]
  };

  return (
    <>
      {showSEO && (
        <SEOHead
          title="SafaiWalay Contact Information | Professional Cleaning Services Nagpur | Business Hours & Location"
          description="Contact SafaiWalay for professional cleaning services in Nagpur. Business hours, location, phone number, and service areas. Serving all areas of Nagpur with reliable cleaning services."
          keywords="SafaiWalay contact, cleaning service Nagpur contact, business hours Nagpur, cleaning service phone number, घर की सफाई संपर्क नागपुर, सफाईवाला फोन नंबर"
          canonical="/contact-info"
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-600" />
              <div>
                <p className="font-medium">{businessInfo.phone}</p>
                <p className="text-sm text-gray-600">Call for immediate booking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-600" />
              <div>
                <p className="font-medium">{businessInfo.email}</p>
                <p className="text-sm text-gray-600">Email for inquiries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-600" />
              <div>
                <p className="font-medium">{businessInfo.address}</p>
                <p className="text-sm text-gray-600">Serving all areas of Nagpur</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monday - Friday</span>
              <span className="font-medium">{businessInfo.hours.weekdays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Saturday - Sunday</span>
              <span className="font-medium">{businessInfo.hours.weekends}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Emergency</span>
                <span className="font-medium text-green-600">{businessInfo.hours.emergency}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Our Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Happy Customers</span>
              </div>
              <span className="font-bold text-lg">{businessInfo.stats.customers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Average Rating</span>
              </div>
              <span className="font-bold text-lg">{businessInfo.stats.rating}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Experience</span>
              </div>
              <span className="font-bold text-lg">{businessInfo.stats.experience}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Areas Served</span>
              </div>
              <span className="font-bold text-lg">{businessInfo.stats.areas}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services and Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Services in Nagpur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {businessInfo.services.map((service, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">{service}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas We Serve in Nagpur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {businessInfo.areas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { useAuth } from '@/lib/store';
import { WHATSAPP_TEL_HREF } from '@/lib/contact-links';
import { Phone, Mail } from 'lucide-react';

export default function PaymentBanner() {
  const { user } = useAuth();

  // Only show banner for logged-in users
  if (!user) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 text-amber-800">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-sm sm:text-base">
              We are in process of integrating payment method.
            </span>
          </div>
          <div className="text-amber-700 text-sm sm:text-base">
            After booking and confirming booking do not proceed with Paying and contact us:
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <a 
              href={WHATSAPP_TEL_HREF} 
              className="flex items-center space-x-1 text-amber-800 hover:text-amber-900 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">+91 86002 75796</span>
            </a>
            <span className="hidden sm:inline text-amber-600">or</span>
            <a 
              href="mailto:support@safaiwalay.com" 
              className="flex items-center space-x-1 text-amber-800 hover:text-amber-900 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="font-medium">support@safaiwalay.com</span>
            </a>
          </div>
          <div className="text-amber-700 text-sm sm:text-base">
            with your contact information and we will assist you.
          </div>
        </div>
      </div>
    </div>
  );
}

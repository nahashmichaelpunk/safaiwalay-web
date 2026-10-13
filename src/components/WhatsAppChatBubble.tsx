import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppChatUrl } from '@/lib/contact-links';
import { trackSocialClick } from '@/components/Analytics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const CHAT_HREF = getWhatsAppChatUrl();

export default function WhatsAppChatBubble() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={CHAT_HREF}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label="Chat with us on WhatsApp"
              onClick={() => trackSocialClick('whatsapp', 'floating_chat_bubble')}
              className={cn(
                'pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full',
                'bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <FaWhatsapp
                className="h-8 w-8"
                aria-hidden
              />
            </a>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            Chat on WhatsApp
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

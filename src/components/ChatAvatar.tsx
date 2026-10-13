import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatAvatarProps {
  role: 'user' | 'assistant';
  className?: string;
}

export default function ChatAvatar({ role, className }: ChatAvatarProps) {
  const isAssistant = role === 'assistant';
  
  return (
    <div 
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full",
        isAssistant ? "bg-primary text-primary-foreground" : "bg-muted",
        className
      )}
    >
      {isAssistant ? (
        <Bot className="h-4 w-4" />
      ) : (
        <User className="h-4 w-4" />
      )}
    </div>
  );
} 
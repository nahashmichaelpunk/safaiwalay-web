import { Message } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ChatAvatar from './ChatAvatar';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start gap-2 w-full', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <ChatAvatar role={message.role} />
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}
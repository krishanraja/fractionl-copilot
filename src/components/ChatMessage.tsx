import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export const ChatMessage = ({ content, role, timestamp }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback>
            <Bot className="h-4 w-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-lg px-4 py-2",
        isUser 
          ? "bg-primary text-primary-foreground ml-auto" 
          : "bg-card border"
      )}>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {timestamp && (
          <p className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 bg-secondary">
          <AvatarFallback>
            <User className="h-4 w-4 text-secondary-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
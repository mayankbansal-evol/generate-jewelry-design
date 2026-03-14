import { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
}

// Kept for potential future use; main Q&A flow uses ChatInterface directly
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex items-end gap-2 mb-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[--gold]/10 border border-[--gold-muted] flex items-center justify-center shrink-0">
          <span className="text-[--gold-dark] text-[10px] font-bold">AI</span>
        </div>
      )}

      <div
        className={cn(
          'max-w-[78%] px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[--gold] text-white rounded-[18px_18px_4px_18px] shadow-sm'
            : 'bg-card border border-border text-foreground rounded-[18px_18px_18px_4px] shadow-sm',
        )}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[--gold] flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold">You</span>
        </div>
      )}
    </div>
  )
}

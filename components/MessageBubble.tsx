import { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
}

// Kept for potential future use; main Q&A flow uses ChatInterface directly
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '0.75rem',
        alignItems: 'flex-end',
        gap: '0.6rem',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
            border: '1.5px solid var(--gold-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--gold-dark)', fontSize: '0.7rem', fontWeight: 700 }}>AI</span>
        </div>
      )}

      <div
        style={{
          maxWidth: '78%',
          padding: '0.85rem 1.2rem',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))'
            : 'var(--white)',
          border: isUser ? 'none' : '1.5px solid var(--cream-border)',
          color: isUser ? 'var(--white)' : 'var(--text-primary)',
          fontSize: '1rem',
          lineHeight: 1.6,
          boxShadow: isUser
            ? '0 4px 16px rgba(154,116,48,0.25)'
            : 'var(--shadow-soft)',
        }}
      >
        {message.content}
      </div>

      {isUser && (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--white)', fontSize: '0.7rem', fontWeight: 700 }}>You</span>
        </div>
      )}
    </div>
  )
}

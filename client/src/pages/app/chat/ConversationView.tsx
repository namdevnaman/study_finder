import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, Info, Send } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { getMessages, markConversationRead, sendMessage, subscribeToMessages } from '../../../services/chat'
import type { ChatMessage, ChatSummary } from '../../../lib/types'
import { supabase } from '../../../lib/supabase'
import { timeAgo } from '../../../utils/format'

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(d, today)) return 'Today'
  const yest = new Date(today)
  yest.setDate(today.getDate() - 1)
  if (same(d, yest)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function ConversationView({
  conversationId,
  summary,
  onBack,
  onInfo,
}: {
  conversationId: string
  summary: ChatSummary | null
  onBack: () => void
  onInfo: () => void
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const load = useCallback(async () => {
    const data = await getMessages(conversationId)
    setMessages(data)
    requestAnimationFrame(() => scrollToBottom())
  }, [conversationId, scrollToBottom])

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    setLoading(true)
    setMessages([])

    load()
      .catch(() => undefined)
      .finally(() => active && setLoading(false))

    void markConversationRead(conversationId).catch(() => undefined)
    const channel = subscribeToMessages(conversationId, () => {
      void load().catch(() => undefined)
    }, 'view')
    unsubscribe = () => {
      void supabase.removeChannel(channel)
    }

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [conversationId, load])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setDraft('')
    try {
      await sendMessage(conversationId, body)
      await load()
      requestAnimationFrame(() => scrollToBottom())
    } finally {
      setSending(false)
    }
  }

  const groupTitle = summary?.title || (summary?.kind === 'group' ? 'Group chat' : '')
  const subtitle = summary?.kind === 'direct' ? summary.peer_branch || 'Student' : 'Study group chat'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
            aria-label="Back to chats"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <Avatar
            name={summary?.kind === 'direct' ? summary.peer_name || 'Student' : groupTitle || 'Group'}
            src={summary?.kind === 'direct' ? summary.peer_avatar : null}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {summary?.kind === 'direct' ? summary.peer_name || 'Student' : groupTitle}
            </p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onInfo}
          className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground"
          aria-label="Conversation info"
        >
          <Info className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto bg-surface-muted/50 px-3 py-4 sm:px-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="max-w-xs text-sm text-muted">Say hello and start the conversation.</p>
          </div>
        ) : (
          <>
            {messages.map((message, i) => {
              const mine = message.sender_id === user?.id
              const showDay = i === 0 || dayLabel(message.created_at) !== dayLabel(messages[i - 1].created_at)
              const showSender = !mine && summary?.kind === 'group' && (i === 0 || messages[i - 1].sender_id !== message.sender_id)
              return (
                <div key={message.id}>
                  {showDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted shadow-card">
                        {dayLabel(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 shadow-card sm:max-w-[70%] ${mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md border border-border bg-surface text-foreground'}`}>
                      {showSender && message.sender_name && (
                        <p className="mb-0.5 text-xs font-semibold text-accent">{message.sender_name}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
                      <p className={`mt-0.5 flex items-center justify-end gap-1 font-mono text-[10px] ${mine ? 'text-on-primary/60' : 'text-muted'}`}>
                        {timeAgo(message.created_at)}&nbsp;{mine && <Check className="h-3 w-3" aria-hidden />}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={(e) => void handleSend(e)} className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2.5 sm:px-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          aria-label="Message"
          autoComplete="off"
          className="input rounded-full"
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Send message">
          {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
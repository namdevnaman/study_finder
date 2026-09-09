import { useRef, useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Field'
import { askStudyAssistant, type AssistantMessage } from '../../../services/studyAssistant'

const SUGGESTIONS = [
  'How do I stop procrastinating on a subject?',
  'Best way to study in a group?',
  'I’m stuck on a doubt in my course. What should I do?',
  'How should I plan for exams?',
]

export default function StudyAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || loading) return
    setInput('')
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', content: question }])
    try {
      const history = [...messages, { role: 'user', content: question } as AssistantMessage]
      const { reply } = await askStudyAssistant(question, history)
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Sorry, I couldn’t reach the assistant. Check your connection and try again.' },
      ])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Study assistant
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ask how to study a subject, what to do when stuck, or how to plan your sessions.
        </p>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface p-4" ref={listRef}>
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bot className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">How can I help you study better?</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted">
              I’m a campus assistant. Try one of these to get started.
            </p>
            <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((message, index) => (
              <li key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className="flex max-w-[85%] items-start gap-2.5">
                  {message.role === 'assistant' && (
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Bot className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <div
                    className={
                      message.role === 'user'
                        ? 'rounded-2xl rounded-br-lg bg-primary px-3.5 py-2 text-sm text-on-primary'
                        : 'rounded-2xl rounded-bl-lg bg-surface border border-border px-3.5 py-2 text-sm text-foreground'
                    }
                  >
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === 'user' && <Avatar name="You" src={null} size="sm" />}
                </div>
              </li>
            ))}
            {loading && (
              <li className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Bot className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-muted px-3.5 py-2.5 text-sm text-muted">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="flex items-end gap-3 rounded-xl border border-border bg-surface p-3"
      >
        <Textarea
          aria-label="Ask the study assistant"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about studying…"
          rows={2}
          className="border-0 bg-transparent px-2 py-1.5 focus:ring-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || loading} loading={loading}>
          <Send className="h-4 w-4" aria-hidden />
          Ask
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-surface-soft px-4 py-3 text-xs text-muted">
        Tip: the assistant helps with study strategy, not answers to graded work. Post specific doubts in Discussions
        for help from your classmates.
      </div>
    </div>
  )
}
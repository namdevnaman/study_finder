import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, PenLine, Plus, Search, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { Spinner } from '../../../components/ui/Spinner'
import {
  ensureDirectConversation,
  getMyConversations,
  getOrCreateGroupConversation,
  markConversationRead,
  searchProfiles,
  subscribeToMessages,
} from '../../../services/chat'
import { getMyGroups } from '../../../services/studyGroups'
import type { ChatSummary, StudyGroup } from '../../../lib/types'
import { supabase } from '../../../lib/supabase'
import { timeAgo } from '../../../utils/format'
import { ConversationView } from './ConversationView'

export default function ChatHub() {
  const { user } = useAuth()
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const load = useCallback(async () => {
    const data = await getMyConversations()
    setConversations(data)
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    load()
      .catch(() => undefined)
      .finally(() => active && setLoading(false))

    const channel = supabase
      .channel(`chat-inbox-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${user?.id}` }, () => {
        void load().catch(() => undefined)
      })
      .subscribe()
    unsubscribe = () => {
      void supabase.removeChannel(channel)
    }
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [user, load])

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const name = (c.kind === 'direct' ? c.peer_name : c.title) || ''
    return name.toLowerCase().includes(q) || (c.last_message || '').toLowerCase().includes(q)
  })

  const activeSummary = conversationId ? conversations.find((c) => c.conversation_id === conversationId) ?? null : null
  const openConversation = async (id: string) => {
    void markConversationRead(id).catch(() => undefined)
    navigate(`/app/chat/${id}`)
  }

  const handleNewConversation = (id: string) => {
    setNewChatOpen(false)
    void openConversation(id)
  }

  const onNewMessage = useCallback(() => {
    void load().catch(() => undefined)
  }, [load])

  // Subscribe to new messages in every conversation the user has.
  const conversationIdsKey = conversations.map((c) => c.conversation_id).join(',')
  useEffect(() => {
    const ids = conversationIdsKey ? conversationIdsKey.split(',') : []
    const channels = ids.map((id) => subscribeToMessages(id, () => onNewMessage()))
    return () => {
      channels.forEach((ch) => void supabase.removeChannel(ch))
    }
  }, [conversationIdsKey, onNewMessage])

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-0rem)]">
      {/* Conversation list */}
      <div className={`w-full flex-col overflow-hidden rounded-none border-0 border-b border-r border-border bg-surface lg:flex lg:w-[21rem] lg:shrink-0 lg:rounded-xl lg:border ${conversationId ? 'hidden' : 'flex'}`}>
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Chats</h1>
            <Button variant="secondary" size="icon" onClick={() => setNewChatOpen(true)} aria-label="New chat">
              <PenLine className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="input rounded-full pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" aria-hidden />}
              title={search ? 'No chats found' : 'No conversations yet'}
              description={search ? 'Try a different search.' : 'Start a group chat from any study group, or message a classmate directly.'}
              action={<Button size="sm" onClick={() => setNewChatOpen(true)}><Plus className="h-4 w-4" aria-hidden /> New chat</Button>}
            />
          ) : (
            <ul>
              {filtered.map((conversation) => {
                const isActive = conversation.conversation_id === conversationId
                return (
                  <li key={conversation.conversation_id}>
                    <button
                      type="button"
                      onClick={() => void openConversation(conversation.conversation_id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted ${isActive ? 'bg-primary-soft' : ''}`}
                    >
                      {conversation.kind === 'group' ? (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <Users className="h-5 w-5" aria-hidden />
                        </span>
                      ) : (
                        <Avatar
                          name={conversation.peer_name || 'Student'}
                          src={conversation.peer_avatar}
                          size="lg"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {conversation.kind === 'direct' ? conversation.peer_name : conversation.title}
                          </p>
                          {conversation.last_message_at && (
                            <span className="shrink-0 font-mono text-[10px] text-muted">{timeAgo(conversation.last_message_at)}</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-muted">
                            {conversation.last_message
                              ? `${conversation.last_sender_id === user?.id ? 'You: ' : ''}${conversation.last_message}`
                              : 'No messages yet'}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Conversation pane (desktop) / full-screen (mobile) */}
      {conversationId ? (
        <div className="relative flex-1 overflow-hidden lg:ml-2 lg:rounded-xl lg:border lg:border-border lg:bg-surface">
          <ConversationView
            conversationId={conversationId}
            summary={activeSummary}
            onBack={() => navigate('/app/chat')}
            onInfo={() => user && setInfoOpen(true)}
          />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <MessageCircle className="h-7 w-7" aria-hidden />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">Pick a chat</p>
            <p className="mt-1 text-sm text-muted">Select a conversation on the left to start messaging.</p>
          </div>
        </div>
      )}

      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} onOpen={handleNewConversation} />
      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        studyGroupId={activeSummary?.study_group_id ?? null}
        title={activeSummary?.kind === 'direct' ? activeSummary?.peer_name ?? undefined : activeSummary?.title ?? undefined}
      />
    </div>
  )
}

function NewChatModal({
  open,
  onClose,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  onOpen: (conversationId: string) => void
}) {
  const { user } = useAuth()
  const [peopleQuery, setPeopleQuery] = useState('')
  const [people, setPeople] = useState<{ id: string; full_name: string; email: string; avatar_url: string | null; branch: string | null }[]>([])
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPeopleQuery('')
    setPeople([])
    setBusy(true)
    getMyGroups(user?.id ?? '')
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setBusy(false))
  }, [open, user])

  useEffect(() => {
    if (!user || !peopleQuery.trim()) {
      setPeople([])
      return
    }
    let active = true
    searchProfiles(peopleQuery.trim(), user.id)
      .then((res) => active && setPeople(res))
      .catch(() => active && setPeople([]))
    return () => {
      active = false
    }
  }, [peopleQuery, user])

  const startDm = async (peerId: string) => {
    setBusy(true)
    try {
      const id = await ensureDirectConversation(peerId)
      onOpen(id)
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  const openGroupChat = async (studyGroupId: string) => {
    setBusy(true)
    try {
      const id = await getOrCreateGroupConversation(studyGroupId)
      onOpen(id)
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New chat" size="lg">
      <div className="space-y-5">
        <div>
          <p className="label">Find a classmate</p>
          <input
            value={peopleQuery}
            onChange={(e) => setPeopleQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search classmates"
            className="input"
          />
          {people.length > 0 && (
            <ul className="mt-2 space-y-1">
              {people.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void startDm(person.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <Avatar name={person.full_name} src={person.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{person.full_name}</p>
                      <p className="truncate text-xs text-muted">{person.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="label">Study group chats</p>
          {busy ? (
            <div className="flex items-center justify-center py-6"><Spinner /></div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted">You are not in any study groups yet.</p>
          ) : (
            <ul className="space-y-1">
              {groups.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void openGroupChat(group.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Users className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{group.title}</p>
                      <p className="text-xs text-muted">{group.subject?.name ?? 'Study group'}</p>
                    </div>
                    <MessageCircle className="h-4 w-4 text-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

function InfoModal({
  open,
  onClose,
  studyGroupId,
  title,
}: {
  open: boolean
  onClose: () => void
  studyGroupId: string | null
  title: string | undefined
}) {
  return (
    <Modal open={open} onClose={onClose} title="Chat info">
      <p className="text-sm text-muted">
        {studyGroupId ? (
          <Link to={`/app/groups/${studyGroupId}`} className="font-medium text-primary hover:underline">
            View study group
          </Link>
        ) : (
          <span>{title ?? 'Direct chat with a classmate'}</span>
        )}
      </p>
    </Modal>
  )
}
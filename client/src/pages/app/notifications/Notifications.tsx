import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  Heart,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageSpinner } from '../../../components/ui/Spinner'
import { ListItem } from '../../../components/shared/ListItem'
import {
  getNotifications,
  markAllRead,
  subscribeToNotifications,
} from '../../../services/notifications'
import { supabase } from '../../../lib/supabase'
import type { Notification } from '../../../lib/types'
import { timeAgo } from '../../../utils/format'

const KIND_ICON: Record<string, { icon: LucideIcon; cls: string }> = {
  member_joined: { icon: Users, cls: 'bg-accent-soft text-accent' },
  join_request: { icon: UserPlus, cls: 'bg-primary-soft text-primary' },
  join_approved: { icon: CheckCheck, cls: 'bg-accent-soft text-accent' },
  new_comment: { icon: MessageSquare, cls: 'bg-primary-soft text-primary' },
  post_like: { icon: ThumbsUp, cls: 'bg-accent-soft text-amber-700' },
  like: { icon: Heart, cls: 'bg-accent-soft text-amber-700' },
  session_reminder: { icon: CalendarClock, cls: 'bg-primary-soft text-primary' },
}

function notificationLink(notification: Notification): string {
  const data = notification.data as Record<string, unknown> | null
  if (data?.post_id && typeof data.post_id === 'string') return `/app/posts/${data.post_id}`
  if (data?.study_group_id && typeof data.study_group_id === 'string') return `/app/groups/${data.study_group_id}`
  return '/app/notifications'
}

function bucketLabel(dateStr: string): 'Today' | 'Yesterday' | 'Earlier' {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  if (d >= startOfToday) return 'Today'
  if (d >= startOfYesterday) return 'Yesterday'
  return 'Earlier'
}

function groupNotifications(items: Notification[]): { label: string; items: Notification[] }[] {
  const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] }
  for (const n of items) {
    buckets[bucketLabel(n.created_at)].push(n)
  }
  return (['Today', 'Yesterday', 'Earlier'] as const)
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ label: k, items: buckets[k] }))
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const data = await getNotifications(user.id)
    setNotifications(data)
  }, [user])

  useEffect(() => {
    if (!user) return
    let unsubscribe: (() => void) | undefined
    let active = true

    load()
      .catch(() => undefined)
      .finally(() => active && setLoading(false))

    const channel = subscribeToNotifications(user.id, () => {
      void load().catch(() => undefined)
    }, 'page')
    unsubscribe = () => {
      void supabase.removeChannel(channel)
    }

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [user, load])

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllRead(user.id)
    await load()
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const grouped = useMemo(() => groupNotifications(notifications), [notifications])

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => void handleMarkAllRead()}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-6 w-6" aria-hidden />}
          title="No notifications yet"
          description="When someone joins your group or comments on your post, you'll see it here."
        />
      ) : (
        <div>
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="px-4 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
                {group.label}
              </h2>
              <ul className="divide-y divide-border">
                {group.items.map((notification) => {
                  const kind = KIND_ICON[notification.type] ?? KIND_ICON.member_joined
                  const Icon = kind.icon
                  const iconEl = (
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${kind.cls}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      {!notification.read && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      )}
                    </span>
                  )

                  return (
                    <li key={notification.id} className={notification.read ? '' : 'bg-primary-soft/40'}>
                      <ListItem
                        to={notificationLink(notification)}
                        leading={iconEl}
                        title={notification.title}
                        subtitle={notification.body ?? undefined}
                        right={
                          <span className="font-mono text-[10px] text-muted">
                            {timeAgo(notification.created_at)}
                          </span>
                        }
                        ariaLabel={notification.read ? notification.title : `Unread: ${notification.title}`}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

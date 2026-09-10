import { supabase } from '../lib/supabase'
import type { Notification, NotificationPrefs } from '../lib/types'

export const DEFAULT_PREFS: NotificationPrefs = {
  join_requests: true,
  comments: true,
  likes: false,
  sessions: true,
}

export function normalizePrefs(prefs: Partial<NotificationPrefs> | undefined | null): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...(prefs ?? {}) }
}

export async function updateNotificationPrefs(userId: string, prefs: Partial<NotificationPrefs>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ notification_prefs: { ...DEFAULT_PREFS, ...prefs } })
    .eq('id', userId)
  if (error) throw error
}

export async function getNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}

export function subscribeToNotifications(userId: string, onInsert: () => void, suffix?: string) {
  const topic = `notifications-${userId}-${suffix ?? 'default'}-${crypto.randomUUID()}`
  return supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => onInsert(),
    )
    .subscribe()
}
import { supabase } from '../lib/supabase'
import type { ChatMessage, ChatSummary } from '../lib/types'

export async function getMyConversations(): Promise<ChatSummary[]> {
  const { data, error } = await supabase.rpc('get_my_conversations')
  if (error) throw error
  return (data ?? []) as ChatSummary[]
}

export async function getChatUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_chat_unread_count')
  if (error) throw error
  return (data ?? 0) as number
}

const MESSAGE_SELECT = `id, conversation_id, sender_id, body, created_at, sender_name:profiles!sender_id (full_name)`

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  sender_name?: { full_name: string } | { full_name: string }[] | null
}

function normalizeMessage(row: MessageRow): ChatMessage {
  const name = Array.isArray(row.sender_name) ? row.sender_name[0]?.full_name : row.sender_name?.full_name
  return { ...row, sender_name: name ?? null }
}

export async function getMessages(conversationId: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as MessageRow[]).reverse().map(normalizeMessage)
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, body })
    .select(MESSAGE_SELECT)
    .single()
  if (error) throw error
  return normalizeMessage(data as MessageRow)
}

export async function ensureDirectConversation(peerId: string): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_direct_conversation', { peer: peerId })
  if (error) throw error
  return data as string
}

export async function getOrCreateGroupConversation(studyGroupId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_group_conversation', { target_group: studyGroupId })
  if (error) throw error
  return data as string
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', { target: conversationId })
  if (error) throw error
}

export function subscribeToMessages(conversationId: string, onInsert: () => void, topicSuffix = '') {
  return supabase
    .channel(`chat-${conversationId}${topicSuffix}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => onInsert(),
    )
    .subscribe()
}

export async function searchProfiles(search: string, excludeUserId: string): Promise<{ id: string; full_name: string; email: string; avatar_url: string | null; branch: string | null }[]> {
  let query = supabase.from('profiles').select('id, full_name, email, avatar_url, branch').neq('id', excludeUserId).limit(20)
  if (search.trim()) query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as { id: string; full_name: string; email: string; avatar_url: string | null; branch: string | null }[]
}
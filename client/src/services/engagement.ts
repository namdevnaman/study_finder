import { supabase } from '../lib/supabase'
import type { ContentReport } from '../lib/types'

export const REPORT_REASONS = [
  'Spam or scam',
  'Harassment or abuse',
  'Wrong subject / off-topic',
  'Copyright or plagiarism',
  'Inappropriate content',
] as const

// ---- Likes ----

export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) {
    const { error: delError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (delError) throw delError
    return false
  }

  const { error: insError } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
  if (insError) throw insError
  return true
}

export async function getPostLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
  if (error) throw error
  return count ?? 0
}

export async function getPostLikedByUser(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

// ---- Bookmarks ----

export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) {
    const { error: delError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (delError) throw delError
    return false
  }

  const { error: insError } = await supabase
    .from('bookmarks')
    .insert({ post_id: postId, user_id: userId })
  if (insError) throw insError
  return true
}

export async function getBookmarkedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => row.post_id)
}

// ---- Reports ----

export async function reportContent(input: {
  targetType: ContentReport['target_type']
  targetId: string
  reporterId: string
  reason: string
  detail?: string
}): Promise<void> {
  const { error } = await supabase.from('content_reports').insert({
    target_type: input.targetType,
    target_id: input.targetId,
    reporter_id: input.reporterId,
    reason: input.reason,
    detail: input.detail || null,
  })
  if (error) throw error
}
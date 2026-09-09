import { supabase } from '../lib/supabase'
import type { Comment, Post } from '../lib/types'

export const POST_TYPES = [
  { value: 'question', label: 'Question / Doubt' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'study_partner_request', label: 'Study Partner Request' },
  { value: 'study_group', label: 'Study Group' },
  { value: 'resource', label: 'Resource' },
  { value: 'project_collaboration', label: 'Project Collaboration' },
] as const

const POST_SELECT = `
  *,
  like_counts:post_likes(count),
  author:profiles!author_id (id, full_name, email, avatar_url, branch, semester, college_name),
  subject:subjects (id, name),
  topic:topics (id, name)
`

export async function getPosts(options: { type?: string; subjectId?: string; search?: string; limit?: number } = {}): Promise<Post[]> {
  let query = supabase.from('posts').select(`${POST_SELECT}, comment_count:comments(count)`)

  if (options.type && options.type !== 'all') query = query.eq('type', options.type)
  if (options.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options.search) query = query.ilike('title', `%${options.search}%`)

  query = query.order('created_at', { ascending: false }).limit(options.limit ?? 30)
  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as Post[]).map(normalizePost)
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`${POST_SELECT}, comment_count:comments(count)`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? normalizePost(data as Post) : null
}

// Convert nested PostgREST count aggregates into plain numbers.
function normalizePost(post: Post): Post {
  const likeCounts = (post as unknown as { like_counts?: { count: number }[] }).like_counts
  post.like_count = Array.isArray(likeCounts) && likeCounts.length > 0 ? likeCounts[0].count : 0
  delete (post as unknown as { like_counts?: unknown }).like_counts
  const commentCount = (post as unknown as { comment_count?: { count: number } }).comment_count
  post.comment_count = typeof commentCount?.count === 'number' ? commentCount.count : 0
  return post
}

export interface CreatePostInput {
  type: Post['type']
  title: string
  body: string
  subject_id?: string | null
  topic_id?: string | null
}

export async function createPost(authorId: string, input: CreatePostInput): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      type: input.type,
      title: input.title,
      body: input.body,
      subject_id: input.subject_id || null,
      topic_id: input.topic_id || null,
    })
    .select(POST_SELECT)
    .single()
  if (error) throw error
  return normalizePost(data)
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export const COMMENT_SELECT = `
  *,
  author:profiles!author_id (id, full_name, email, avatar_url, branch, semester, college_name)
`

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addComment(postId: string, authorId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: authorId, body })
    .select(COMMENT_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function setCommentPinned(postId: string, commentId: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from('comments').update({ is_pinned: pinned }).eq('id', commentId).eq('post_id', postId)
  if (error) throw error
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}
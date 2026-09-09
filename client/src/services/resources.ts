import { supabase } from '../lib/supabase'
import type { Resource } from '../lib/types'

export const RESOURCE_KINDS = [
  { value: 'drive', label: 'Google Drive', dot: 'bg-accent' },
  { value: 'github', label: 'GitHub', dot: 'bg-ink-800' },
  { value: 'docs', label: 'Documentation', dot: 'bg-primary' },
  { value: 'youtube', label: 'YouTube', dot: 'bg-danger' },
  { value: 'pdf', label: 'PDF', dot: 'bg-forest-400' },
  { value: 'other', label: 'Other', dot: 'bg-ink-500' },
] as const

const RESOURCE_SELECT = `
  *,
  author:profiles!author_id (id, full_name, email, avatar_url, branch, semester, college_name),
  subject:subjects (id, name),
  topic:topics (id, name)
`

export async function getResources(options: { subjectId?: string; kind?: string; search?: string } = {}): Promise<Resource[]> {
  let query = supabase.from('resources').select(RESOURCE_SELECT)
  if (options.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options.kind && options.kind !== 'all') query = query.eq('kind', options.kind)
  if (options.search) query = query.ilike('title', `%${options.search}%`)
  query = query.order('created_at', { ascending: false }).limit(50)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export interface CreateResourceInput {
  title: string
  url: string
  description?: string
  kind: string
  subject_id?: string | null
  topic_id?: string | null
}

export async function createResource(authorId: string, input: CreateResourceInput): Promise<Resource> {
  const { data, error } = await supabase
    .from('resources')
    .insert({
      author_id: authorId,
      title: input.title,
      url: input.url,
      description: input.description || null,
      kind: input.kind,
      subject_id: input.subject_id || null,
      topic_id: input.topic_id || null,
    })
    .select(RESOURCE_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw error
}
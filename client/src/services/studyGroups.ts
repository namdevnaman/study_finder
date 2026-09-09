import { supabase } from '../lib/supabase'
import type { StudyGroup, StudyGroupMember } from '../lib/types'

const GROUP_SELECT = `
  *,
  creator:profiles!creator_id (id, full_name, email, avatar_url, branch, semester, college_name),
  subject:subjects (id, name),
  topic:topics (id, name)
`

// light member join (status only) so lists can compute counts without profile payloads
const GROUP_LIST_SELECT = `${GROUP_SELECT}, members:study_group_members (id, user_id, status)`

// full member join (with profile) for the detail page
const GROUP_DETAIL_SELECT = `${GROUP_SELECT}, members:study_group_members (id, user_id, status, joined_at, attended, profile:profiles (id, full_name, avatar_url, branch, semester, college_name))`

export interface GroupFilters {
  departmentId?: string
  subjectId?: string
  privacy?: string
  search?: string
  upcomingOnly?: boolean
  limit?: number
}

export async function getStudyGroups(filters: GroupFilters = {}): Promise<StudyGroup[]> {
  let query = supabase.from('study_groups').select(GROUP_LIST_SELECT)

  if (filters.subjectId) query = query.eq('subject_id', filters.subjectId)
  if (filters.departmentId) query = query.eq('subjects.department_id', filters.departmentId)
  if (filters.privacy && filters.privacy !== 'all') query = query.eq('privacy', filters.privacy)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)

  query = query.order('created_at', { ascending: false }).limit(filters.limit ?? 50)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudyGroup(id: string): Promise<StudyGroup | null> {
  const { data, error } = await supabase
    .from('study_groups')
    .select(GROUP_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export interface CreateGroupInput {
  title: string
  description?: string
  subject_id?: string | null
  topic_id?: string | null
  session_date?: string | null
  start_time?: string | null
  end_time?: string | null
  max_participants?: number | null
  meet_link?: string | null
  privacy: 'public' | 'private' | 'approval_required'
}

export async function createStudyGroup(creatorId: string, input: CreateGroupInput): Promise<StudyGroup> {
  const { data, error } = await supabase.rpc('create_study_group', {
    p_title: input.title,
    p_description: input.description || null,
    p_subject_id: input.subject_id || null,
    p_topic_id: input.topic_id || null,
    p_session_date: input.session_date || null,
    p_start_time: input.start_time || null,
    p_end_time: input.end_time || null,
    p_max_participants: input.max_participants ?? null,
    p_meet_link: input.meet_link || null,
    p_privacy: input.privacy,
  })
  if (error) throw error
  return { ...data, creator_id: creatorId } as unknown as StudyGroup
}

export async function deleteStudyGroup(id: string): Promise<void> {
  const { error } = await supabase.from('study_groups').delete().eq('id', id)
  if (error) throw error
}

export async function getMyMembership(
  groupId: string,
  userId: string,
): Promise<StudyGroupMember | null> {
  const { data, error } = await supabase
    .from('study_group_members')
    .select('*')
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function joinStudyGroup(groupId: string): Promise<'member' | 'requested'> {
  const { data, error } = await supabase.rpc('join_study_group', { target_group: groupId })
  if (error) throw error
  return data === 'requested' ? 'requested' : 'member'
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_group_members')
    .delete()
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function approveMembership(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_group_members')
    .update({ status: 'member' })
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function rejectMembership(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_group_members')
    .delete()
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function markAttendance(groupId: string, userId: string, attended: boolean): Promise<void> {
  const { error } = await supabase
    .from('study_group_members')
    .update({ attended })
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getMyReminders(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_reminders')
    .select('study_group_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => row.study_group_id)
}

export async function getSessionReminder(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('session_reminders')
    .select('id')
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function setSessionReminder(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('session_reminders').upsert(
    { study_group_id: groupId, user_id: userId },
    { onConflict: 'study_group_id,user_id' },
  )
  if (error) throw error
}

export async function clearSessionReminder(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('session_reminders')
    .delete()
    .eq('study_group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getMyGroups(userId: string): Promise<StudyGroup[]> {
  const { data, error } = await supabase
    .from('study_group_members')
    .select(`study_group:study_groups (${GROUP_LIST_SELECT})`)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as unknown as { study_group: StudyGroup | StudyGroup[] }[]
  return rows
    .map((row) => (Array.isArray(row.study_group) ? row.study_group[0] : row.study_group))
    .filter((group): group is StudyGroup => Boolean(group))
}
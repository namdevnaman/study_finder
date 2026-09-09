import type { PostgrestError } from '@supabase/supabase-js'

export interface Department {
  id: string
  name: string
  short_name: string | null
}

export interface Subject {
  id: string
  department_id: string | null
  name: string
  code: string | null
}

export interface Topic {
  id: string
  subject_id: string | null
  name: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  branch: string | null
  year: number | null
  semester: number | null
  bio: string | null
  college_name: string | null
  avatar_url: string | null
  subjects_of_interest: string[] | null
  notification_prefs: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface StudyGroupMember {
  id: string
  study_group_id: string
  user_id: string
  status: 'member' | 'requested'
  joined_at: string
  attended?: boolean
  profile?: Profile | null
}

export interface StudyGroup {
  id: string
  creator_id: string
  subject_id: string | null
  topic_id: string | null
  title: string
  description: string | null
  session_date: string | null
  start_time: string | null
  end_time: string | null
  max_participants: number | null
  meet_link: string | null
  privacy: 'public' | 'private' | 'approval_required'
  created_at: string
  updated_at: string
  creator?: Profile | null
  subject?: Pick<Subject, 'id' | 'name'> | null
  topic?: Pick<Topic, 'id' | 'name'> | null
  members?: StudyGroupMember[] | null
}

export interface Post {
  id: string
  author_id: string
  type:
    | 'question'
    | 'discussion'
    | 'study_partner_request'
    | 'study_group'
    | 'resource'
    | 'project_collaboration'
  subject_id: string | null
  topic_id: string | null
  title: string
  body: string
  created_at: string
  updated_at: string
  author?: Profile | null
  subject?: Pick<Subject, 'id' | 'name'> | null
  topic?: Pick<Topic, 'id' | 'name'> | null
  comment_count?: number
  like_count?: number
  bookmarked?: boolean
  likes?: { user_id: string }[]
}

export type NotificationPrefs = {
  join_requests: boolean
  comments: boolean
  likes: boolean
  sessions: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  body: string
  is_pinned: boolean
  created_at: string
  author?: Profile | null
}

export interface Resource {
  id: string
  author_id: string
  subject_id: string | null
  topic_id: string | null
  title: string
  url: string
  description: string | null
  kind: string | null
  created_at: string
  author?: Profile | null
  subject?: Pick<Subject, 'id' | 'name'> | null
  topic?: Pick<Topic, 'id' | 'name'> | null
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

export interface ContentReport {
  id: string
  target_type: 'post' | 'comment' | 'group' | 'resource'
  target_id: string
  reporter_id: string
  reason: string | null
  detail: string | null
  status: string
  created_at: string
}

export type DbError = PostgrestError | null

export interface ChatSummary {
  conversation_id: string
  kind: 'direct' | 'group'
  title: string | null
  peer_id: string | null
  peer_name: string | null
  peer_avatar: string | null
  peer_branch: string | null
  study_group_id: string | null
  last_message: string | null
  last_message_at: string | null
  last_sender_id: string | null
  unread_count: number
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  sender_name?: string | null
}
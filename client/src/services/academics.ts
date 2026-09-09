import { supabase } from '../lib/supabase'
import type { Department, Subject, Topic } from '../lib/types'

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function getSubjects(departmentId?: string): Promise<Subject[]> {
  let query = supabase.from('subjects').select('*')
  if (departmentId) query = query.eq('department_id', departmentId)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data ?? []
}

export async function getTopics(subjectId: string): Promise<Topic[]> {
  const { data, error } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('name')
  if (error) throw error
  return data ?? []
}

export async function getSubjectName(id: string | null): Promise<string | null> {
  if (!id) return null
  const { data, error } = await supabase.from('subjects').select('name').eq('id', id).maybeSingle()
  if (error) return null
  return data?.name ?? null
}
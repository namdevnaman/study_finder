import { useEffect, useState } from 'react'
import { getDepartments, getSubjects, getTopics } from '../services/academics'
import type { Department, Subject, Topic } from '../lib/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load departments'))
      .finally(() => setLoading(false))
  }, [])

  return { departments, loading, error }
}

export function useSubjects(departmentId?: string) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!departmentId) {
      setSubjects([])
      return
    }
    setLoading(true)
    getSubjects(departmentId)
      .then(setSubjects)
      .finally(() => setLoading(false))
  }, [departmentId])

  return { subjects, loading }
}

export function useTopics(subjectId?: string) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!subjectId) {
      setTopics([])
      return
    }
    setLoading(true)
    getTopics(subjectId)
      .then(setTopics)
      .finally(() => setLoading(false))
  }, [subjectId])

  return { topics, loading }
}
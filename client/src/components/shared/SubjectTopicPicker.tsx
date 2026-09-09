import { useEffect } from 'react'
import { useDepartments, useSubjects, useTopics } from '../../hooks/useAcademics'
import { Field, Select } from '../ui/Field'
import { Spinner } from '../ui/Spinner'

export function SubjectTopicPicker({
  departmentId,
  subjectId,
  topicId,
  onDepartmentChange,
  onSubjectChange,
  onTopicChange,
  subjectOptional = false,
}: {
  departmentId: string
  subjectId: string
  topicId: string
  onDepartmentChange: (v: string) => void
  onSubjectChange: (v: string) => void
  onTopicChange: (v: string) => void
  subjectOptional?: boolean
}) {
  const { departments, loading: depsLoading } = useDepartments()
  const { subjects, loading: subsLoading } = useSubjects(departmentId || undefined)
  const { topics, loading: topicsLoading } = useTopics(subjectId || undefined)

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      onSubjectChange('')
      onTopicChange('')
    }
  }, [subjectId, subjects, onSubjectChange, onTopicChange])

  useEffect(() => {
    if (topicId && !topics.some((t) => t.id === topicId)) {
      onTopicChange('')
    }
  }, [topicId, topics, onTopicChange])

  return (
    <div className="space-y-4">
      <Field id="department" label="Department">
        {depsLoading ? (
          <div className="flex h-9 items-center"><Spinner /></div>
        ) : (
          <Select
            id="department"
            value={departmentId}
            onChange={(e) => {
              onDepartmentChange(e.target.value)
              onSubjectChange('')
              onTopicChange('')
            }}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field id="subject" label="Subject">
        <Select
          id="subject"
          value={subjectId}
          disabled={!departmentId}
          onChange={(e) => {
            onSubjectChange(e.target.value)
            onTopicChange('')
          }}
        >
          <option value="">{subjectOptional ? 'No subject' : 'Select a subject'}</option>
          {subsLoading ? <option>Loading…</option> : subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>

      <Field id="topic" label="Topic" hint="Optional — narrows down what you're covering">
        <Select
          id="topic"
          value={topicId}
          disabled={!subjectId}
          onChange={(e) => onTopicChange(e.target.value)}
        >
          <option value="">No specific topic</option>
          {topicsLoading ? <option>Loading…</option> : topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
    </div>
  )
}
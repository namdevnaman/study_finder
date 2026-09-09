import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Textarea } from '../../../components/ui/Field'
import { SubjectTopicPicker } from '../../../components/shared/SubjectTopicPicker'
import { createStudyGroup } from '../../../services/studyGroups'

type Privacy = 'public' | 'private' | 'approval_required'

const PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Anyone on campus can join.' },
  { value: 'approval_required', label: 'Approval required', description: 'Students request to join; you approve.' },
  { value: 'private', label: 'Private', description: 'Only visible to members (invite via Meet link).' },
]

export default function CreateStudyGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [privacy, setPrivacy] = useState<Privacy>('public')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Give your group a title.')
      return
    }
    if (maxParticipants && (Number(maxParticipants) < 1 || Number(maxParticipants) > 100)) {
      setError('Max participants must be between 1 and 100.')
      return
    }
    if (sessionDate && startTime && endTime && endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setLoading(true)
    try {
      const group = await createStudyGroup(user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        subject_id: subjectId || null,
        topic_id: topicId || null,
        session_date: sessionDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        max_participants: maxParticipants ? Number(maxParticipants) : null,
        meet_link: meetLink.trim() || null,
        privacy,
      })
      navigate(`/app/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the group.')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/app/groups" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to groups
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">Create a study group</h1>
        <p className="mt-1 text-sm text-muted">
          Schedule a focused session on a subject and invite classmates.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Basics</h2>
          <Field id="title" label="Title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DBMS - Normalization session before MST-2"
              maxLength={90}
              required
            />
          </Field>

          <Field id="description" label="Description" hint="What will you cover? Who is it for?">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="We'll revise normalization (1NF–3NF, BCNF) with practice problems. All CSE sem 5 students welcome."
              rows={3}
            />
          </Field>

          <SubjectTopicPicker
            departmentId={departmentId}
            subjectId={subjectId}
            topicId={topicId}
            onDepartmentChange={setDepartmentId}
            onSubjectChange={setSubjectId}
            onTopicChange={setTopicId}
          />
        </div>

        <div className="space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="date" label="Session date">
              <Input id="date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </Field>
            <Field id="max" label="Max participants" hint="Leave empty for no limit">
              <Input
                id="max"
                type="number"
                min={1}
                max={100}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="5"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="start" label="Start time">
              <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field id="end" label="End time">
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Details</h2>
          <Field id="meet" label="Google Meet link" hint="Optional: share your meeting link here">
            <Input
              id="meet"
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </Field>

          <Field id="privacy" label="Privacy">
            <div className="space-y-2.5">
              {PRIVACY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    privacy === option.value ? 'border-primary bg-primary-soft' : 'border-border hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    checked={privacy === option.value}
                    onChange={() => setPrivacy(option.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{option.label}</span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">!</span>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Link to="/app/groups">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create group
          </Button>
        </div>
      </form>
    </div>
  )
}
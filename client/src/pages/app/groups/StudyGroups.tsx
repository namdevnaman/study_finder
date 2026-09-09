import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Clock, Lock, LockOpen, LockKeyhole, Plus, Search, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input, Select } from '../../../components/ui/Field'
import { PageSpinner } from '../../../components/ui/Spinner'
import { ListItem } from '../../../components/shared/ListItem'
import { getStudyGroups } from '../../../services/studyGroups'
import { useDepartments, useSubjects } from '../../../hooks/useAcademics'
import type { StudyGroup } from '../../../lib/types'
import { formatDate, formatTime } from '../../../utils/format'

const PRIVACY_ICON = {
  public: LockOpen,
  private: Lock,
  approval_required: LockKeyhole,
} as const

const PRIVACY_LABEL: Record<string, string> = {
  public: 'Public',
  private: 'Private',
  approval_required: 'Approval required',
}

export default function StudyGroups() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { departments } = useDepartments()
  const [departmentId, setDepartmentId] = useState('')
  const { subjects } = useSubjects(departmentId || undefined)
  const [subjectId, setSubjectId] = useState('')
  const [privacy, setPrivacy] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams.get('subject')) setSubjectId(searchParams.get('subject')!)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    getStudyGroups({ departmentId, subjectId, privacy, search })
      .then((data) => {
        const sorted = [...data]
        if (sort === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
        if (sort === 'upcoming') {
          sorted.sort((a, b) => {
            const da = a.session_date ?? '9999-12-31'
            const db = b.session_date ?? '9999-12-31'
            return da.localeCompare(db)
          })
        }
        setGroups(sorted)
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [departmentId, subjectId, privacy, search, sort])

  const joinedByMe = groups.filter(
    (g) => user && g.members?.some((m) => m.user_id === user.id && m.status === 'member'),
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Study Groups</h1>
        <Link to="/app/groups/new">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            Create
          </Button>
        </Link>
      </div>

      {/* Filter strip */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 shrink-0 sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            aria-label="Search groups"
            placeholder="Search groups..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Department"
          className="h-8 text-sm"
          value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setSubjectId('') }}
        >
          <option value="">All depts</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
        </Select>
        <Select
          aria-label="Subject"
          className="h-8 text-sm"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={!departmentId}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select
          aria-label="Privacy"
          className="h-8 text-sm"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
        >
          <option value="all">Any privacy</option>
          <option value="public">Public</option>
          <option value="approval_required">Approval required</option>
          <option value="private">Private</option>
        </Select>
        <Select
          aria-label="Sort groups"
          className="h-8 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="upcoming">Upcoming</option>
        </Select>
      </div>

      {joinedByMe > 0 && (
        <p className="text-xs text-muted">
          You&apos;re in <span className="font-medium text-foreground">{joinedByMe}</span> group{joinedByMe === 1 ? '' : 's'}
        </p>
      )}

      {loading ? (
        <PageSpinner />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" aria-hidden />}
          title="No study groups found"
          description="Try adjusting your filters, or start a group for your subject."
          action={
            <Link to="/app/groups/new">
              <Button size="sm">Create a group</Button>
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {groups.map((group) => {
            const PrivacyIcon = PRIVACY_ICON[group.privacy]
            const memberCount = group.members?.filter((m) => m.status === 'member').length ?? 0
            const requestedCount = group.members?.filter((m) => m.status === 'requested').length ?? 0
            const isPast = group.session_date != null && group.session_date < new Date().toISOString().slice(0, 10)

            const leading = (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
              </span>
            )

            const subtitle = (
              <>
                {group.subject?.name ?? 'General study'}
                {group.topic ? <span className="text-muted"> · {group.topic.name}</span> : null}
              </>
            )

            const meta = group.session_date ? (
              <span className={`flex items-center gap-1 font-mono text-[11px] ${isPast ? 'text-muted/60' : 'text-muted/80'}`}>
                <Clock className="h-3 w-3 shrink-0" aria-hidden />
                {formatDate(group.session_date)} · {formatTime(group.start_time)}–{formatTime(group.end_time)} · {memberCount}/{group.max_participants ?? '∞'} · {PRIVACY_LABEL[group.privacy]}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-muted/80">
                Created {formatDate(group.created_at)} · {memberCount}/{group.max_participants ?? '∞'} · {PRIVACY_LABEL[group.privacy]}
              </span>
            )

            const right = (
              <>
                <span title={PRIVACY_LABEL[group.privacy]}>
                  <PrivacyIcon className="h-3.5 w-3.5 text-muted" aria-hidden />
                </span>
                {requestedCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-on-primary">
                    {requestedCount > 9 ? '9+' : requestedCount}
                  </span>
                )}
                <span className="font-mono text-xs text-muted">{memberCount}</span>
              </>
            )

            return (
              <ListItem
                key={group.id}
                to={`/app/groups/${group.id}`}
                leading={leading}
                title={group.title}
                subtitle={subtitle}
                meta={meta}
                right={right}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}

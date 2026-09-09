import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bell, BellRing, CalendarDays, CheckCheck, ChevronLeft, Clock, Link2, Trash2, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { PageSpinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import {
  approveMembership,
  clearSessionReminder,
  deleteStudyGroup,
  getMyMembership,
  getSessionReminder,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  markAttendance,
  rejectMembership,
  setSessionReminder,
} from '../../../services/studyGroups'
import type { StudyGroup as StudyGroupType } from '../../../lib/types'
import { formatDate, formatTime, hostOf, isValidUrl } from '../../../utils/format'

export default function StudyGroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [group, setGroup] = useState<StudyGroupType | null>(null)
  const [membership, setMembership] = useState<{ status: 'member' | 'requested' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reminderOn, setReminderOn] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)

  const load = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const [groupData, myMembership, reminder] = await Promise.all([
        getStudyGroup(id),
        getMyMembership(id, user.id),
        getSessionReminder(id, user.id),
      ])
      setGroup(groupData)
      setMembership(myMembership ? { status: myMembership.status } : null)
      setReminderOn(reminder)
    } catch {
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <PageSpinner />
  if (!group || !user) {
    return (
      <EmptyState
        title="Group not found"
        description="This group may have been deleted, or you don't have access to it."
        action={<Link to="/app/groups"><Button>Browse groups</Button></Link>}
      />
    )
  }

  const isCreator = group.creator_id === user.id
  const members = group.members?.filter((m) => m.status === 'member') ?? []
  const requests = group.members?.filter((m) => m.status === 'requested') ?? []
  const isMember = members.some((m) => m.user_id === user.id)
  const capacityFull = group.max_participants ? members.length >= group.max_participants : false

  const handleJoin = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      const status = await joinStudyGroup(group.id)
      setMembership({ status })
      setGroup((current) => {
        if (!current) return current
        const member = { id: crypto.randomUUID(), study_group_id: group.id, user_id: user.id, status, joined_at: new Date().toISOString() }
        return {
          ...current,
          members: current.members ? [...current.members, member] : [member],
        }
      })
      success(status === 'requested' ? 'Request sent' : 'Joined the group', status === 'requested' ? 'The owner will approve your request.' : 'Welcome in, see you at the session!')
    } catch (err) {
      toastError('Could not join', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return
    setActionLoading(true)
    await leaveStudyGroup(group.id, user.id)
    setMembership(null)
    setGroup((current) => current ? { ...current, members: current.members?.filter((m) => m.user_id !== user.id) ?? [] } : current)
    toastError('Left the group', 'You can join again later if you change your mind.')
    setActionLoading(false)
  }

  const handleApprove = async (userId: string, name: string) => {
    await approveMembership(group.id, userId)
    setGroup((current) => current ? { ...current, members: current.members?.map((m) => m.user_id === userId ? { ...m, status: 'member' } : m) ?? [] } : current)
    success('Request approved', `${name} can now join the session.`)
  }

  const handleReject = async (userId: string) => {
    await rejectMembership(group.id, userId)
    setGroup((current) => current ? { ...current, members: current.members?.filter((m) => m.user_id !== userId) ?? [] } : current)
  }

  const handleDelete = async () => {
    setActionLoading(true)
    await deleteStudyGroup(group.id)
    setConfirmDelete(false)
    success('Group deleted')
    navigate('/app/groups')
  }

  const handleReminder = async () => {
    if (!user) return
    setReminderLoading(true)
    try {
      if (reminderOn) {
        await clearSessionReminder(group.id, user.id)
        setReminderOn(false)
      } else {
        await setSessionReminder(group.id, user.id)
        setReminderOn(true)
        success('Reminder set', 'We’ll nudge you before the session starts.')
      }
    } catch (err) {
      toastError('Could not update reminder', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setReminderLoading(false)
    }
  }

  const handleAttendance = async (memberUserId: string, attended: boolean) => {
    await markAttendance(group.id, memberUserId, attended)
    setGroup((current) =>
      current
        ? {
            ...current,
            members: current.members?.map((m) =>
              m.user_id === memberUserId ? { ...m, attended } : m,
            ) ?? [],
          }
        : current,
    )
  }

  const joinButton = () => {
    if (membership) return null
    if (isCreator || isMember) return null
    if (group.privacy === 'private') return null
    return (
      <Button onClick={() => void handleJoin()} loading={actionLoading} disabled={capacityFull}>
        {group.privacy === 'approval_required' ? 'Request to join' : 'Join group'}
      </Button>
    )
  }

  const leaveButton = () =>
    membership?.status === 'member' && !isCreator ? (
      <Button variant="dangerGhost" onClick={() => void handleLeave()} loading={actionLoading}>
        Leave group
      </Button>
    ) : null

  return (
    <div className="space-y-6">
      <Link to="/app/groups" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to groups
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={group.privacy === 'public' ? 'accent' : 'primary'}>
              {group.privacy.replace(/_/g, ' ')}
            </Badge>
            {group.subject && <Badge variant="outline">{group.subject.name}</Badge>}
            {group.topic && <Badge variant="neutral">{group.topic.name}</Badge>}
          </div>
          <h1 className="mt-2.5 text-xl font-semibold text-foreground">{group.title}</h1>
          {group.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">{group.description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {joinButton()}
          {leaveButton()}
          {(isMember || isCreator) && group.session_date && (
            <Button variant="secondary" onClick={() => void handleReminder()} loading={reminderLoading}>
              {reminderOn ? <BellRing className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
              {reminderOn ? 'Reminder set' : 'Remind me'}
            </Button>
          )}
          {isCreator && (
            <Button variant="dangerGhost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Session details */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-muted">Session details</h2>
            <dl className="divide-y divide-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <CalendarDays className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Date</dt>
                  <dd className="text-sm font-medium text-foreground">{formatDate(group.session_date)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Clock className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Time</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatTime(group.start_time)} – {formatTime(group.end_time)}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Users className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Capacity</dt>
                  <dd className="text-sm font-medium text-foreground">
                    <span className="font-mono text-sm">{members.length}{group.max_participants ? ` / ${group.max_participants}` : ''}</span> members
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Link2 className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Meeting link</dt>
                  <dd>
                    {group.meet_link && isValidUrl(group.meet_link) ? (
                      <a
                        href={group.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-medium text-primary hover:text-primary-hover"
                      >
                        {hostOf(group.meet_link)}
                      </a>
                    ) : (
                      <span className="truncate block text-sm font-medium text-foreground">
                        {isMember || isCreator ? group.meet_link ?? 'Not set' : 'Join to view'}
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Join requests */}
          {isCreator && requests.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-muted">
                Join requests ({requests.length})
              </h2>
              <ul className="divide-y divide-border">
                {requests.map((req) => (
                  <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={req.profile?.full_name || 'Student'} src={req.profile?.avatar_url} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{req.profile?.full_name}</p>
                        <p className="truncate text-xs text-muted">{req.profile?.college_name ?? req.profile?.branch ?? 'Student'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void handleApprove(req.user_id, req.profile?.full_name || 'Student')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="dangerGhost" onClick={() => void handleReject(req.user_id)}>
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="h-fit min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium uppercase tracking-wide text-muted">Participants</h2>
          {members.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No members yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={member.profile?.full_name || 'Student'} src={member.profile?.avatar_url} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {member.profile?.full_name}
                        {member.user_id === group.creator_id && (
                          <span className="ml-1.5 text-xs font-normal text-primary">(owner)</span>
                        )}
                      </span>
                      {member.profile?.college_name ? (
                        <span className="block truncate text-xs text-muted">{member.profile.college_name}</span>
                      ) : member.profile?.semester ? (
                        <span className="block text-xs text-muted">Semester {member.profile.semester}</span>
                      ) : null}
                      {member.attended && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-accent">
                          <CheckCheck className="h-3 w-3" aria-hidden />
                          Attended
                        </span>
                      )}
                    </span>
                  </div>
                  {isCreator && member.user_id !== user.id && (
                    <button
                      onClick={() => void handleAttendance(member.user_id, !member.attended)}
                      aria-pressed={member.attended ?? false}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        member.attended
                          ? 'bg-accent-soft text-accent'
                          : 'bg-surface text-muted hover:bg-surface-muted hover:text-foreground'
                      }`}
                    >
                      {member.attended ? 'Attended' : 'Mark attended'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
            <Avatar name={group.creator?.full_name || 'Owner'} src={group.creator?.avatar_url} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-muted">Created by</p>
              <p className="truncate text-sm font-medium text-foreground">{group.creator?.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this study group?"
        description="This will permanently remove the group and its memberships. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDelete()} loading={actionLoading}>Delete group</Button>
          </>
        }
      >
        <p className="text-sm text-muted">“{group.title}” will be removed.</p>
      </Modal>
    </div>
  )
}
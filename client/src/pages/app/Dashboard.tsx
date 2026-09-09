import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, MessageSquare, Plus, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'
import { ListItem } from '../../components/shared/ListItem'
import { getPosts } from '../../services/posts'
import { getMyGroups, getMyReminders, getStudyGroups } from '../../services/studyGroups'
import type { Post, StudyGroup } from '../../lib/types'
import { formatDate, formatTime, timeAgo } from '../../utils/format'

export default function Dashboard() {
  const { user, profile, profileError } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([])
  const [recommended, setRecommended] = useState<StudyGroup[]>([])
  const [reminderIds, setReminderIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([
      getPosts({ limit: 6 }),
      getMyGroups(user.id),
      getStudyGroups({ limit: 12 }),
      getMyReminders(user.id),
    ])
      .then(([recentPosts, groups, allGroups, reminderIds]) => {
        if (!active) return
        setPosts(recentPosts)
        setMyGroups(groups)
        setReminderIds(reminderIds)
        const joinedIds = new Set<string>()
        groups.forEach((g) => g.members?.forEach((m) => m.user_id === user.id && joinedIds.add(g.id)))
        const interests = (profile?.subjects_of_interest ?? []).map((s) => s.toLowerCase())
        const matched = allGroups.filter((g) => {
          if (joinedIds.has(g.id)) return false
          const subject = g.subject?.name.toLowerCase() ?? ''
          const title = g.title.toLowerCase()
          return interests.some((i) => subject.includes(i) || title.includes(i))
        })
        setRecommended((matched.length > 0 ? matched : allGroups).slice(0, 3))
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user, profile])

  if (loading) return <PageSpinner />

  const upcomingGroups = myGroups
    .filter((g) => g.session_date && new Date(`${g.session_date}`) >= new Date(Date.now() - 86400000))
    .sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)))
    .slice(0, 3)

  const incompleteProfile = !profile?.branch || !profile?.year || !profile?.semester

  const quickActions = [
    { to: '/app/groups/new', label: 'Start study group', icon: Users },
    { to: '/app/discussions?new=1', label: 'Ask a doubt', icon: MessageSquare },
    { to: '/app/resources?new=1', label: 'Share resource', icon: Plus },
  ]

  return (
    <div className="space-y-7">
      {/* Header + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {[profile?.college_name, profile?.branch, profile?.semester ? `Semester ${profile.semester}` : '']
              .filter(Boolean)
              .join(' · ') || 'Complete your profile so classmates can find you.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button variant="secondary" size="sm">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {profileError && (
        <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
          {profileError}
        </p>
      )}

      {incompleteProfile && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary bg-primary-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Your profile is incomplete</p>
            <p className="mt-0.5 text-sm text-muted">Add your branch, year, and semester so study partners can find you.</p>
          </div>
          <Link to="/app/profile">
            <Button size="sm" variant="secondary">Complete profile</Button>
          </Link>
        </div>
      )}

      {/* Recommended for you */}
      {recommended.length > 0 && (
        <section>
          <SectionHeading title="Recommended for you" subtitle="Find a group that matches your subjects" />
          <ListRows>
            {recommended.map((group) => (
              <ListItem
                key={group.id}
                to={`/app/groups/${group.id}`}
                leading={
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                }
                title={group.title}
                subtitle={`${group.subject?.name ?? 'General study'}${group.topic ? ` · ${group.topic.name}` : ''}`}
                meta={`${group.session_date ? formatDate(group.session_date) : 'No date yet'} · ${group.members?.filter((m) => m.status === 'member').length ?? 0}/${group.max_participants ?? '∞'} members`}
              />
            ))}
          </ListRows>
        </section>
      )}

      <div className="grid min-w-0 gap-7 lg:grid-cols-5">
        {/* Upcoming sessions */}
        <section className="min-w-0 lg:col-span-2">
          <SectionHeading title="Upcoming sessions" subtitle="Your next study sessions" />

          {upcomingGroups.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-5 w-5" aria-hidden />}
              title="No sessions yet"
              description="Join a study group or create one to schedule your next session."
              action={
                <Link to="/app/groups">
                  <Button size="sm" variant="secondary">Browse groups</Button>
                </Link>
              }
            />
          ) : (
            <ListRows>
              {upcomingGroups.map((group) => (
                <ListItem
                  key={group.id}
                  to={`/app/groups/${group.id}`}
                  leading={
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-primary-soft font-display leading-none text-primary">
                      <span className="text-sm font-bold">
                        {group.session_date ? new Date(`${group.session_date}T00:00:00`).getDate() : '—'}
                      </span>
                      <span className="text-[9px] uppercase">
                        {group.session_date ? new Date(`${group.session_date}T00:00:00`).toLocaleString(undefined, { month: 'short' }) : ''}
                      </span>
                    </span>
                  }
                  title={group.title}
                  subtitle={`${formatDate(group.session_date)} · ${formatTime(group.start_time)}–${formatTime(group.end_time)}`}
                  right={
                    reminderIds.includes(group.id) ? (
                      <span className="font-mono text-[10px] text-primary">Reminder</span>
                    ) : undefined
                  }
                />
              ))}
            </ListRows>
          )}
        </section>

        {/* Recent discussions */}
        <section className="min-w-0 lg:col-span-3">
          <SectionHeading title="Recent discussions" subtitle="Latest doubts and conversations" />

          {posts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-5 w-5" aria-hidden />}
              title="No discussions yet"
              description="Be the first to ask a doubt or start a discussion."
              action={
                <Link to="/app/discussions?new=1">
                  <Button size="sm" variant="secondary">Start a discussion</Button>
                </Link>
              }
            />
          ) : (
            <ListRows>
              {posts.slice(0, 5).map((post) => (
                <ListItem
                  key={post.id}
                  to={`/app/posts/${post.id}`}
                  leading={<Avatar name={post.author?.full_name || 'Student'} src={post.author?.avatar_url} size="sm" />}
                  title={
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{post.title}</span>
                      <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        {post.type.replace(/_/g, ' ')}
                      </span>
                    </span>
                  }
                  subtitle={post.author?.full_name ?? 'Student'}
                  meta={`${post.subject?.name ?? 'General'}${post.comment_count ? ` · ${post.comment_count} reply${post.comment_count === 1 ? '' : 's'}` : ''}`}
                  right={
                    <span className="font-mono text-[10px] text-muted">
                      {timeAgo(post.created_at)}
                    </span>
                  }
                />
              ))}
            </ListRows>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      {subtitle && <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{subtitle}</span>}
    </div>
  )
}

function ListRows({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">{children}</ul>
}
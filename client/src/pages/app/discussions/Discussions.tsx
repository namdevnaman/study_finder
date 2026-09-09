import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bookmark, Heart, MessageSquare, PenLine, Search } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field'
import { PageSpinner } from '../../../components/ui/Spinner'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ListItem, UnreadBadge } from '../../../components/shared/ListItem'
import { FilterChips } from '../../../components/shared/FilterChips'
import { POST_TYPES, createPost, getPosts, type CreatePostInput } from '../../../services/posts'
import { getBookmarkedPostIds } from '../../../services/engagement'
import { useDepartments, useSubjects, useTopics } from '../../../hooks/useAcademics'
import type { Post } from '../../../lib/types'
import { timeAgo } from '../../../utils/format'

export default function Discussions() {
  const { user } = useAuth()
  const { success } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('newest')
  const [savedOnly, setSavedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [composerOpen, setComposerOpen] = useState(searchParams.get('new') === '1')

  const reload = () => {
    setLoading(true)
    Promise.all([
      getPosts({ type, search }),
      savedOnly && user ? getBookmarkedPostIds(user.id) : Promise.resolve<string[]>([]),
    ])
      .then(([data, savedIds]) => {
        let filtered = savedOnly ? data.filter((post) => savedIds.includes(post.id)) : data
        const sorted = [...filtered]
        if (sort === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
        if (sort === 'popular') sorted.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0) || (b.comment_count ?? 0) - (a.comment_count ?? 0))
        setPosts(sorted)
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, search, sort, savedOnly])

  const postTypeLabel = (value: string) =>
    POST_TYPES.find((t) => t.value === value)?.label ?? value.replace(/_/g, ' ')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Discussions</h1>
        <Button onClick={() => setComposerOpen(true)} aria-label="New discussion">
          <PenLine className="h-4 w-4" aria-hidden />
          New discussion
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search posts" placeholder="Search posts…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setSavedOnly((v) => !v)}
          aria-pressed={savedOnly}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
            savedOnly
              ? 'border-primary bg-primary text-on-primary'
              : 'border-border bg-surface text-muted hover:border-border-strong hover:text-foreground'
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${savedOnly ? 'fill-current' : ''}`} aria-hidden />
          Saved
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-sm text-muted">Sort</span>
          <Select aria-label="Sort posts" value={sort} onChange={(e) => setSort(e.target.value)} className="w-40">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="popular">Most popular</option>
          </Select>
        </div>
      </div>

      <FilterChips
        label="Filter by post type"
        value={type}
        onChange={setType}
        options={[
          { value: 'all', label: 'All' },
          ...POST_TYPES.map((t) => ({ value: t.value, label: t.label })),
        ]}
      />

      {loading ? (
        <PageSpinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" aria-hidden />}
          title="No posts found"
          description="Start the conversation, ask a question or share what you're working on."
          action={<Button onClick={() => setComposerOpen(true)}>Start a post</Button>}
        />
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id}>
              <ListItem
                to={`/app/posts/${post.id}`}
                ariaLabel={`Open ${post.title}`}
                leading={<Avatar name={post.author?.full_name || 'Student'} src={post.author?.avatar_url} size="sm" />}
                title={post.title}
                subtitle={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="primary">{postTypeLabel(post.type)}</Badge>
                    {post.subject && <Badge variant="outline">{post.subject.name}</Badge>}
                    {post.topic && <Badge variant="neutral">{post.topic.name}</Badge>}
                  </span>
                }
                meta={
                  <span className="flex items-center gap-1.5">
                    <span className="truncate">{post.author?.full_name || 'Student'}</span>
                    <span aria-hidden>·</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide">
                      {timeAgo(post.created_at)}
                    </span>
                  </span>
                }
                right={
                  <span className="flex flex-col items-end gap-1">
                    <UnreadBadge count={post.comment_count ?? 0} />
                    <span className="flex items-center gap-1 font-mono text-xs text-muted">
                      <Heart className="h-3.5 w-3.5" aria-hidden />
                      {post.like_count ?? 0}
                    </span>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ComposerModal
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false)
          if (searchParams.get('new')) {
            const next = new URLSearchParams(searchParams)
            next.delete('new')
            setSearchParams(next, { replace: true })
          }
        }}
        onCreated={() => reload()}
        userId={user?.id ?? ''}
        onSuccess={(m) => success(m)}
      />
    </div>
  )
}

function ComposerModal({
  open,
  onClose,
  onCreated,
  userId,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  userId: string
  onSuccess: (message: string) => void
}) {
  const { departments } = useDepartments()
  const [departmentId, setDepartmentId] = useState('')
  const { subjects } = useSubjects(departmentId || undefined)
  const [subjectId, setSubjectId] = useState('')
  const { topics } = useTopics(subjectId || undefined)
  const [topicId, setTopicId] = useState('')

  const [type, setType] = useState<CreatePostInput['type']>('question')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setType('question')
    setTitle('')
    setBody('')
    setDepartmentId('')
    setSubjectId('')
    setTopicId('')
    setError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !body.trim()) {
      setError('Your post needs a title and some text.')
      return
    }
    setLoading(true)
    try {
      const post = await createPost(userId, {
        type,
        title: title.trim(),
        body: body.trim(),
        subject_id: subjectId || null,
        topic_id: topicId || null,
      })
      reset()
      onClose()
      onCreated()
      onSuccess(`Posted. ${post.title}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish the post.')
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a post"
      description="Ask a doubt or start a discussion with your campus."
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="post-form" loading={loading}>Publish post</Button>
        </>
      }
    >
      <form id="post-form" onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <Field id="post-type" label="Post type">
          <Select id="post-type" value={type} onChange={(e) => setType(e.target.value as CreatePostInput['type'])}>
            {POST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>

        <Field id="post-title" label="Title" required>
          <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" maxLength={120} required />
        </Field>

        <Field id="post-body" label="Details" required>
          <Textarea id="post-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add context, what you've tried, what you need…" rows={4} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="c-dep" label="Department">
            <Select id="c-dep" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setSubjectId(''); setTopicId('') }}>
              <option value="">Any</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
            </Select>
          </Field>
          <Field id="c-sub" label="Subject">
            <Select id="c-sub" value={subjectId} disabled={!departmentId} onChange={(e) => { setSubjectId(e.target.value); setTopicId('') }}>
              <option value="">Any</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field id="c-topic" label="Topic">
            <Select id="c-topic" value={topicId} disabled={!subjectId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">Any</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">!</span>
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
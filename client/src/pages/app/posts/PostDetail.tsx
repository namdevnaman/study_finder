import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bookmark,
  ChevronLeft,
  Flag,
  Heart,
  MessageSquare,
  Pin,
  PinOff,
  Send,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Field, Select, Textarea } from '../../../components/ui/Field'
import { PageSpinner } from '../../../components/ui/Spinner'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import {
  addComment,
  deleteComment,
  deletePost,
  getComments,
  getPost,
  POST_TYPES,
  setCommentPinned,
} from '../../../services/posts'
import { REPORT_REASONS, getBookmarkedPostIds, getPostLikeCount, getPostLikedByUser, reportContent, toggleBookmark, togglePostLike } from '../../../services/engagement'
import type { Comment as CommentType, Post } from '../../../lib/types'
import { formatDateTime, timeAgo } from '../../../utils/format'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentType[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    void (async () => {
      try {
        const [postData, commentData, count, likedByMe, savedIds] = await Promise.all([
          getPost(id),
          getComments(id),
          getPostLikeCount(id),
          getPostLikedByUser(id, user.id),
          getBookmarkedPostIds(user.id),
        ])
        if (cancelled) return
        setPost(postData)
        setComments(commentData)
        setLikeCount(count)
        setLiked(likedByMe)
        setBookmarked(savedIds.includes(id))
      } catch {
        if (!cancelled) setPost(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, user])

  if (loading) return <PageSpinner />

  if (!post || !user) {
    return (
      <EmptyState
        title="Post not found"
        description="This post may have been deleted."
        action={<Link to="/app/discussions"><Button>Back to discussions</Button></Link>}
      />
    )
  }

  const typeLabel = POST_TYPES.find((t) => t.value === post.type)?.label ?? post.type.replace(/_/g, ' ')
  const isAuthor = post.author_id === user.id

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      const comment = await addComment(post.id, user.id, body.trim())
      setComments((current) => [...current, comment])
      setBody('')
    } catch (err) {
      toastError('Could not comment', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    await deletePost(post.id)
    setConfirmDelete(false)
    navigate('/app/discussions')
  }

  const handleLike = async () => {
    try {
      const nowLiked = await togglePostLike(post.id, user.id)
      setLiked(nowLiked)
      setLikeCount((count) => (nowLiked ? count + 1 : count - 1))
    } catch (err) {
      toastError('Could not update like', err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const handleBookmark = async () => {
    try {
      const nowSaved = await toggleBookmark(post.id, user.id)
      setBookmarked(nowSaved)
      if (nowSaved) {
        success('Post saved', 'Find it under the Saved filter in Discussions.')
      }
    } catch (err) {
      toastError('Could not save post', err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const handleTogglePin = async (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId)
    if (!comment) return
    const next = !comment.is_pinned
    try {
      await setCommentPinned(post.id, commentId, next)
      setComments((current) => current.map((c) => (c.id === commentId ? { ...c, is_pinned: next } : c)))
    } catch (err) {
      toastError('Could not pin comment', err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const handleDeleteComment = async (comment: CommentType) => {
    try {
      await deleteComment(comment.id)
      setComments((current) => current.filter((c) => c.id !== comment.id))
    } catch (err) {
      toastError('Could not delete comment', err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/app/discussions" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to discussions
      </Link>

      {/* Post */}
      <article className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{typeLabel}</Badge>
            {post.subject && <Badge variant="outline">{post.subject.name}</Badge>}
            {post.topic && <Badge variant="neutral">{post.topic.name}</Badge>}
            {isAuthor && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="ml-auto rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger-fg"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <h1 className="mt-3 text-xl font-semibold text-foreground">{post.title}</h1>

          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name={post.author?.full_name || 'Student'} src={post.author?.avatar_url} size="sm" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{post.author?.full_name}</p>
              <p className="text-xs text-muted">{formatDateTime(post.created_at)}</p>
            </div>
          </div>
        </div>

        <p className="whitespace-pre-line px-4 py-4 text-[15px] leading-relaxed text-foreground/90 sm:px-5">{post.body}</p>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-2.5 sm:px-5">
          <button
            onClick={() => void handleLike()}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              liked ? 'bg-accent-soft text-amber-700' : 'text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
            aria-pressed={liked}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} aria-hidden />
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </button>
          <button
            onClick={() => void handleBookmark()}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              bookmarked ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
            aria-pressed={bookmarked}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} aria-hidden />
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-danger-soft hover:text-danger-fg"
          >
            <Flag className="h-4 w-4" aria-hidden />
            Report
          </button>
        </div>
      </article>

      {/* Comments */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted">
          <MessageSquare className="h-4 w-4" aria-hidden />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>

        <form onSubmit={(e) => void submitComment(e)} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <Avatar name={user.email || 'You'} src={null} size="sm" />
          <div className="flex-1">
            <Textarea
              aria-label="Write a comment"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add to the discussion…"
              rows={2}
              className="border-0 bg-transparent px-0 focus:ring-0"
            />
          </div>
          <Button type="submit" size="sm" loading={sending} disabled={!body.trim()}>
            <Send className="h-4 w-4" aria-hidden />
            Comment
          </Button>
        </form>

        {comments.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" aria-hidden />}
            title="No comments yet"
            description="Be the first to reply."
          />
        ) : (
          <ul className="space-y-2.5">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className={`rounded-xl border bg-surface p-3.5 ${
                  comment.is_pinned ? 'border-primary/40 bg-primary-soft/40' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={comment.author?.full_name || 'Student'} src={comment.author?.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <span className="font-medium text-foreground">{comment.author?.full_name}</span>
                      <span className="font-mono text-[10px] text-muted">{timeAgo(comment.created_at)}</span>
                      {comment.is_pinned && (
                        <Badge variant="primary">
                          <Pin className="h-3 w-3" aria-hidden />
                          Pinned
                        </Badge>
                      )}
                      {isAuthor && (
                        <span className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => void handleTogglePin(comment.id)}
                            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
                            aria-label={comment.is_pinned ? 'Unpin comment' : 'Pin comment'}
                            title={comment.is_pinned ? 'Unpin' : 'Pin'}
                          >
                            {comment.is_pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
                          </button>
                          <button
                            onClick={() => void handleDeleteComment(comment)}
                            className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger-fg"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{comment.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        reporterId={user.id}
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this post?"
        description="The post and all its comments will be permanently removed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDelete()}>Delete post</Button>
          </>
        }
      >
        <p className="text-sm text-muted">“{post.title}” will be deleted.</p>
      </Modal>
    </div>
  )
}

function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  reporterId,
}: {
  open: boolean
  onClose: () => void
  targetType: 'post' | 'comment' | 'group' | 'resource'
  targetId: string
  reporterId: string
}) {
  const { success } = useToast()
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await reportContent({ targetType, targetId, reporterId, reason, detail: detail.trim() || undefined })
      setDetail('')
      setReason(REPORT_REASONS[0])
      onClose()
      success('Report submitted', 'Thanks, the moderators will review it.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit the report.')
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report this post" description="Help keep the campus community safe and respectful." size="md">
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <Field id="rep-reason" label="Reason" required>
          <Select id="rep-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field id="rep-detail" label="More detail (optional)">
          <Textarea id="rep-detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="Anything else moderators should know?" />
        </Field>
        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">!</span>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Submit report</Button>
        </div>
      </form>
    </Modal>
  )
}
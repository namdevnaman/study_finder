import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  Link2,
  Plus,
  Search,
  Video,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field'
import { PageSpinner } from '../../../components/ui/Spinner'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { useDepartments, useSubjects, useTopics } from '../../../hooks/useAcademics'
import { RESOURCE_KINDS, createResource, getResources, type CreateResourceInput } from '../../../services/resources'
import type { Resource } from '../../../lib/types'
import { isValidUrl, timeAgo } from '../../../utils/format'

const kindIcon: Record<string, typeof FileText> = {
  drive: Link2,
  github: FileCode,
  docs: FileText,
  youtube: Video,
  pdf: FileText,
  other: Download,
}

const kindColor: Record<string, string> = {
  drive: 'bg-accent/10 text-accent',
  github: 'bg-ink-800/10 text-foreground',
  docs: 'bg-primary/10 text-primary',
  youtube: 'bg-danger/10 text-danger-fg',
  pdf: 'bg-forest-400/10 text-forest-400',
  other: 'bg-muted/10 text-muted',
}

export default function Resources() {
  const { user } = useAuth()
  const { success } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectId, setSubjectId] = useState('')
  const [kind, setKind] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === '1')

  const { departments } = useDepartments()
  const [departmentId, setDepartmentId] = useState('')
  const { subjects } = useSubjects(departmentId || undefined)

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) setSubjectId('')
  }, [subjectId, subjects])

  useEffect(() => {
    setLoading(true)
    getResources({ subjectId, kind, search })
      .then((data) => {
        const sorted = [...data]
        if (sort === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
        if (sort === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title))
        setResources(sorted)
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }, [subjectId, kind, search, sort])

  const kindMeta = (value: string | null) => RESOURCE_KINDS.find((k) => k.value === value) ?? RESOURCE_KINDS[RESOURCE_KINDS.length - 1]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Resources</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          New resource
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search resources" placeholder="Search resources…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select aria-label="Department" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setSubjectId('') }}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
        </Select>
        <Select aria-label="Subject" value={subjectId} disabled={!departmentId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">Any type</option>
          {RESOURCE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
        <Select aria-label="Sort resources" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="alpha">A → Z</option>
        </Select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          title="No resources found"
          description="Try a different search or share a resource to get started."
          action={<Button onClick={() => setModalOpen(true)}>Share resource</Button>}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {resources.map((resource) => {
            const meta = kindMeta(resource.kind)
            const Icon = kindIcon[resource.kind ?? 'other'] ?? Link2
            const color = kindColor[resource.kind ?? 'other'] ?? kindColor.other
            return (
              <li key={resource.id}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
                    <p className="truncate text-xs text-muted">
                      {resource.subject?.name}
                      {resource.subject && (resource.author || resource.created_at) ? ' · ' : ''}
                      {resource.author?.full_name}
                      {resource.author && resource.created_at ? ' · ' : ''}
                      {timeAgo(resource.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden font-mono text-[11px] text-muted sm:inline">{meta.label}</span>
                    <ExternalLink className="h-4 w-4 text-muted" aria-hidden />
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <ShareResourceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          if (searchParams.get('new')) {
            const next = new URLSearchParams(searchParams)
            next.delete('new')
            setSearchParams(next, { replace: true })
          }
        }}
        userId={user?.id ?? ''}
        onCreated={() => {
          setLoading(true)
          getResources({ subjectId, kind, search })
            .then(setResources)
            .finally(() => setLoading(false))
        }}
        onSuccess={(m) => success(m)}
      />
    </div>
  )
}

function ShareResourceModal({
  open,
  onClose,
  userId,
  onCreated,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  userId: string
  onCreated: () => void
  onSuccess: (message: string) => void
}) {
  const { departments } = useDepartments()
  const [departmentId, setDepartmentId] = useState('')
  const { subjects } = useSubjects(departmentId || undefined)
  const [subjectId, setSubjectId] = useState('')
  const { topics } = useTopics(subjectId || undefined)
  const [topicId, setTopicId] = useState('')
  const [kind, setKind] = useState<CreateResourceInput['kind']>('drive')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setKind('drive')
    setTitle('')
    setUrl('')
    setDescription('')
    setDepartmentId('')
    setSubjectId('')
    setTopicId('')
    setError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Give the resource a title.')
      return
    }
    if (!isValidUrl(url.trim())) {
      setError('Enter a valid http(s) link.')
      return
    }
    setLoading(true)
    try {
      await createResource(userId, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        kind,
        subject_id: subjectId || null,
        topic_id: topicId || null,
      })
      reset()
      onClose()
      onCreated()
      onSuccess('Resource shared')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share the resource.')
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share a resource"
      description="Link to notes, files, or any learning material."
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="resource-form" loading={loading}>Share resource</Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="r-title" label="Title" required>
            <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DBMS complete notes" required />
          </Field>
          <Field id="r-url" label="Link" required>
            <Input id="r-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required />
          </Field>
        </div>

        <Field id="r-kind" label="Type">
          <Select id="r-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {RESOURCE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Select>
        </Field>

        <Field id="r-desc" label="Description">
          <Textarea id="r-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's inside? Who is it for?" rows={2} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="r-dep" label="Department">
            <Select id="r-dep" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setSubjectId('') }}>
              <option value="">Any</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
            </Select>
          </Field>
          <Field id="r-sub" label="Subject">
            <Select id="r-sub" value={subjectId} disabled={!departmentId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Any</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field id="r-topic" label="Topic">
            <Select id="r-topic" value={topicId} disabled={!subjectId}>
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

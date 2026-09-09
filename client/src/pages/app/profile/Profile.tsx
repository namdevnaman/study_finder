import { useEffect, useRef, useState } from 'react'
import { BellRing, Building2, Camera, Loader2, Moon } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { BRANCHES, SEMESTERS, YEARS } from '../../../lib/constants'
import { uploadAvatar, updateProfile } from '../../../services/profile'
import { normalizePrefs, updateNotificationPrefs } from '../../../services/notifications'
import type { NotificationPrefs } from '../../../lib/types'
import { useToast } from '../../../components/ui/Toast'

const PREFS_META: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'join_requests', label: 'Group activity', hint: 'When someone joins your group or sends a join request.' },
  { key: 'comments', label: 'Comments', hint: 'When someone comments on your post.' },
  { key: 'likes', label: 'Likes', hint: 'When someone likes your post.' },
  { key: 'sessions', label: 'Sessions', hint: 'Reminders before upcoming study sessions.' },
]

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-surface-strong'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

export default function Profile() {
  const { user, profile, refreshProfile, profileError } = useAuth()
  const { success, error: toastError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [semester, setSemester] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => normalizePrefs(profile?.notification_prefs))
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setCollegeName(profile.college_name ?? '')
      setBranch(profile.branch ?? '')
      setYear(profile.year ? String(profile.year) : '')
      setSemester(profile.semester ? String(profile.semester) : '')
      setBio(profile.bio ?? '')
      setInterests(profile.subjects_of_interest?.join(', ') ?? '')
      setPrefs(normalizePrefs(profile.notification_prefs))
    }
  }, [profile])

  if (!user) return null

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toastError('Invalid file', 'Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toastError('File too large', 'Avatars must be under 2 MB.')
      return
    }
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      await updateProfile(user.id, { avatar_url: url })
      await refreshProfile()
      success('Avatar updated')
    } catch (err) {
      toastError('Upload failed', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !fullName.trim()) return
    setSaving(true)
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        college_name: collegeName.trim() || null,
        branch: branch || null,
        year: year ? Number(year) : null,
        semester: semester ? Number(semester) : null,
        bio: bio.trim() || null,
        subjects_of_interest: interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      await refreshProfile()
      success('Profile saved')
    } catch (err) {
      toastError('Could not save', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Profile & settings</h1>
          <p className="mt-0.5 text-sm text-muted">This is how study partners find you.</p>
        </div>
      </div>

      {profileError && (
        <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">{profileError}</p>
      )}

      {/* Avatar card */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <Avatar name={fullName || 'You'} src={profile?.avatar_url} size="xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-card transition hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
              aria-label="Upload profile photo"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatar(e)} />
          </div>
          <div className="text-sm text-muted">
            <p className="font-medium text-foreground">{profile?.email ?? user.email}</p>
            {profile?.college_name && <p className="mt-0.5 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" aria-hidden />{profile.college_name}</p>}
            <p className="mt-0.5">A clear photo helps classmates recognize you. Max 2 MB.</p>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basics */}
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field id="pf-name" label="Full name" required>
              <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>

            <Field id="pf-college" label="College name" hint="e.g. IIT Bombay, VIT Vellore">
              <Input id="pf-college" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="Your college" maxLength={80} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="pf-branch" label="Branch">
                <Select id="pf-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field id="pf-year" label="Year">
                <Select id="pf-year" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </Select>
              </Field>
              <Field id="pf-sem" label="Semester">
                <Select id="pf-sem" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field id="pf-bio" label="Bio" hint="A line or two about how you study best.">
              <Textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="e.g. CSE student, loves DSA, studies best in small groups." maxLength={300} />
            </Field>
            <Field id="pf-interests" label="Subjects of interest" hint="Comma-separated, e.g. DBMS, Operating Systems, DSA">
              <Input id="pf-interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="DBMS, OS, DSA" />
            </Field>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {interests.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            )}
          </CardBody>
          <CardBody className="flex justify-end border-t border-border">
            <Button type="submit" loading={saving}>Save changes</Button>
          </CardBody>
        </Card>
      </form>

      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Appearance</p>
              <p className="text-xs text-muted">Light, dark, or follow your system.</p>
            </div>
          </div>
          <ThemeToggle />
        </CardBody>
      </Card>

      {/* Notifications settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4" aria-hidden />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {PREFS_META.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted">{item.hint}</p>
              </div>
              <Toggle
                checked={prefs[item.key]}
                label={item.label}
                onChange={(v) => setPrefs((prev) => ({ ...prev, [item.key]: v }))}
              />
            </div>
          ))}
          <div className="flex justify-end border-t border-border pt-3">
            <Button
              variant="secondary"
              loading={savingPrefs}
              onClick={async () => {
                if (!user) return
                setSavingPrefs(true)
                try {
                  await updateNotificationPrefs(user.id, prefs)
                  await refreshProfile()
                  success('Settings saved')
                } catch (err) {
                  toastError('Could not save', err instanceof Error ? err.message : 'Something went wrong.')
                } finally {
                  setSavingPrefs(false)
                }
              }}
            >
              Save settings
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
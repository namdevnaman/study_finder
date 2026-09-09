export const BRANCHES = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
] as const

export const YEARS = [1, 2, 3, 4] as const

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export function branchShortName(branch: string | null): string {
  if (!branch) return '—'
  return branch
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}

export const EMAIL_DOMAIN_HINT = 'Use your college email (e.g. you@sati.ac.in).'
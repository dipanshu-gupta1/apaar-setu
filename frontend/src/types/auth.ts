export type Role =
  | 'aicte_admin'
  | 'institution_admin'
  | 'verification_officer'
  | 'student'
  | 'faculty'

export const ROLE_LABELS: Record<Role, string> = {
  aicte_admin: 'AICTE / Super Admin',
  institution_admin: 'Institution Admin',
  verification_officer: 'Verification Officer',
  student: 'Student',
  faculty: 'Faculty / Data Entry',
}

export interface DemoUser {
  name: string
  role: Role
  institution: string
}

// Synthetic demo users. Not real people or real student data.
export const DEMO_USERS: Record<Role, DemoUser> = {
  aicte_admin: { name: 'Aarav Mehta', role: 'aicte_admin', institution: 'All institutions (aggregate view)' },
  institution_admin: { name: 'Neha Sharma', role: 'institution_admin', institution: 'Demo Institute of Technology' },
  verification_officer: { name: 'Rohan Iyer', role: 'verification_officer', institution: 'Demo Institute of Technology' },
  student: { name: 'Ananya Nair', role: 'student', institution: 'Demo Institute of Technology' },
  faculty: { name: 'Kiran Rao', role: 'faculty', institution: 'Demo Institute of Technology' },
}

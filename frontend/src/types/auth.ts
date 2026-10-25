export type Role =
  | 'aicte_admin'
  | 'institution_admin'
  | 'verification_officer'
  | 'student'
  | 'faculty'

export const ROLE_LABELS: Record<Role, string> = {
  aicte_admin: 'AICTE / Central Authority',
  institution_admin: 'Institution Admin (Registrar)',
  verification_officer: 'Verification Officer',
  student: 'Student Portal',
  faculty: 'Faculty / Data Verification',
}

export interface DemoUser {
  name: string
  role: Role
  institution: string
}

export const DEMO_USERS: Record<Role, DemoUser> = {
  aicte_admin: { name: 'Dr. Aarav Mehta', role: 'aicte_admin', institution: 'AICTE HQ, New Delhi (National Scope)' },
  institution_admin: { name: 'Neha Sharma', role: 'institution_admin', institution: 'SVNIT Surat (AICTE ID: 1-09823)' },
  verification_officer: { name: 'Rohan Iyer', role: 'verification_officer', institution: 'SVNIT Surat (AICTE ID: 1-09823)' },
  student: { name: 'Dipanshu Gupta', role: 'student', institution: 'SVNIT Surat (AICTE ID: 1-09823)' },
  faculty: { name: 'Dr. Kiran Rao', role: 'faculty', institution: 'SVNIT Surat (AICTE ID: 1-09823)' },
}
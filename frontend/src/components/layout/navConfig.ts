import type { Role } from '../../types/auth'
import type { IconName } from '../ui/Icon'

export interface NavItem {
  path: string
  label: string
  title: string
  icon: IconName
  roles: Role[]
  description: string
}

const ALL: Role[] = [
  'aicte_admin',
  'institution_admin',
  'verification_officer',
  'student',
  'faculty',
]

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', title: 'Dashboard', icon: 'dashboard', roles: ALL,
    description: 'Overview of your work and key metrics.' },
  { path: '/students', label: 'Students', title: 'Student Directory', icon: 'users',
    roles: ['institution_admin', 'verification_officer', 'faculty'],
    description: 'Institution-scoped student records with masked identifiers.' },
  { path: '/my-record', label: 'My Record', title: 'My Record', icon: 'user', roles: ['student'],
    description: 'Your profile, enrolment details and verification status.' },
  { path: '/verification', label: 'Verification', title: 'Verification Queue', icon: 'shield',
    roles: ['verification_officer'],
    description: 'Cases waiting for review, with evidence and decisions.' },
  { path: '/corrections', label: 'Corrections', title: 'Correction Requests', icon: 'file',
    roles: ['student', 'institution_admin', 'verification_officer'],
    description: 'Submit, review and track correction requests.' },
  { path: '/data-quality', label: 'Data Quality', title: 'Data Quality and Duplicates', icon: 'copy',
    roles: ['institution_admin'],
    description: 'Missing or inconsistent data and duplicate candidates.' },
  { path: '/institutions', label: 'Institutions', title: 'Institutions and Staff', icon: 'building',
    roles: ['aicte_admin', 'institution_admin'],
    description: 'Institution directory, authorization state and staff access.' },
  { path: '/reports', label: 'Reports', title: 'Reports and Exports', icon: 'chart',
    roles: ['aicte_admin', 'institution_admin'],
    description: 'Permitted reports and export requests.' },
  { path: '/audit', label: 'Audit', title: 'Audit History', icon: 'file',
    roles: ['aicte_admin', 'institution_admin'],
    description: 'Authorized audit events and security overview.' },
  { path: '/ai-insights', label: 'AI Insights', title: 'AI Insights', icon: 'zap',
    roles: ['aicte_admin', 'institution_admin', 'verification_officer'],
    description: 'Advisory insights. AI never changes records on its own.' },
  { path: '/notifications', label: 'Notifications', title: 'Notifications', icon: 'bell', roles: ALL,
    description: 'Updates about your cases and requests.' },
]

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

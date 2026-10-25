import type { Tone } from '../../components/ui/Badge'
import type { StatCardProps } from '../../components/ui/StatCard'
import type { Role } from '../../types/auth'

export type VerificationStatus = 'verified' | 'pending' | 'correction' | 'failed'

export const STATUS_META: Record<VerificationStatus, { label: string; tone: Tone }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending review', tone: 'warning' },
  correction: { label: 'Correction needed', tone: 'info' },
  failed: { label: 'Verification failed', tone: 'danger' },
}

export interface DemoStudent {
  id: string
  name: string
  maskedApaar: string
  program: string
  year: string
  enrolment: 'Enrolled' | 'Graduated' | 'Transferred'
  status: VerificationStatus
  updated: string
}

const FIRST = ['Ananya', 'Rahul', 'Priya', 'Aditya', 'Sneha', 'Karan', 'Meera', 'Vikram', 'Isha', 'Arjun', 'Divya', 'Rohit']
const LAST = ['Verma', 'Nair', 'Singh', 'Patel', 'Reddy', 'Gupta', 'Iyer', 'Khan', 'Das', 'Joshi']
const PROGRAMS = ['B.Tech Computer Science', 'B.Tech Mechanical', 'B.Tech Electronics', 'MBA', 'MCA', 'Diploma Civil']
const STATUSES: VerificationStatus[] = ['verified', 'verified', 'pending', 'verified', 'correction', 'verified', 'failed', 'pending']

// Synthetic records. APAAR identifiers are always masked.
export const DEMO_STUDENTS: DemoStudent[] = Array.from({ length: 36 }, (_, i): DemoStudent => {
  const start = 2022 + (i % 4)
  return {
    id: `STU-${1001 + i}`,
    name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3 + 1) % LAST.length]}`,
    maskedApaar: `•••• •••• ${String(1000 + ((i * 7919) % 9000))}`,
    program: PROGRAMS[i % PROGRAMS.length],
    year: `${start}–${String((start + 1) % 100).padStart(2, '0')}`,
    enrolment: i % 9 === 8 ? 'Graduated' : i % 11 === 10 ? 'Transferred' : 'Enrolled',
    status: STATUSES[i % STATUSES.length],
    updated: `${String(1 + (i % 28)).padStart(2, '0')} Oct 2026`,
  }
})

// The demo student user ("Student" role) is the first synthetic record.
export const SELF_STUDENT: DemoStudent = DEMO_STUDENTS[0]
export const SELF_STUDENT_ID = SELF_STUDENT.id

/* ---------- Student detail ---------- */

export interface FieldCompare {
  label: string
  approved: string
  pending?: string
}

export interface TimelineEvent {
  title: string
  detail: string
  when: string
  tone: Tone
}

export interface OpenRequest {
  reason: string
  submitted: string
  by: string
}

export interface StudentDetail {
  fields: FieldCompare[]
  statusNote: string
  timeline: TimelineEvent[]
  request?: OpenRequest
}

const pad = (n: number) => String(n).padStart(2, '0')

export function detailFor(s: DemoStudent): StudentDetail {
  const i = Number(s.id.slice(4)) - 1001
  const dob = `${2001 + (i % 4)}-${pad(1 + (i % 12))}-${pad(1 + ((i * 5) % 27))}`
  const mobile = (n: number) => `+91 ••••• ••${String(100 + ((i * 37 + n) % 900))}`

  const fields: FieldCompare[] = [
    { label: 'Full name', approved: s.name },
    { label: 'Date of birth', approved: dob },
    { label: 'Program', approved: s.program },
    { label: 'Enrolment status', approved: s.enrolment },
    { label: 'Mobile number', approved: mobile(0) },
  ]

  const timeline: TimelineEvent[] = [
    { title: 'Record imported', detail: 'Added through the institution bulk import.', when: '12 Sep 2026', tone: 'neutral' },
    { title: 'Verification requested', detail: 'Sent for matching against the source record.', when: '12 Sep 2026', tone: 'info' },
  ]

  let statusNote = ''
  let request: OpenRequest | undefined

  switch (s.status) {
    case 'verified':
      statusNote = 'All fields match the source record.'
      timeline.push({ title: 'Verified', detail: 'All fields matched the source record.', when: s.updated, tone: 'success' })
      break
    case 'pending':
      statusNote = 'An update is waiting for a verification officer.'
      fields[4] = { ...fields[4], pending: mobile(500) }
      request = { reason: 'The student changed their mobile number.', submitted: s.updated, by: 'Institution staff' }
      timeline.push({ title: 'Update submitted', detail: 'The mobile number change is waiting for review.', when: s.updated, tone: 'warning' })
      break
    case 'correction':
      statusNote = 'A correction request is open. Review the proposed change.'
      fields[1] = { ...fields[1], pending: `${dob.slice(0, 8)}${pad(1 + ((i * 5 + 3) % 27))}` }
      request = { reason: 'The date of birth on the certificate differs from the imported record.', submitted: s.updated, by: 'Institution staff' }
      timeline.push({ title: 'Correction requested', detail: 'The date of birth does not match the certificate.', when: s.updated, tone: 'info' })
      break
    case 'failed':
      statusNote = 'The last check did not match the source record. A correction may be needed.'
      timeline.push({ title: 'Verification failed', detail: 'The name does not match the source record.', when: s.updated, tone: 'danger' })
      break
  }

  return { fields, statusNote, timeline, request }
}

/* ---------- Verification queue ---------- */

export type CasePriority = 'high' | 'normal' | 'low'
export type CaseKind = 'Data update' | 'Correction request' | 'Re-check'

export interface VerificationCase {
  id: string
  studentId: string
  studentName: string
  kind: CaseKind
  priority: CasePriority
  waitingDays: number
  summary: string
  evidence: string[]
  changes: FieldCompare[]
}

type OpenStatus = Exclude<VerificationStatus, 'verified'>

const CASE_KIND: Record<OpenStatus, CaseKind> = {
  pending: 'Data update',
  correction: 'Correction request',
  failed: 'Re-check',
}

const CASE_EVIDENCE: Record<OpenStatus, string[]> = {
  pending: ['Mobile number update form (PDF)', 'Institution request note'],
  correction: ['Birth certificate scan', 'Institution cover letter'],
  failed: ['Source record extract', 'Last check result'],
}

const PRIORITY_RANK: Record<CasePriority, number> = { high: 0, normal: 1, low: 2 }

export const DEMO_CASES: VerificationCase[] = DEMO_STUDENTS
  .filter((s): s is DemoStudent & { status: OpenStatus } => s.status !== 'verified')
  .map((s, idx): VerificationCase => {
    const detail = detailFor(s)
    const waitingDays = 1 + ((idx * 3) % 12)
    const priority: CasePriority =
      s.status === 'failed' || waitingDays >= 9
        ? 'high'
        : s.status === 'correction'
          ? 'normal'
          : 'low'
    return {
      id: `CASE-${2001 + idx}`,
      studentId: s.id,
      studentName: s.name,
      kind: CASE_KIND[s.status],
      priority,
      waitingDays,
      summary: detail.statusNote,
      evidence: CASE_EVIDENCE[s.status],
      changes: detail.fields.filter((f) => f.pending),
    }
  })
  .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.waitingDays - a.waitingDays)

/* ---------- Dashboard ---------- */

export const ROLE_NOTE: Record<Role, string> = {
  aicte_admin: 'Aggregate view across institutions. Individual student data is not shown here.',
  institution_admin: "Your institution's records, verification status and pending work.",
  verification_officer: 'Records and cases that need your review.',
  student: 'Your verification status and requests at a glance.',
  faculty: 'Records assigned to you and your data-entry work.',
}

export const RECENT_ACTIVITY = [
  { text: 'Verification completed for STU-1004', when: '2 hours ago' },
  { text: 'Correction request received for STU-1010', when: 'Yesterday' },
  { text: 'Duplicate candidate flagged for review', when: 'Yesterday' },
  { text: 'Bulk import finished: 118 accepted, 2 need review', when: '2 days ago' },
  { text: 'Verification service retry succeeded', when: '3 days ago' },
]

export function statsFor(
  role: Role,
  live: { unread: number; openCorrections: number },
): StatCardProps[] {
  const n = (s: VerificationStatus) => DEMO_STUDENTS.filter((x) => x.status === s).length

  if (role === 'aicte_admin') {
    return [
      { label: 'Authorized institutions', value: '312', hint: 'Demo figure', icon: 'building', to: '/institutions' },
      { label: 'Onboarding requests', value: '9', hint: 'Awaiting review', icon: 'file', to: '/institutions' },
      { label: 'Authorizations expiring', value: '14', hint: 'Within 60 days', icon: 'bell', to: '/institutions' },
      { label: 'Verified share', value: '81%', hint: 'Across institutions, demo figure', icon: 'shield', to: '/reports' },
    ]
  }

  if (role === 'student') {
    return [
      { label: 'Verification status', value: STATUS_META[SELF_STUDENT.status].label, hint: 'Demo data', icon: 'shield', to: '/my-record' },
      { label: 'Open correction requests', value: String(live.openCorrections), hint: live.openCorrections === 0 ? 'Nothing pending' : 'Waiting for review', icon: 'file', to: '/corrections' },
      { label: 'Unread notifications', value: String(live.unread), hint: live.unread === 0 ? 'You are all caught up' : 'Needs your attention', icon: 'bell', to: '/notifications' },
    ]
  }

  return [
    { label: 'Total records', value: String(DEMO_STUDENTS.length), hint: 'In your scope', icon: 'users', to: '/students' },
    { label: 'Verified', value: String(n('verified')), hint: 'Approved records', icon: 'shield', to: '/students?status=verified' },
    { label: 'Pending review', value: String(n('pending')), hint: 'Awaiting a decision', icon: 'dashboard', to: '/students?status=pending' },
    { label: 'Correction needed', value: String(n('correction')), hint: 'Waiting on a correction', icon: 'file', to: '/students?status=correction' },
  ]
}


/* ---------- Corrections ---------- */

export type CorrectionStatus = 'submitted' | 'in_review' | 'approved' | 'rejected'

export const CORRECTION_STATUS_META: Record<CorrectionStatus, { label: string; tone: Tone }> = {
  submitted: { label: 'Submitted', tone: 'info' },
  in_review: { label: 'In review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const CORRECTABLE_FIELDS = ['Full name', 'Date of birth', 'Program', 'Mobile number']

export interface CorrectionRequest {
  id: string
  studentId: string
  studentName: string
  field: string
  currentValue: string
  requestedValue: string
  reason: string
  evidence: string
  status: CorrectionStatus
  submitted: string
  decisionNote?: string
}

export const SEED_CORRECTIONS: CorrectionRequest[] = DEMO_STUDENTS
  .flatMap((s, i): Omit<CorrectionRequest, 'id'>[] => {
    const d = detailFor(s)
    const base = { studentId: s.id, studentName: s.name, submitted: s.updated }

    if (s.status === 'correction' || s.status === 'pending') {
      const f = d.fields.find((x) => x.pending)
      if (!f || !f.pending) return []
      return [{
        ...base,
        field: f.label,
        currentValue: f.approved,
        requestedValue: f.pending,
        reason: d.request?.reason ?? 'Change requested by the institution.',
        evidence: s.status === 'correction' ? 'Birth certificate scan' : 'Mobile number update form',
        status: s.status === 'correction' ? 'in_review' : 'submitted',
      }]
    }

    if (s.status === 'failed') {
      return [{
        ...base,
        field: 'Full name',
        currentValue: s.name,
        requestedValue: s.name.toUpperCase(),
        reason: 'The name spelling differs from the marksheet.',
        evidence: 'Marksheet copy',
        status: 'rejected',
        decisionNote: 'The marksheet shows the same spelling as the approved record.',
      }]
    }

    if (i % 5 === 0) {
      return [{
        ...base,
        field: 'Mobile number',
        currentValue: d.fields[4].approved,
        requestedValue: `+91 ••••• ••${String(200 + ((i * 53) % 700))}`,
        reason: 'The student changed their mobile number.',
        evidence: 'Mobile number update form',
        status: 'approved',
        decisionNote: 'Matched the supporting document.',
      }]
    }

    return []
  })
  .map((r, n): CorrectionRequest => ({ ...r, id: `COR-${3001 + n}` }))

/* ---------- Notifications ---------- */

export interface DemoNotification {
  id: string
  roles: Role[]
  title: string
  body: string
  when: string
  read: boolean
  to?: string
}

export const SEED_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'N-1',
    roles: ['institution_admin', 'aicte_admin', 'verification_officer', 'student', 'faculty'],
    title: 'Authorized Portal Login Session',
    body: 'Institutional session active for SVNIT Surat with 2FA cryptographic token authentication.',
    when: 'Just now',
    read: false,
  },
  {
    id: 'N-2',
    roles: ['institution_admin', 'verification_officer'],
    title: 'New Student Registered (Supabase Cloud)',
    body: 'Student Dipanshu Gupta (STU-409AC) successfully stored to Central Database and queued for verification.',
    when: '15 minutes ago',
    read: false,
    to: '/students',
  },
  {
    id: 'N-3',
    roles: ['aicte_admin', 'institution_admin', 'verification_officer'],
    title: 'CRITICAL: Dual Enrollment Fraud Flagged',
    body: 'Candidate Vikram Malhotra detected simultaneously enrolled across IIT Delhi & Private Univ. Scholarship locked.',
    when: '1 hour ago',
    read: false,
    to: '/ai-insights',
  },
  {
    id: 'N-4',
    roles: ['institution_admin', 'faculty'],
    title: 'ML Validity Model Audit Completed',
    body: 'Random Forest Model (validity_model.joblib) identified 2 potential anomalous records with 92%+ confidence.',
    when: '2 hours ago',
    read: false,
    to: '/data-quality',
  },
  {
    id: 'N-5',
    roles: ['verification_officer', 'student'],
    title: 'Anti-Tamper QR Seal Generated',
    body: 'Cryptographic SHA-256 seal (AICTE-SIG-AC47732...) generated for degree certificate printing.',
    when: '3 hours ago',
    read: true,
    to: '/verification',
  },
  {
    id: 'N-6',
    roles: ['institution_admin', 'verification_officer'],
    title: 'Student Correction Request Logged',
    body: 'Vibha Manocha submitted a date of birth correction request with supporting certificate evidence.',
    when: 'Yesterday',
    read: true,
    to: '/corrections',
  },
  {
    id: 'N-7',
    roles: ['aicte_admin', 'institution_admin'],
    title: 'Statutory Intake Capacity Monitored',
    body: 'B.Tech Computer Science reached 91.4% approved intake utilization. Supernumerary/NRI quotas verified.',
    when: 'Yesterday',
    read: true,
    to: '/ai-insights',
  },
]

import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import {
  DEMO_STUDENTS,
  RECENT_ACTIVITY,
  ROLE_NOTE,
  SELF_STUDENT_ID,
  STATUS_META,
  statsFor,
  type VerificationStatus,
} from '../../lib/mock/demoData'
import type { Role } from '../../types/auth'
import { useAuth } from '../auth/AuthContext'
import { useCorrections } from '../corrections/CorrectionsContext'
import { useNotifications } from '../notifications/NotificationsContext'
import { getNationalSummary, checkBackendHealth } from '../../lib/api/endpoints'
import type { NationalSummary } from '../../lib/api/types'

const STAFF = new Set<Role>(['institution_admin', 'verification_officer', 'faculty'])

export default function DashboardPage() {
  const { user } = useAuth()
  const { unread } = useNotifications()
  const { requests } = useCorrections()

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [nationalMetrics, setNationalMetrics] = useState<NationalSummary | null>(null)

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))

    getNationalSummary()
      .then((data) => setNationalMetrics(data))
      .catch(() => {})
  }, [])

  const openCorrections = requests.filter(
    (r) =>
      r.studentId === SELF_STUDENT_ID &&
      (r.status === 'submitted' || r.status === 'in_review'),
  ).length
  const stats = statsFor(user.role, { unread, openCorrections })
  const total = DEMO_STUDENTS.length

  const breakdown = (Object.keys(STATUS_META) as VerificationStatus[]).map((key) => {
    const count = DEMO_STUDENTS.filter((s) => s.status === key).length
    return { key, count, pct: Math.round((count / total) * 100) }
  })

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}`}
        description={ROLE_NOTE[user.role]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {backendOnline === true && <Badge tone="success">FastAPI Backend: Online</Badge>}
            {backendOnline === false && <Badge tone="danger">FastAPI Backend: Offline</Badge>}
            <Badge tone="neutral">AICTE APAAR-Setu</Badge>
          </div>
        }
      />

      {nationalMetrics && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">National Academic Registry Overview (Live AICTE Data)</h2>
          <div className="stat-grid" style={{ marginTop: 8 }}>
            <StatCard label="Enrolled Students" value={nationalMetrics.total_enrolled_students.toLocaleString()} icon="users" />
            <StatCard label="APAAR Coverage" value={`${nationalMetrics.apaar_coverage_percentage}%`} icon="shield" />
            <StatCard label="Intake Utilization" value={nationalMetrics.capacity_utilization_avg} icon="building" />
            <StatCard label="Ghost Enrollments Flagged" value={String(nationalMetrics.flagged_dual_enrollments)} icon="file" />
          </div>
        </section>
      )}

      <section className="stat-grid" aria-label="Key metrics">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {STAFF.has(user.role) && (
        <section className="card" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="card-title">Verification status mix</h2>
          <ul className="breakdown">
            {breakdown.map((b) => (
              <li key={b.key} className="breakdown-item">
                <div className="breakdown-label">
                  <Badge tone={STATUS_META[b.key].tone}>{STATUS_META[b.key].label}</Badge>
                  <span className="muted">{b.count} records</span>
                </div>
                <div className="bar" aria-hidden="true">
                  <div className={`bar-fill tone-${STATUS_META[b.key].tone}`} style={{ width: `${b.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="card-title">Recent activity</h2>
        <ul className="activity">
          {RECENT_ACTIVITY.map((a, idx) => (
            <li key={idx} className="activity-item">
              <div>
                <p className="activity-text">{a.text}</p>
                <time className="activity-time">{a.when}</time>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
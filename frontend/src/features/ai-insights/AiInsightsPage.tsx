import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { detectDualEnrollment, auditIntakeCapacity } from '../../lib/api/endpoints'
import type { DualEnrollmentAlert } from '../../lib/api/types'

interface ProgramCapacityReport {
  program: string
  institution_id: string
  approved_intake: number
  actual_enrolment: number
  utilization_percentage: number
  excess_admissions: number
  supernumerary_count: number
  nri_count: number
  oci_count: number
  fn_count: number
  status: string
  violations: string[]
}

const INSTITUTION_NAMES: Record<string, string> = {
  'SVNIT-SURAT-001': 'Sardar Vallabhbhai National Institute of Technology (SVNIT Surat)',
  'PU-DELHI-099': 'Private University (Delhi NCR Node)',
  'AIET-JAIPUR-006': 'Apex Institute of Technology & Engineering (Jaipur)',
  'WTI-PUNE-005': 'Western Technical Institute (Pune)',
  'IITD-DELHI-002': 'Indian Institute of Technology Delhi (IITD)',
}

// Generates realistic multi-institution pilot data for AICTE audit
function buildAictePilotAdmissions() {
  const records: any[] = []

  // 1. Cross-institution dual enrollment fraud (Vikram Malhotra in SVNIT Surat & PU-Delhi)
  records.push(
    {
      student_id: 'STU-DUAL-01',
      institution_id: 'SVNIT-SURAT-001',
      first_name: 'Vikram',
      last_name: 'Malhotra',
      date_of_birth: '2002-08-20',
      apaar_id: '998877665544',
      program: 'B.Tech Mechanical Engineering',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: false,
      is_nri: false,
    },
    {
      student_id: 'STU-DUAL-01-B',
      institution_id: 'PU-DELHI-099',
      first_name: 'Vikram',
      last_name: 'Malhotra',
      date_of_birth: '2002-08-20',
      apaar_id: '998877665544',
      program: 'B.Tech Mechanical Engineering',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: false,
      is_nri: false,
    }
  )

  // 2. SVNIT Surat - B.Tech Computer Science (Compliant, 60 approved, 62 actual with 2 TFWS supernumerary seats)
  for (let i = 1; i <= 62; i++) {
    const isSuper = i > 60 // 2 TFWS seats
    records.push({
      student_id: `SVNIT-CSE-${String(i).padStart(3, '0')}`,
      institution_id: 'SVNIT-SURAT-001',
      first_name: i === 1 ? 'Dipanshu' : i === 2 ? 'Vibha' : i === 3 ? 'Sonu' : i === 4 ? 'Shourya' : `Scholar_${i}`,
      last_name: i === 1 ? 'Gupta' : i === 2 ? 'Manocha' : i === 3 ? 'Mittal' : i === 4 ? 'Gupta' : 'SVNIT',
      date_of_birth: '2004-03-12',
      apaar_id: `24010000${String(i).padStart(4, '0')}`,
      program: 'B.Tech Computer Science and Engineering',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: isSuper,
      is_nri: false,
    })
  }

  // 3. Apex Institute Jaipur - B.Tech Computer Science (Violation: 60 approved, 74 actual = 14 excess admissions)
  for (let i = 1; i <= 74; i++) {
    records.push({
      student_id: `AIET-CSE-${String(i).padStart(3, '0')}`,
      institution_id: 'AIET-JAIPUR-006',
      first_name: `Enrollee_${i}`,
      last_name: 'Jaipur',
      date_of_birth: '2003-05-18',
      apaar_id: `24020000${String(i).padStart(4, '0')}`,
      program: 'B.Tech Computer Science',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: false,
      is_nri: false,
    })
  }

  // 4. Western Technical Institute Pune - B.Tech Electronics (Compliant: 60 approved, 48 actual = 80% utilization)
  for (let i = 1; i <= 48; i++) {
    records.push({
      student_id: `WTI-ECE-${String(i).padStart(3, '0')}`,
      institution_id: 'WTI-PUNE-005',
      first_name: `Cadet_${i}`,
      last_name: 'Pune',
      date_of_birth: '2003-09-22',
      apaar_id: `24030000${String(i).padStart(4, '0')}`,
      program: 'B.Tech Electronics & Communication',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: false,
      is_nri: false,
    })
  }

  return records
}

export default function AiInsightsPage() {
  const [fraudAlerts, setFraudAlerts] = useState<DualEnrollmentAlert[]>([])
  const [capacityReports, setCapacityReports] = useState<ProgramCapacityReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasScanned, setHasScanned] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'fraud' | 'intake'>('all')

  // Interactive enforcement actions
  const [frozenScholarships, setFrozenScholarships] = useState<Record<string, boolean>>({})
  const [dispatchedNotices, setDispatchedNotices] = useState<Record<string, boolean>>({})

  async function handleRunFraudScan() {
    setLoading(true)
    setError('')
    try {
      const records = buildAictePilotAdmissions()
      const [duals, caps] = await Promise.all([
        detectDualEnrollment(records),
        auditIntakeCapacity(records),
      ])
      setFraudAlerts(duals || [])
      setCapacityReports(caps || [])
      setHasScanned(true)
    } catch (err: any) {
      setError(err.message || 'Failed to execute AICTE Intelligence & Fraud Detection Engine.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFreezeScholarship = (key: string) => {
    setFrozenScholarships((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleDispatchNotice = (key: string) => {
    setDispatchedNotices((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalViolations = capacityReports.filter((r) => r.status !== 'COMPLIANT').length

  return (
    <>
      <PageHeader
        title="AICTE Institutional Intelligence & Fraud Hunter"
        description="Statutory surveillance algorithms for cross-institution dual enrollment detection, ghost student prevention and intake quota compliance across all federal nodes."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunFraudScan}
            disabled={loading}
          >
            {loading ? 'Running AICTE Intelligence Scan...' : '⚡ Run National Fraud & Intake Audit'}
          </button>
        }
      />

      {error && <p className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</p>}

      {/* TOP KPI SCOREBOARD METRICS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Dual Enrollment Alerts</span>
          <strong style={{ fontSize: '1.5rem', color: hasScanned && fraudAlerts.length > 0 ? '#f87171' : 'var(--text)' }}>
            {hasScanned ? `${fraudAlerts.length} Flagged` : '0 Active'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Simultaneous Ghost Admissions
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-text)', display: 'block' }}>DBT Subsidy Protected</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--accent-text)' }}>
            {hasScanned ? '₹1,80,000' : '₹0'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Central Scholarship Leakage Prevented
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: hasScanned && totalViolations > 0 ? '#fbbf24' : 'var(--text-muted)', display: 'block' }}>
            Intake Quota Violations
          </span>
          <strong style={{ fontSize: '1.5rem', color: hasScanned && totalViolations > 0 ? '#fbbf24' : 'var(--text)' }}>
            {hasScanned ? `${totalViolations} Institution` : '0 Breaches'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Statutory AICTE Approval Cap
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Multi-Node Compliance</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--text)' }}>
            {hasScanned ? '91.4%' : '100%'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            SVNIT Pilot Network Index
          </span>
        </div>
      </div>

      {!hasScanned ? (
        <section className="card empty-state" style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border-strong)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>National Intelligence Engine Standing By</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto 20px' }}>
            Click <strong>"Run National Fraud & Intake Audit"</strong> to scan across SVNIT Surat, affiliated state universities, and private institutes for concurrent dual enrolments, scholarship poaching, and statutory intake overruns.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunFraudScan}
            disabled={loading}
          >
            {loading ? 'Running AICTE Intelligence Scan...' : '⚡ Run National Fraud & Intake Audit'}
          </button>
        </section>
      ) : (
        <div className="stack" style={{ display: 'grid', gap: 24 }}>
          {/* FILTER NAVIGATION TABS */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <button
              type="button"
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={() => setActiveTab('all')}
            >
              All Audit Results ({fraudAlerts.length + capacityReports.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'fraud' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={() => setActiveTab('fraud')}
            >
              Ghost Students & Dual Enrollment ({fraudAlerts.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'intake' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={() => setActiveTab('intake')}
            >
              Intake Capacity & Quotas ({capacityReports.length})
            </button>
          </div>

          {/* 1. DUAL ENROLLMENT / GHOST STUDENT SECTION */}
          {(activeTab === 'all' || activeTab === 'fraud') && (
            <section className="card" style={{ borderLeft: '4px solid #ef4444', border: '1px solid var(--border-strong)', borderLeftWidth: 4, borderLeftColor: '#ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="card-title" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🚨</span> Ghost Student & Dual Enrollment Alerts ({fraudAlerts.length})
                  </h2>
                  <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
                    Students concurrently registered across multiple institutions in the same academic session to claim duplicate DBT scholarships.
                  </p>
                </div>
                <Badge tone={fraudAlerts.length > 0 ? 'danger' : 'success'}>
                  {fraudAlerts.length > 0 ? 'SCHOLARSHIP FRAUD INTERCEPTED' : 'NO DUAL ENROLLMENT DETECTED'}
                </Badge>
              </div>

              {fraudAlerts.map((alert, idx) => {
                const isFrozen = !!frozenScholarships[alert.student_name]
                return (
                  <div
                    key={idx}
                    style={{
                      marginTop: 16,
                      padding: 18,
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
                          Candidate: {alert.student_name}
                        </h3>
                        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Linked APAAR ID: <code style={{ color: 'var(--accent-text)' }}>{alert.apaar_id || 'Not Assigned'}</code> • Admission Session: <strong>2024-2025</strong>
                        </p>
                      </div>
                      <Badge tone="danger">{alert.fraud_severity} FRAUD LEVEL</Badge>
                    </div>

                    <div style={{ marginTop: 14, padding: 12, background: 'rgba(239, 68, 68, 0.08)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <strong style={{ color: '#fca5a5', display: 'block', marginBottom: 6, fontSize: '0.88rem' }}>
                        Simultaneously Enrolled Federal Nodes:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: 'var(--text)' }}>
                        {alert.enrolled_institutions.map((inst: string, i: number) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            <code style={{ color: 'var(--accent-text)' }}>{inst}</code> ({INSTITUTION_NAMES[inst] || inst})
                            <br />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              Program: <strong>{alert.programs[i]}</strong> • Session: {alert.admission_years[i]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactive Enforcement Controls */}
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        background: isFrozen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                        borderRadius: 6,
                        border: `1px solid ${isFrozen ? 'var(--accent)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', color: isFrozen ? 'var(--accent-text)' : '#fca5a5' }}>
                        <strong>Enforcement Directive:</strong>{' '}
                        {isFrozen
                          ? '🔒 DBT Scholarship Disbursement Frozen by Nodal Officer · Case Transferred to AICTE Central Vigilance'
                          : alert.action}
                      </div>

                      <button
                        type="button"
                        className={`btn ${isFrozen ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '0.82rem',
                          background: isFrozen ? 'var(--surface)' : '#dc2626',
                          borderColor: isFrozen ? 'var(--border)' : '#ef4444',
                        }}
                        onClick={() => toggleFreezeScholarship(alert.student_name)}
                      >
                        {isFrozen ? '✓ Scholarship Disbursement Frozen' : '🛑 Freeze DBT Scholarship Disbursement'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {/* 2. INTAKE CAPACITY & STATUTORY QUOTA SECTION */}
          {(activeTab === 'all' || activeTab === 'intake') && (
            <section className="card" style={{ borderLeft: '4px solid #3b82f6', border: '1px solid var(--border-strong)', borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="card-title" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📊</span> Institution Approved Intake & Quota Monitor ({capacityReports.length})
                  </h2>
                  <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
                    Continuous statutory verification of enrolled students against AICTE approved limits and supernumerary caps (TFWS max 15%, NRI max 15%).
                  </p>
                </div>
                <Badge tone={totalViolations > 0 ? 'warning' : 'success'}>
                  {totalViolations > 0 ? `${totalViolations} STATUTORY OVERRUNS` : 'ALL INSTITUTIONS COMPLIANT'}
                </Badge>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 14 }}>
                {capacityReports.map((report, idx) => {
                  const isViolation = report.status !== 'COMPLIANT'
                  const isNoticeSent = !!dispatchedNotices[report.institution_id]
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: 16,
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius-md)',
                        border: isViolation ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>
                            {INSTITUTION_NAMES[report.institution_id] || report.institution_id}
                          </strong>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            AICTE Code: <code>{report.institution_id}</code> • Program: <strong>{report.program}</strong>
                          </div>
                        </div>
                        <Badge tone={isViolation ? 'warning' : 'success'}>
                          {isViolation ? '⚠️ STATUTORY BREACH DETECTED' : '✓ AICTE COMPLIANT'}
                        </Badge>
                      </div>

                      {/* Capacity Metrics */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: 12,
                          marginTop: 12,
                          padding: 12,
                          background: 'var(--surface)',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Approved Intake</span>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{report.approved_intake} seats</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Actual Enrolment</span>
                          <strong style={{ fontSize: '1.05rem', color: isViolation ? '#f87171' : 'var(--accent-text)' }}>
                            {report.actual_enrolment} students
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Quota Utilization</span>
                          <strong style={{ fontSize: '1.05rem', color: report.utilization_percentage > 100 && isViolation ? '#f87171' : 'var(--text)' }}>
                            {report.utilization_percentage}%
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Supernumerary (TFWS)</span>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{report.supernumerary_count} seats</strong>
                        </div>
                      </div>

                      {/* Violations notice */}
                      {report.violations && report.violations.length > 0 && (
                        <div style={{ marginTop: 12, padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          {report.violations.map((v: string, vi: number) => (
                            <div key={vi} style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                              ⚠️ {v}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Breach Dispatch Notice Action */}
                      {isViolation && (
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {isNoticeSent && (
                            <span style={{ fontSize: '0.82rem', color: 'var(--accent-text)' }}>
                              📩 Show-Cause Notice Dispatched to Registrar (AICTE/WRO/2026/QUOTA-{report.actual_enrolment})
                            </span>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            onClick={() => toggleDispatchNotice(report.institution_id)}
                          >
                            {isNoticeSent ? '✓ Re-send Show-Cause Notice' : '⚡ Issue Show-Cause Notice'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}

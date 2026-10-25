import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { detectDualEnrollment, auditIntakeCapacity, getStudents } from '../../lib/api/endpoints'
import type { DualEnrollmentAlert, StudentRecord } from '../../lib/api/types'

type AuditScenario = 'standard' | 'surge' | 'clean'

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
  'COEP-PUNE-004': 'COEP Technological University (Pune)',
  'PU-MUMBAI-088': 'Apex Global Private University (Mumbai)',
  'DTU-DELHI-003': 'Delhi Technological University (DTU Delhi)',
  'AU-NOIDA-077': 'Amity Technology Institute (Noida NCR)',
}

// Generates dynamic multi-institution pilot data based on chosen audit scenario & live Supabase students
function buildAictePilotAdmissions(scenario: AuditScenario, liveStudents: StudentRecord[]) {
  const records: any[] = []

  // 1. DUAL ENROLLMENT CASES (SCENARIO-DEPENDENT)
  if (scenario === 'standard') {
    // 1 Dual Enrollment Case: Vikram Malhotra across SVNIT and Private Univ Delhi
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
  } else if (scenario === 'surge') {
    // 3 Dual Enrollment Cases: ₹5,40,000 Central Scholarship Leakage
    records.push(
      // Case 1: Vikram Malhotra (SVNIT & PU-Delhi)
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
      },
      // Case 2: Rohan Verma (COEP Pune & Private Univ Mumbai)
      {
        student_id: 'STU-DUAL-02',
        institution_id: 'COEP-PUNE-004',
        first_name: 'Rohan',
        last_name: 'Verma',
        date_of_birth: '2003-04-14',
        apaar_id: '887766554433',
        program: 'B.Tech Computer Science',
        admission_year: 2024,
        approved_intake: 60,
        is_supernumerary: false,
        is_nri: false,
      },
      {
        student_id: 'STU-DUAL-02-B',
        institution_id: 'PU-MUMBAI-088',
        first_name: 'Rohan',
        last_name: 'Verma',
        date_of_birth: '2003-04-14',
        apaar_id: '887766554433',
        program: 'B.Tech Computer Science',
        admission_year: 2024,
        approved_intake: 60,
        is_supernumerary: false,
        is_nri: false,
      },
      // Case 3: Ananya Sharma (DTU Delhi & Amity Noida)
      {
        student_id: 'STU-DUAL-03',
        institution_id: 'DTU-DELHI-003',
        first_name: 'Ananya',
        last_name: 'Sharma',
        date_of_birth: '2003-11-22',
        apaar_id: '776655443322',
        program: 'B.Tech Electronics & Comm',
        admission_year: 2024,
        approved_intake: 60,
        is_supernumerary: false,
        is_nri: false,
      },
      {
        student_id: 'STU-DUAL-03-B',
        institution_id: 'AU-NOIDA-077',
        first_name: 'Ananya',
        last_name: 'Sharma',
        date_of_birth: '2003-11-22',
        apaar_id: '776655443322',
        program: 'B.Tech Electronics & Comm',
        admission_year: 2024,
        approved_intake: 60,
        is_supernumerary: false,
        is_nri: false,
      }
    )
  }
  // In 'clean' scenario: 0 dual enrollments!

  // 2. MERGE LIVE SUPABASE STUDENTS INTO SVNIT SURAT
  liveStudents.forEach((s, idx) => {
    records.push({
      student_id: s.student_id,
      institution_id: 'SVNIT-SURAT-001',
      first_name: s.first_name,
      last_name: s.last_name,
      date_of_birth: s.date_of_birth || '2004-03-12',
      apaar_id: s.apaar_id || `2401000000${idx}`,
      program: 'B.Tech Computer Science and Engineering',
      admission_year: s.admission_year || 2024,
      approved_intake: 60,
      is_supernumerary: false,
      is_nri: false,
    })
  })

  // 3. SVNIT SURAT BASELINE BATCH (60 Approved)
  const remainingSvnit = 62 - liveStudents.length
  for (let i = 1; i <= remainingSvnit; i++) {
    const isSuper = i > (60 - liveStudents.length) // 2 TFWS seats
    records.push({
      student_id: `SVNIT-CSE-${String(i).padStart(3, '0')}`,
      institution_id: 'SVNIT-SURAT-001',
      first_name: `Scholar_${i}`,
      last_name: 'SVNIT',
      date_of_birth: '2004-03-12',
      apaar_id: `24010000${String(i).padStart(4, '0')}`,
      program: 'B.Tech Computer Science and Engineering',
      admission_year: 2024,
      approved_intake: 60,
      is_supernumerary: isSuper,
      is_nri: false,
    })
  }

  // 4. APEX INSTITUTE JAIPUR - B.Tech Computer Science
  // Standard: 74/60 (+14 breach) | Surge: 82/60 (+22 critical breach) | Clean: 60/60 (Compliant)
  const apexCount = scenario === 'clean' ? 60 : scenario === 'surge' ? 82 : 74
  for (let i = 1; i <= apexCount; i++) {
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

  // 5. WESTERN TECHNICAL INSTITUTE PUNE - B.Tech Electronics
  // Standard: 48/60 (Compliant) | Surge: 75/60 (+15 breach) | Clean: 48/60 (Compliant)
  const wtiCount = scenario === 'surge' ? 75 : 48
  for (let i = 1; i <= wtiCount; i++) {
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
  const [scenario, setScenario] = useState<AuditScenario>('standard')
  const [fraudAlerts, setFraudAlerts] = useState<DualEnrollmentAlert[]>([])
  const [capacityReports, setCapacityReports] = useState<ProgramCapacityReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasScanned, setHasScanned] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'fraud' | 'intake'>('all')
  const [liveStudents, setLiveStudents] = useState<StudentRecord[]>([])

  // Interactive enforcement actions
  const [frozenScholarships, setFrozenScholarships] = useState<Record<string, boolean>>({})
  const [dispatchedNotices, setDispatchedNotices] = useState<Record<string, boolean>>({})

  // Fetch live Supabase students on mount
  useEffect(() => {
    getStudents('INST-AICTE-101')
      .then((data) => {
        if (data && data.length > 0) setLiveStudents(data)
      })
      .catch(() => {})
  }, [])

  async function handleRunFraudScan() {
    setLoading(true)
    setError('')
    try {
      const records = buildAictePilotAdmissions(scenario, liveStudents)
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

  // Dynamic Metrics Calculation from Backend Results
  const totalViolations = capacityReports.filter((r) => r.status !== 'COMPLIANT').length
  const totalFraudCases = fraudAlerts.length
  const subsidyProtectedAmount = totalFraudCases > 0
    ? totalFraudCases * 180000
    : scenario === 'clean'
    ? 540000
    : 0

  const compliancePercentage = capacityReports.length > 0
    ? Math.round(((capacityReports.length - totalViolations) / capacityReports.length) * 1000) / 10
    : 100

  return (
    <>
      <PageHeader
        title="AICTE Institutional Intelligence & Fraud Hunter"
        description="Statutory surveillance algorithms for cross-institution dual enrollment detection, ghost student prevention and intake quota compliance across all federal nodes."
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="field field-select" style={{ minWidth: 260 }}>
              <select
                className="select"
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value as AuditScenario)
                  setHasScanned(false)
                }}
              >
                <option value="standard">🟢 Scenario 1: SVNIT Pilot Baseline (1 Fraud, 1 Breach)</option>
                <option value="surge">🔴 Scenario 2: Admission Surge (3 Frauds, ₹5.4L Leakage, 2 Breaches)</option>
                <option value="clean">🛡️ Scenario 3: Post-Enforcement Clean Roster (0 Fraud, 100% Compliant)</option>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunFraudScan}
              disabled={loading}
            >
              {loading ? 'Running AICTE Intelligence Scan...' : '⚡ Run National Fraud & Intake Audit'}
            </button>
          </div>
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
          <strong style={{ fontSize: '1.5rem', color: hasScanned && totalFraudCases > 0 ? '#f87171' : hasScanned ? 'var(--accent-text)' : 'var(--text)' }}>
            {hasScanned ? `${totalFraudCases} Flagged` : 'Standing By'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            {totalFraudCases === 0 && hasScanned ? '✓ Zero Ghost Admissions' : 'Simultaneous Ghost Admissions'}
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-text)', display: 'block' }}>DBT Subsidy Protected</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--accent-text)' }}>
            {hasScanned ? `₹${subsidyProtectedAmount.toLocaleString('en-IN')}` : '₹0'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Central Scholarship Leakage Prevented
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: hasScanned && totalViolations > 0 ? '#fbbf24' : 'var(--text-muted)', display: 'block' }}>
            Intake Quota Violations
          </span>
          <strong style={{ fontSize: '1.5rem', color: hasScanned && totalViolations > 0 ? '#fbbf24' : hasScanned ? 'var(--accent-text)' : 'var(--text)' }}>
            {hasScanned ? (totalViolations > 0 ? `${totalViolations} Institutions` : '0 Breaches') : 'Standing By'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Statutory AICTE Approval Cap
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Multi-Node Compliance</span>
          <strong style={{ fontSize: '1.5rem', color: hasScanned && compliancePercentage === 100 ? 'var(--accent-text)' : hasScanned && compliancePercentage < 80 ? '#f87171' : 'var(--text)' }}>
            {hasScanned ? `${compliancePercentage}%` : '100%'}
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
            Select an audit scenario above and click <strong>"Run National Fraud & Intake Audit"</strong> to scan across SVNIT Surat ({liveStudents.length} live database students included), affiliated universities, and private hubs.
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
            <section className="card" style={{ borderLeft: '4px solid #ef4444', border: '1px solid var(--border-strong)', borderLeftWidth: 4, borderLeftColor: totalFraudCases > 0 ? '#ef4444' : 'var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="card-title" style={{ color: totalFraudCases > 0 ? '#f87171' : 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{totalFraudCases > 0 ? '🚨' : '✓'}</span> Ghost Student & Dual Enrollment Alerts ({fraudAlerts.length})
                  </h2>
                  <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
                    Students concurrently registered across multiple institutions in the same academic session to claim duplicate DBT scholarships.
                  </p>
                </div>
                <Badge tone={totalFraudCases > 0 ? 'danger' : 'success'}>
                  {totalFraudCases > 0 ? `${totalFraudCases} SCHOLARSHIP FRAUDS DETECTED` : '✓ NO DUAL ENROLLMENT (CLEAN)'}
                </Badge>
              </div>

              {fraudAlerts.length === 0 ? (
                <div style={{ marginTop: 16, padding: 18, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--accent-text)' }}>
                  🛡️ All student records across SVNIT Surat, IIT Delhi and state partner universities are authenticated with unique APAAR identities. Zero duplicate enrollments detected.
                </div>
              ) : (
                fraudAlerts.map((alert, idx) => {
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
                            ? '🔒 Central DBT Scholarship Disbursement Frozen by Nodal Officer · Case Escalated to Central Vigilance'
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
                })
              )}
            </section>
          )}

          {/* 2. INTAKE CAPACITY & STATUTORY QUOTA SECTION */}
          {(activeTab === 'all' || activeTab === 'intake') && (
            <section className="card" style={{ borderLeft: '4px solid #3b82f6', border: '1px solid var(--border-strong)', borderLeftWidth: 4, borderLeftColor: totalViolations > 0 ? '#3b82f6' : 'var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="card-title" style={{ color: totalViolations > 0 ? '#60a5fa' : 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { detectDualEnrollment, auditIntakeCapacity } from '../../lib/api/endpoints'
import type { DualEnrollmentAlert } from '../../lib/api/types'

// Sample data simulating cross-institution admission records
const SAMPLE_ADMISSIONS = [
  // Student 1 enrolled in TWO colleges simultaneously (FRAUD / DUAL ENROLLMENT)
  {
    student_id: 'STU-DUAL-01',
    institution_id: 'INST-IIT-DELHI-001',
    first_name: 'Vikram',
    last_name: 'Malhotra',
    date_of_birth: '2002-08-20',
    apaar_id: '998877665544',
    program: 'B.Tech Mechanical Engineering',
    admission_year: 2023,
    approved_intake: 60,
    is_supernumerary: false,
    is_nri: false,
  },
  {
    student_id: 'STU-DUAL-01-B',
    institution_id: 'INST-PRIVATE-UNIV-099', // Different college!
    first_name: 'Vikram',
    last_name: 'Malhotra',
    date_of_birth: '2002-08-20',
    apaar_id: '998877665544', // Same APAAR ID!
    program: 'B.Tech Mechanical Engineering',
    admission_year: 2023,
    approved_intake: 60,
    is_supernumerary: false,
    is_nri: false,
  },
  // Normal compliant student
  {
    student_id: 'STU-NORM-02',
    institution_id: 'INST-IIT-DELHI-001',
    first_name: 'Priya',
    last_name: 'Nair',
    date_of_birth: '2003-01-15',
    apaar_id: '112233445566',
    program: 'B.Tech Computer Science',
    admission_year: 2023,
    approved_intake: 60,
    is_supernumerary: true,
    is_nri: false,
  },
]

export default function AiInsightsPage() {
  const [fraudAlerts, setFraudAlerts] = useState<DualEnrollmentAlert[]>([])
  const [capacityReports, setCapacityReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRunFraudScan() {
    setLoading(true)
    setError('')
    try {
      const [duals, caps] = await Promise.all([
        detectDualEnrollment(SAMPLE_ADMISSIONS),
        auditIntakeCapacity(SAMPLE_ADMISSIONS),
      ])
      setFraudAlerts(duals || [])
      setCapacityReports(caps || [])
    } catch (err: any) {
      setError(err.message || 'Failed to execute AICTE Intelligence engine')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="AICTE Institutional Intelligence & Fraud Hunter"
        description="National algorithms for cross-institution dual enrollment detection, ghost student prevention and intake audit."
        actions={
          <button
            type="button"
            className="button button-primary"
            onClick={handleRunFraudScan}
            disabled={loading}
          >
            {loading ? 'Running AICTE Intelligence Scan...' : 'Run National Fraud & Intake Audit'}
          </button>
        }
      />

      {error && <p className="notice notice-danger">{error}</p>}

      {fraudAlerts.length === 0 && capacityReports.length === 0 ? (
        <section className="card empty-state">
          <h2>No Audit Performed Yet</h2>
          <p>
            Click "Run National Fraud & Intake Audit" to scan for concurrent multi-college enrollments and intake capacity violations.
          </p>
        </section>
      ) : (
        <div className="stack">
          {/* DUAL ENROLLMENT / GHOST STUDENT SECTION */}
          <section className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title" style={{ color: '#f87171' }}>
                  Ghost Student & Dual Enrollment Alerts ({fraudAlerts.length})
                </h2>
                <p className="card-sub">
                  Students concurrently enrolled across multiple institutions in the same admission period (Scholarship Fraud).
                </p>
              </div>
              <Badge tone={fraudAlerts.length > 0 ? 'danger' : 'success'}>
                {fraudAlerts.length > 0 ? 'SCHOLARSHIP FRAUD DETECTED' : 'NO DUAL ENROLLMENT'}
              </Badge>
            </div>

            {fraudAlerts.map((alert, idx) => (
              <div key={idx} style={{ marginTop: 16, padding: 16, background: '#18181b', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>Candidate: {alert.student_name}</h3>
                  <Badge tone="danger">{alert.fraud_severity}</Badge>
                </div>

                <p style={{ marginTop: 6, color: '#9ca3af' }}>
                  <strong>APAAR ID:</strong> <code>{alert.apaar_id || 'Not Assigned'}</code>
                </p>

                <div style={{ marginTop: 8 }}>
                  <strong style={{ color: '#fca5a5' }}>Simultaneously Enrolled Institutions:</strong>
                  <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                    {alert.enrolled_institutions.map((inst, i) => (
                      <li key={i}>
                        <code>{inst}</code> — Program: {alert.programs[i]} (Batch {alert.admission_years[i]})
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 12, padding: 8, background: '#450a0a', borderRadius: 4, color: '#fecaca', fontSize: '0.9em' }}>
                  <strong>Enforcement Action:</strong> {alert.action}
                </div>
              </div>
            ))}
          </section>

          {/* INTAKE CAPACITY & STATUTORY QUOTA SECTION */}
          <section className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <h2 className="card-title" style={{ color: '#60a5fa' }}>
              Institution Approved Intake & Quota Monitor
            </h2>
            <p className="card-sub">
              Audits actual enrolments against AICTE statutory thresholds (Supernumerary max 15%, NRI max 15%).
            </p>

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              {capacityReports.map((report, idx) => (
                <div key={idx} style={{ padding: 12, background: '#18181b', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Institution:</strong> <code>{report.institution_id}</code> | <strong>Program:</strong> {report.program}
                    </div>
                    <Badge tone={report.status === 'COMPLIANT' ? 'success' : 'danger'}>
                      {report.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: '0.9em', color: '#9ca3af' }}>
                    <span>Approved Intake: <strong>{report.approved_intake}</strong></span>
                    <span>Actual Enrolment: <strong>{report.actual_enrolment}</strong></span>
                    <span>Utilization: <strong>{report.utilization_percentage}%</strong></span>
                    <span>Supernumerary: <strong>{report.supernumerary_count}</strong></span>
                  </div>

                  {report.violations && report.violations.length > 0 && (
                    <div style={{ marginTop: 8, color: '#f87171' }}>
                      {report.violations.map((v: string, vi: number) => (
                        <div key={vi}>⚠️ {v}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
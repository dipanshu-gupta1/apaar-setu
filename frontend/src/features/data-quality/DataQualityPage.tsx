import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { runQualityAndDuplicateCheck } from '../../lib/api/endpoints'
import type { QualityAndDuplicateReport, StudentRecord } from '../../lib/api/types'

const SAMPLE_RECORDS: StudentRecord[] = [
  {
    student_id: 'STU-001',
    institution_id: 'INST-AICTE-101',
    apaar_id: '987654321012',
    first_name: 'Rahul',
    last_name: 'Sharma',
    date_of_birth: '2003-05-14',
    email: 'rahul.sharma@example.edu',
    phone: '9876543210',
    program: 'B.Tech Computer Science',
    admission_year: 2021,
  },
  {
    student_id: 'STU-002',
    institution_id: 'INST-AICTE-101',
    apaar_id: 'INVALID_ID_99', // Triggers APAAR format anomaly
    first_name: 'Rahul',
    last_name: 'Sharma', // Triggers duplicate detection with STU-001
    date_of_birth: '2003-05-14',
    email: 'rahul.sharma@example.edu',
    phone: '9876543210',
    program: 'B.Tech CS',
    admission_year: 2021,
  },
]

export default function DataQualityPage() {
  const [reports, setReports] = useState<QualityAndDuplicateReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRunMLAudit() {
    setLoading(true)
    setError('')
    try {
      const data = await runQualityAndDuplicateCheck(SAMPLE_RECORDS)
      setReports(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to connect to ML service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="ML Data Quality & Anomaly Detection"
        description="Run trained AICTE ML models to detect dirty records, duplicate candidates, and fraud."
        actions={
          <button
            type="button"
            className="button button-primary"
            onClick={handleRunMLAudit}
            disabled={loading}
          >
            {loading ? 'Analyzing with ML Model...' : 'Run ML Anomaly Audit'}
          </button>
        }
      />

      {error && <p className="notice notice-danger">{error}</p>}

      {reports.length === 0 ? (
        <section className="card empty-state">
          <h2>No Audit Run Yet</h2>
          <p>Click "Run ML Anomaly Audit" to evaluate student records against trained validity models.</p>
        </section>
      ) : (
        <div className="stack">
          {reports.map((rep) => {
            const issues = rep.quality_issues || []
            const duplicates = rep.duplicate_candidates || []

            return (
              <div key={rep.student_id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Student Record: <code>{rep.student_id}</code></h3>
                  <div>
                    {rep.has_critical_issues ? (
                      <Badge tone="danger">CRITICAL ANOMALY</Badge>
                    ) : issues.length > 0 ? (
                      <Badge tone="warning">QUALITY WARNING</Badge>
                    ) : (
                      <Badge tone="success">VALID RECORD</Badge>
                    )}
                  </div>
                </div>

                <p style={{ marginTop: 8, color: '#aaa' }}>{rep.summary}</p>

                {issues.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Flagged Quality & Anomaly Issues ({issues.length}):</strong>
                    <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                      {issues.map((issue, idx) => (
                        <li
                          key={idx}
                          style={{
                            color: issue.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
                            marginBottom: 4,
                          }}
                        >
                          <strong>[{issue.severity}] {issue.field}:</strong> {issue.message} <em>({issue.issue_code})</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {duplicates.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong style={{ color: '#fb923c' }}>
                      Duplicate Match Candidates ({duplicates.length}) [Human Review Required]:
                    </strong>
                    <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                      {duplicates.map((dup, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          Matched Student: <code>{dup.matched_student_id}</code> | Match Score:{' '}
                          <strong>{(dup.overall_score * 100).toFixed(1)}%</strong> ({dup.confidence_tier} Confidence)
                          <div style={{ fontSize: '0.85em', color: '#9ca3af' }}>Signals: {dup.explanation}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
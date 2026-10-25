import { useEffect, useState, type FormEvent } from 'react'
import { Badge, type Tone } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  verifyStudentRecord,
  getCertificateBadge,
  getStudents,
  updateStudentStatus,
} from '../../lib/api/endpoints'
import type { VerifiedStudentBadge, CertificateQrPayload } from '../../lib/api/types'

type Decision = 'verified' | 'correction_needed' | 'failed'
type ActiveTab = 'public_verify' | 'officer_queue'

const DECISIONS: { value: Decision; label: string; hint: string }[] = [
  { value: 'verified', label: 'Approve & Verify', hint: 'The data matches official academic records.' },
  { value: 'correction_needed', label: 'Request Correction', hint: 'Send back to the institution to fix errors.' },
  { value: 'failed', label: 'Reject Record', hint: 'Fraudulent or unverifiable student record.' },
]

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('officer_queue')

  // Live Backend Verification State
  const [identifierInput, setIdentifierInput] = useState('987654321012')
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [verifyBadge, setVerifyBadge] = useState<VerifiedStudentBadge | null>(null)
  const [qrPayload, setQrPayload] = useState<CertificateQrPayload | null>(null)
  const [verifyError, setVerifyError] = useState('')

  // Officer Queue (Live Students from Supabase)
  const [queueStudents, setQueueStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [choice, setChoice] = useState<Decision>('verified')
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPendingStudents()
  }, [])

  async function fetchPendingStudents() {
    setLoadingQueue(true)
    try {
      const allStudents = await getStudents('INST-AICTE-101')
      // Filter students who are pending review
      const pending = allStudents.filter((s) => s.status === 'pending')
      setQueueStudents(pending)
      if (pending.length > 0) {
        setSelectedStudent(pending[0])
      } else {
        setSelectedStudent(null)
      }
    } catch {
      // Fallback
    } finally {
      setLoadingQueue(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!identifierInput.trim()) return
    setLoadingVerify(true)
    setVerifyError('')
    try {
      const badgeData = await verifyStudentRecord(identifierInput.trim())
      setVerifyBadge(badgeData)

      const qrData = await getCertificateBadge(badgeData.student_id, identifierInput.trim())
      setQrPayload(qrData)
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to verify identifier against central registry')
      setVerifyBadge(null)
      setQrPayload(null)
    } finally {
      setLoadingVerify(false)
    }
  }

  async function handleDecisionSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedStudent) return

    setSubmittingDecision(true)
    setMessage('')
    try {
      await updateStudentStatus(selectedStudent.student_id, choice)
      setMessage(`Decision recorded: ${selectedStudent.first_name} ${selectedStudent.last_name} marked as "${choice}".`)
      await fetchPendingStudents()
    } catch (err: any) {
      alert(`Failed to record decision: ${err.message}`)
    } finally {
      setSubmittingDecision(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Student Record Verification & Trust Portal"
        description="Public employer authentication registry with anti-tamper QR code generation & live officer review queue."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`button ${activeTab === 'officer_queue' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('officer_queue')}
            >
              Officer Queue ({queueStudents.length})
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'public_verify' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('public_verify')}
            >
              Public / Employer Verification & QR
            </button>
          </div>
        }
      />

      {message && <p className="notice notice-success" role="status" style={{ marginBottom: 16 }}>{message}</p>}

      {/* TAB 1: LIVE OFFICER QUEUE */}
      {activeTab === 'officer_queue' && (
        <>
          {loadingQueue ? (
            <section className="card empty-state">
              <p>Loading pending verification cases from Supabase...</p>
            </section>
          ) : queueStudents.length === 0 ? (
            <section className="card empty-state">
              <Icon name="shield" size={28} />
              <h2>The queue is clear!</h2>
              <p>No student records are currently waiting for verification. All records are approved or processed.</p>
            </section>
          ) : (
            <div className="queue">
              <div className="stack">
                <section>
                  <h2 className="section-title">Pending Students ({queueStudents.length})</h2>
                  <ul className="case-list">
                    {queueStudents.map((s) => (
                      <li key={s.student_id}>
                        <button
                          type="button"
                          className={`case-item ${selectedStudent?.student_id === s.student_id ? 'is-selected' : ''}`}
                          onClick={() => setSelectedStudent(s)}
                        >
                          <span className="case-top">
                            <span className="case-name">{s.first_name} {s.last_name}</span>
                            <Badge tone="warning">Pending Review</Badge>
                          </span>
                          <span className="case-meta">
                            ID: {s.student_id} • {s.program || 'Engineering'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {selectedStudent && (
                <section className="card">
                  <div className="case-top">
                    <h2 className="card-title">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                    <Badge tone="warning">Pending Review</Badge>
                  </div>
                  <p className="card-sub">Student ID: {selectedStudent.student_id}</p>

                  <div style={{ marginTop: 12, padding: 12, background: '#18181b', borderRadius: 8 }}>
                    <div><strong>Academic Program:</strong> {selectedStudent.program}</div>
                    <div style={{ marginTop: 4 }}><strong>APAAR ID:</strong> <code>{selectedStudent.apaar_id || 'Not Assigned'}</code></div>
                    <div style={{ marginTop: 4 }}><strong>Date of Birth:</strong> {selectedStudent.date_of_birth}</div>
                    <div style={{ marginTop: 4 }}><strong>Enrollment Number:</strong> {selectedStudent.enrollment_number || 'Pending'}</div>
                  </div>

                  <form onSubmit={handleDecisionSubmit} className="decision-form" noValidate style={{ marginTop: 20 }}>
                    <div className="choices">
                      {DECISIONS.map((d) => (
                        <label key={d.value} className="choice">
                          <input
                            type="radio"
                            name="decision"
                            value={d.value}
                            checked={choice === d.value}
                            onChange={() => setChoice(d.value)}
                          />
                          <div>
                            <strong>{d.label}</strong>
                            <p>{d.hint}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button type="submit" className="button button-primary" style={{ marginTop: 16 }} disabled={submittingDecision}>
                      {submittingDecision ? 'Updating Supabase Cloud...' : 'Record Decision & Sync'}
                    </button>
                  </form>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: PUBLIC / EMPLOYER VERIFICATION */}
      {activeTab === 'public_verify' && (
        <div className="stack">
          <section className="card">
            <h2 className="card-title">Live AICTE Academic Registry Background Check</h2>
            <p className="card-sub">
              Enter any 12-digit APAAR ID or Student UUID to instantly verify credentials against the central registry.
            </p>

            <form onSubmit={handleVerify} style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                style={{ maxWidth: 360 }}
                placeholder="Enter 12-digit APAAR ID (e.g. 987654321012)"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
              />
              <button type="submit" className="button button-primary" disabled={loadingVerify}>
                {loadingVerify ? 'Authenticating with AICTE...' : 'Verify Authenticity'}
              </button>
            </form>

            {verifyError && <p className="notice notice-danger" style={{ marginTop: 12 }}>{verifyError}</p>}
          </section>

          {verifyBadge && (
            <div className="card" style={{ borderLeft: '4px solid #10b981', background: '#0a1612' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Badge tone="success">{verifyBadge.verification_status}</Badge>
                  <span style={{ marginLeft: 12, color: '#10b981', fontWeight: 600 }}>
                    {verifyBadge.aicte_approval_status}
                  </span>
                </div>
                <small style={{ color: '#9ca3af' }}>Verified: {verifyBadge.verified_at}</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 16 }}>
                <div>
                  <small style={{ color: '#9ca3af' }}>Candidate Name</small>
                  <h3 style={{ margin: 0 }}>{verifyBadge.student_name}</h3>
                </div>
                <div>
                  <small style={{ color: '#9ca3af' }}>Masked APAAR ID (DPDP Act)</small>
                  <p style={{ margin: 0, fontWeight: 'bold', letterSpacing: 1 }}>{verifyBadge.apaar_id_masked}</p>
                </div>
                <div>
                  <small style={{ color: '#9ca3af' }}>Institution</small>
                  <p style={{ margin: 0 }}>{verifyBadge.institution_name}</p>
                </div>
                <div>
                  <small style={{ color: '#9ca3af' }}>Program & Year</small>
                  <p style={{ margin: 0 }}>{verifyBadge.program} (Class of {verifyBadge.admission_year})</p>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1f2937' }}>
                <small style={{ color: '#9ca3af' }}>Cryptographic Digital Seal (SHA-256)</small>
                <div style={{ fontFamily: 'monospace', color: '#6ee7b7', wordBreak: 'break-all', marginTop: 4 }}>
                  {verifyBadge.digital_signature_hash}
                </div>
                <small style={{ color: '#6b7280' }}>Authority: {verifyBadge.verification_authority}</small>
              </div>

              {qrPayload && (
                <div style={{ marginTop: 20, padding: 16, background: '#111827', borderRadius: 8, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload.qr_encoded_text)}`}
                    alt="AICTE Anti-Tamper QR Code"
                    style={{ width: 120, height: 120, background: '#fff', padding: 4, borderRadius: 4 }}
                  />
                  <div>
                    <h4 style={{ margin: 0, color: '#f3f4f6' }}>Official Degree / Marksheet Verification QR</h4>
                    <p style={{ margin: '6px 0', fontSize: '0.85em', color: '#9ca3af' }}>
                      {qrPayload.format_instructions}
                    </p>
                    <code style={{ fontSize: '0.75em', color: '#93c5fd', wordBreak: 'break-all' }}>
                      {qrPayload.anti_tamper_signature}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
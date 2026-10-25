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
  const [activeTab, setActiveTab] = useState<ActiveTab>('public_verify')

  // Live Backend Verification State
  const [identifierInput, setIdentifierInput] = useState('')
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [verifyBadge, setVerifyBadge] = useState<VerifiedStudentBadge | null>(null)
  const [qrPayload, setQrPayload] = useState<CertificateQrPayload | null>(null)
  const [verifyError, setVerifyError] = useState('')

  // Officer Queue (Live Students from Supabase)
  const [queueStudents, setQueueStudents] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [choice, setChoice] = useState<Decision>('verified')
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPendingStudents()
    fetchRegisteredStudents()
  }, [])

  async function fetchPendingStudents() {
    setLoadingQueue(true)
    try {
      const all = await getStudents('INST-AICTE-101')
      const pending = all.filter((s) => s.status === 'pending')
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

  async function fetchRegisteredStudents() {
    try {
      const all = await getStudents('INST-AICTE-101')
      if (all && all.length > 0) {
        setAllStudents(all)
      }
    } catch {
      // ignore
    }
  }

  // Executes verification ONLY when triggered by user
  async function executeVerification(idToVerify: string) {
    const cleanId = idToVerify.trim()
    if (!cleanId) {
      setVerifyError('Please enter a valid 12-digit APAAR ID or Student ID.')
      return
    }
    setLoadingVerify(true)
    setVerifyError('')
    try {
      const badgeData = await verifyStudentRecord(cleanId)
      setVerifyBadge(badgeData)

      // SECURITY PROTOCOL: Generate anti-tamper QR ONLY if candidate is fully VERIFIED_AUTHENTIC
      if (badgeData.verification_status === 'VERIFIED_AUTHENTIC') {
        const qrData = await getCertificateBadge(badgeData.student_id, cleanId)
        setQrPayload(qrData)
      } else {
        // Withhold QR generation for unverified / correction_needed / flagged records
        setQrPayload(null)
      }
    } catch (err: any) {
      setVerifyError(err.message || `No record found in central registry for: ${cleanId}`)
      setVerifyBadge(null)
      setQrPayload(null)
    } finally {
      setLoadingVerify(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    await executeVerification(identifierInput)
  }

  function handleReset() {
    setIdentifierInput('')
    setVerifyBadge(null)
    setQrPayload(null)
    setVerifyError('')
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

  const quickPills = allStudents.length > 0
    ? allStudents.slice(0, 5).map((s) => ({
        name: `${s.first_name} ${s.last_name}`,
        id: s.apaar_id || s.student_id,
        status: s.status,
      }))
    : [
        { name: 'Dipanshu Gupta', id: '123456785234', status: 'verified' },
        { name: 'Vibha Manocha', id: '987654322321', status: 'correction_needed' },
        { name: 'Mukul Sahu', id: '876543217564', status: 'verified' },
        { name: 'Sonu Mittal', id: '998877665544', status: 'verified' },
      ]

  const badgeTone: Tone =
    verifyBadge?.verification_status === 'VERIFIED_AUTHENTIC'
      ? 'success'
      : verifyBadge?.verification_status === 'CORRECTION_REQUIRED'
      ? 'warning'
      : verifyBadge?.verification_status === 'VERIFICATION_FLAGGED'
      ? 'danger'
      : 'info'

  return (
    <>
      <PageHeader
        title="Student Record Verification & Trust Portal"
        description="Public employer authentication registry with anti-tamper QR code generation & live officer review queue."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn ${activeTab === 'public_verify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('public_verify')}
            >
              Public / Employer Verification & QR
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'officer_queue' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('officer_queue')}
            >
              Officer Review Queue ({queueStudents.length})
            </button>
          </div>
        }
      />

      {message && <p className="notice notice-success" role="status" style={{ marginBottom: 16 }}>{message}</p>}

      {/* ===================================================================== */}
      {/* TAB 1: PUBLIC / EMPLOYER VERIFICATION & QR CODE BADGE */}
      {/* ===================================================================== */}
      {activeTab === 'public_verify' && (
        <div className="stack" style={{ display: 'grid', gap: 20 }}>
          <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', color: 'var(--text)' }}>
              Live AICTE Academic Registry Background Check
            </h2>
            <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
              Enter any 12-digit APAAR ID or Student UUID to query live credentials against the central Supabase PostgreSQL registry.
            </p>

            {/* Quick-Verify Student Pills */}
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                ⚡ Select SVNIT Student to Populate APAAR ID:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {quickPills.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 12px',
                      background: identifierInput === p.id ? 'var(--accent-soft)' : 'var(--surface)',
                      borderColor: identifierInput === p.id ? 'var(--accent)' : 'var(--border)',
                      color: identifierInput === p.id ? 'var(--accent-text)' : 'var(--text)',
                    }}
                    onClick={() => {
                      setIdentifierInput(p.id)
                      setVerifyBadge(null)
                      setQrPayload(null)
                      setVerifyError('')
                    }}
                  >
                    👤 {p.name} <code style={{ fontSize: '0.78em', marginLeft: 4, opacity: 0.8 }}>({p.id})</code>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleVerify} style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input"
                style={{ maxWidth: 420, flex: 1, minWidth: 260 }}
                placeholder="Enter 12-digit APAAR ID (e.g. 123456785234) or Student ID"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={loadingVerify}>
                {loadingVerify ? 'Authenticating with AICTE...' : '🔍 Verify Authenticity'}
              </button>
              {verifyBadge && (
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  Clear
                </button>
              )}
            </form>

            {verifyError && (
              <div className="notice notice-danger" style={{ marginTop: 14 }}>
                <strong>Verification Failed:</strong> {verifyError}
              </div>
            )}
          </section>

          {/* INITIAL WAITING STATE (Before clicking Verify) */}
          {!verifyBadge && !loadingVerify && (
            <section className="card empty-state" style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-strong)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: 6, color: 'var(--text)' }}>
                Verification Gateway Standing By
              </h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
                Enter an APAAR ID above and click <strong>"Verify Authenticity"</strong> to authenticate against the live central registry and generate the official anti-tamper QR seal.
              </p>
            </section>
          )}

          {/* VERIFIED BADGE CARD */}
          {verifyBadge && (
            <div
              className="card"
              style={{
                border: '1px solid var(--border-strong)',
                borderLeft: `4px solid ${
                  verifyBadge.verification_status === 'VERIFIED_AUTHENTIC'
                    ? '#10b981'
                    : verifyBadge.verification_status === 'CORRECTION_REQUIRED'
                    ? '#f59e0b'
                    : '#ef4444'
                }`,
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge tone={badgeTone}>{verifyBadge.verification_status}</Badge>
                  <span style={{ color: badgeTone === 'success' ? 'var(--accent-text)' : '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>
                    {verifyBadge.aicte_approval_status}
                  </span>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>Verified: {verifyBadge.verified_at}</small>
              </div>

              {/* Student Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Candidate Name</small>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>{verifyBadge.student_name}</h3>
                  <code style={{ fontSize: '0.78rem', color: 'var(--accent-text)', marginTop: 4, display: 'inline-block' }}>
                    Student ID: {verifyBadge.student_id}
                  </code>
                </div>

                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Masked APAAR ID (DPDP Act)</small>
                  <strong style={{ fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--accent-text)' }}>
                    {verifyBadge.apaar_id_masked}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Digitally Protected Zero-Knowledge ID
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Academic Institution</small>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)' }}>{verifyBadge.institution_name}</p>
                </div>

                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Program & Enrollment</small>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)' }}>
                    <strong>{verifyBadge.program}</strong>
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                    Roll: <code>{verifyBadge.enrollment_number}</code> • Class of {verifyBadge.admission_year}
                  </span>
                </div>
              </div>

              {/* Cryptographic Hash Seal */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Cryptographic Digital Seal (SHA-256)</small>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)', wordBreak: 'break-all', marginTop: 4, fontSize: '0.85rem' }}>
                  {verifyBadge.digital_signature_hash}
                </div>
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Authority: {verifyBadge.verification_authority}
                </small>
              </div>

              {/* CASE 1: VERIFIED AUTHENTIC -> DISPLAY OFFICIAL PRINTABLE QR */}
              {verifyBadge.verification_status === 'VERIFIED_AUTHENTIC' && qrPayload && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'var(--surface-2)',
                    borderRadius: 8,
                    border: '1px solid var(--accent)',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload.qr_encoded_text)}`}
                    alt="AICTE Anti-Tamper QR Code"
                    style={{ width: 120, height: 120, background: '#fff', padding: 4, borderRadius: 6 }}
                  />
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Badge tone="success">CERTIFICATE ISSUABLE</Badge>
                      <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>
                        Official Degree / Marksheet Verification QR
                      </h4>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                      {qrPayload.format_instructions}
                    </p>
                    <code style={{ fontSize: '0.78em', color: 'var(--accent-text)', wordBreak: 'break-all', display: 'block' }}>
                      {qrPayload.anti_tamper_signature}
                    </code>
                  </div>
                </div>
              )}

              {/* CASE 2: CORRECTION REQUIRED -> QR CODE SECURITY WITHHELD NOTICE */}
              {verifyBadge.verification_status === 'CORRECTION_REQUIRED' && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '2.2rem' }}>⚠️</div>
                  <div>
                    <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '1rem' }}>
                      🔒 Official Degree QR Code Withheld by AICTE Protocol
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Official degree & marksheet verification QR code generation is <strong>locked</strong> because this candidate's record has an active discrepancy ticket. Degree issuance is suspended until the Institutional Registrar approves corrections in the Corrections Desk.
                    </p>
                  </div>
                </div>
              )}

              {/* CASE 3: VERIFICATION FLAGGED / FAILED -> PERMANENT SECURITY BLOCK */}
              {verifyBadge.verification_status === 'VERIFICATION_FLAGGED' && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '2.2rem' }}>🛑</div>
                  <div>
                    <h4 style={{ margin: 0, color: '#f87171', fontSize: '1rem' }}>
                      🛑 Security Alert: Credential QR Blocked
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      This record has failed statutory verification or flagged for demographic mismatch. Issuance of digitally signed degree QR credentials has been suspended pending Central Vigilance review.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE OFFICER REVIEW QUEUE */}
      {/* ===================================================================== */}
      {activeTab === 'officer_queue' && (
        <>
          {loadingQueue ? (
            <section className="card empty-state">
              <p>Loading pending verification cases from Supabase...</p>
            </section>
          ) : queueStudents.length === 0 ? (
            <section className="card empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Icon name="shield" size={28} />
              <h2 style={{ marginTop: 12 }}>The review queue is clear!</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                No student records are currently waiting for verification. All records are approved or processed.
              </p>
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
                <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
                  <div className="case-top">
                    <h2 className="card-title">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                    <Badge tone="warning">Pending Review</Badge>
                  </div>
                  <p className="card-sub">Student ID: {selectedStudent.student_id}</p>

                  <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
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

                    <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={submittingDecision}>
                      {submittingDecision ? 'Updating Supabase Cloud...' : 'Record Decision & Sync'}
                    </button>
                  </form>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
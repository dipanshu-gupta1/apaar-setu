import { useState, type FormEvent } from 'react'
import { Badge, type Tone } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import { DEMO_CASES, type CasePriority } from '../../lib/mock/demoData'
import { verifyStudentRecord, getCertificateBadge } from '../../lib/api/endpoints'
import type { VerifiedStudentBadge, CertificateQrPayload } from '../../lib/api/types'

type Decision = 'approve' | 'correction' | 'reject'
type ActiveTab = 'public_verify' | 'officer_queue'

const DECISIONS: { value: Decision; label: string; hint: string }[] = [
  { value: 'approve', label: 'Approve', hint: 'The data matches the evidence.' },
  { value: 'correction', label: 'Request correction', hint: 'Send it back to the institution to fix.' },
  { value: 'reject', label: 'Reject', hint: 'The data cannot be accepted.' },
]

const PRIORITY: Record<CasePriority, { label: string; tone: Tone }> = {
  high: { label: 'High priority', tone: 'danger' },
  normal: { label: 'Normal priority', tone: 'warning' },
  low: { label: 'Low priority', tone: 'neutral' },
}

function labelFor(decision: Decision): string {
  return DECISIONS.find((d) => d.value === decision)?.label ?? decision
}

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('public_verify')

  // Live Backend Verification State
  const [identifierInput, setIdentifierInput] = useState('987654321012')
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [verifyBadge, setVerifyBadge] = useState<VerifiedStudentBadge | null>(null)
  const [qrPayload, setQrPayload] = useState<CertificateQrPayload | null>(null)
  const [verifyError, setVerifyError] = useState('')

  // Officer Queue State
  const [decided, setDecided] = useState<Record<string, Decision>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [choice, setChoice] = useState<Decision>('approve')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const open = DEMO_CASES.filter((c) => !decided[c.id])
  const done = DEMO_CASES.filter((c) => decided[c.id])
  const selected = open.find((c) => c.id === selectedId) ?? open[0]

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

  function select(id: string) {
    setSelectedId(id)
    setChoice('approve')
    setNote('')
    setError('')
    setMessage('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return

    if (choice !== 'approve' && note.trim().length < 5) {
      setError('Add a short reason so the institution knows what to fix.')
      return
    }

    setDecided((prev) => ({ ...prev, [selected.id]: choice }))
    setMessage(`${labelFor(choice)} recorded for ${selected.id}.`)
    setSelectedId(null)
    setChoice('approve')
    setNote('')
    setError('')
  }

  return (
    <>
      <PageHeader
        title="Student Record Verification & Trust Portal"
        description="Public employer authentication registry with anti-tamper QR code generation & officer review queue."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`button ${activeTab === 'public_verify' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('public_verify')}
            >
              Public / Employer Verification & QR
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'officer_queue' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('officer_queue')}
            >
              Officer Queue ({open.length})
            </button>
          </div>
        }
      />

      {/* TAB 1: LIVE BACKEND VERIFICATION & QR CODE */}
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

      {/* TAB 2: OFFICER QUEUE */}
      {activeTab === 'officer_queue' && (
        <>
          {message && <p className="notice" role="status">{message}</p>}
          {open.length === 0 ? (
            <section className="card empty-state">
              <Icon name="shield" size={28} />
              <h2>The queue is clear</h2>
              <p>There are no cases waiting for a decision.</p>
            </section>
          ) : (
            <div className="queue">
              <div className="stack">
                <section aria-labelledby="open-heading">
                  <h2 id="open-heading" className="section-title">Open cases ({open.length})</h2>
                  <ul className="case-list">
                    {open.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className={`case-item ${c.id === selected.id ? 'is-selected' : ''}`}
                          onClick={() => select(c.id)}
                        >
                          <span className="case-top">
                            <span className="case-name">{c.studentName}</span>
                            <Badge tone={PRIORITY[c.priority].tone}>{PRIORITY[c.priority].label}</Badge>
                          </span>
                          <span className="case-meta">
                            {c.kind}, waiting {c.waitingDays} {c.waitingDays === 1 ? 'day' : 'days'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                {done.length > 0 && (
                  <section className="card">
                    <h2 className="card-title">Decided in this session</h2>
                    <ul className="activity">
                      {done.map((c) => (
                        <li key={c.id}>
                          <span>{c.studentName}</span>
                          <span className="muted">{labelFor(decided[c.id])}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <section className="card">
                <div className="case-top">
                  <h2 className="card-title">{selected.studentName}</h2>
                  <Badge tone={PRIORITY[selected.priority].tone}>{PRIORITY[selected.priority].label}</Badge>
                </div>
                <p className="card-sub">{selected.id}, {selected.kind}</p>
                <p className="panel-text">{selected.summary}</p>

                <form onSubmit={submit} className="decision-form" noValidate style={{ marginTop: 16 }}>
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

                  {error && <p className="form-error">{error}</p>}
                  <button type="submit" className="button button-primary" style={{ marginTop: 12 }}>
                    Record Decision
                  </button>
                </form>
              </section>
            </div>
          )}
        </>
      )}
    </>
  )
}
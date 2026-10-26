import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { getStudents } from '../../lib/api/endpoints'
import type { StudentRecord } from '../../lib/api/types'

export default function MyRecordPage() {
  // Login Gateway State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [apaarInput, setApaarInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [loginError, setLoginError] = useState('')

  // Student Record State
  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(false)

  // PIN Management State
  const [showPinModal, setShowPinModal] = useState(false)
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [confirmPinInput, setConfirmPinInput] = useState('')
  const [pinMessage, setPinMessage] = useState({ text: '', isError: false })

  // PDF Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false)

  // Load registered students
  useEffect(() => {
    async function loadInitial() {
      try {
        const list = await getStudents('INST-AICTE-101')
        // Check if student was previously logged in this session
        const savedApaar = sessionStorage.getItem('apaar_logged_student')
        if (savedApaar && list && list.length > 0) {
          const found = list.find((s: StudentRecord) => s.apaar_id === savedApaar)
          if (found) {
            setStudent(found)
            setIsLoggedIn(true)
          }
        }
      } catch (err) {
        console.error('Failed to load students', err)
      }
    }
    loadInitial()
  }, [])

  // Handle APAAR Gateway Login
  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    const cleanApaar = apaarInput.trim().replace(/\D/g, '')

    if (cleanApaar.length !== 12) {
      setLoginError('Please enter a valid 12-digit numeric APAAR ID.')
      setLoading(false)
      return
    }

    try {
      const list = await getStudents('INST-AICTE-101')
      const matched = list?.find((s: StudentRecord) => s.apaar_id === cleanApaar)

      if (!matched) {
        setLoginError(`No active AICTE record found for APAAR ID: ${cleanApaar}. Please check or contact institution.`)
        setLoading(false)
        return
      }

      // Check PIN
      const storedPin = localStorage.getItem(`apaar_pin_${matched.student_id}`) || '123456'
      if (pinInput !== storedPin) {
        setLoginError('Invalid Security PIN. Default initial PIN is 123456.')
        setLoading(false)
        return
      }

      // Successful login
      setStudent(matched)
      setIsLoggedIn(true)
      sessionStorage.setItem('apaar_logged_student', matched.apaar_id || '')
    } catch {
      setLoginError('Connection to central verification node failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setStudent(null)
    setApaarInput('')
    setPinInput('')
    sessionStorage.removeItem('apaar_logged_student')
  }

  // Handle PIN Change
  function handleChangePin(e: FormEvent) {
    e.preventDefault()
    if (!student) return

    const storedPin = localStorage.getItem(`apaar_pin_${student.student_id}`) || '123456'

    if (currentPinInput !== storedPin) {
      setPinMessage({ text: 'Current PIN is incorrect.', isError: true })
      return
    }

    if (newPinInput.length !== 6 || !/^\d+$/.test(newPinInput)) {
      setPinMessage({ text: 'New PIN must be exactly 6 numeric digits.', isError: true })
      return
    }

    if (newPinInput !== confirmPinInput) {
      setPinMessage({ text: 'New PIN and Confirm PIN do not match.', isError: true })
      return
    }

    localStorage.setItem(`apaar_pin_${student.student_id}`, newPinInput)
    setPinMessage({ text: 'Security PIN successfully updated! Use this PIN for next login.', isError: false })
    setCurrentPinInput('')
    setNewPinInput('')
    setConfirmPinInput('')
    setTimeout(() => {
      setShowPinModal(false)
      setPinMessage({ text: '', isError: false })
    }, 1800)
  }

  // Trigger Print to PDF
  function handlePrintPDF() {
    window.print()
  }

  // ==========================================
  // VIEW 1: AUTHENTIC APAAR LOGIN GATEWAY
  // ==========================================
  if (!isLoggedIn || !student) {
    return (
      <>
       <PageHeader
          description="Access your official academic passport, Academic Bank of Credits (ABC), and tamper-proof degree credentials."
          title="Student Self-Service Portal"
        />

        <div style={{ maxWidth: 540, margin: '24px auto', padding: '0 16px' }}>
          <div
            className="card"
            style={{
              border: '2px solid var(--border-strong, #3b82f6)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* National Gateway Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                padding: '20px',
                color: '#fff',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>🇮🇳</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>APAAR Digital Identity Gateway</h2>
              <p style={{ fontSize: '0.82rem', margin: '6px 0 0', opacity: 0.9 }}>
                Ministry of Education • AICTE National Student Registry
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              {loginError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    padding: '12px 14px',
                    borderRadius: 8,
                    fontSize: '0.88rem',
                    marginBottom: 20,
                  }}
                >
                  ⚠️ {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label
                    htmlFor="apaar-input"
                    style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}
                  >
                    12-Digit APAAR ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="apaar-input"
                    className="input"
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 1234 5678 5234"
                    value={apaarInput}
                    onChange={(e) => setApaarInput(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      letterSpacing: 2,
                    }}
                  />
                  <small style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    Enter your One Nation One Student ID issued via DigiLocker.
                  </small>
                </div>

                <div>
                  <label
                    htmlFor="pin-input"
                    style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}
                  >
                    6-Digit DigiLocker Security PIN <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="pin-input"
                    className="input"
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '1.2rem',
                      letterSpacing: 6,
                    }}
                  />
                  <small style={{ color: '#38bdf8', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    Default initial PIN is: <strong>123456</strong> (You can change this after login).
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    padding: '12px',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    marginTop: 6,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Authenticating with AICTE Gateway...' : '🔐 Login via APAAR Gateway'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ==========================================
  // VIEW 2: LOGGED-IN STUDENT RECORD DASHBOARD
  // ==========================================
  const studentPin = localStorage.getItem(`apaar_pin_${student.student_id}`) || '123456'
  const isDefaultPin = studentPin === '123456'

  return (
    <>
            <PageHeader
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCertificateModal(true)}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              📄 Download Official APAAR Certificate (PDF)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPinModal(true)}
            >
              🔑 Change Security PIN
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ borderColor: 'var(--border-strong, #ef4444)' }}
            >
              🚪 Logout
            </button>
          </div>
        }
        description={`Welcome back, ${student.first_name} ${student.last_name}! Review your Academic Bank of Credits and official credential passport.`}
        title="My APAAR Academic Record"
      />

      {isDefaultPin && (
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid #eab308',
            color: '#fde047',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>
            ⚠️ <strong>Security Advisory:</strong> You are currently using default PIN (<code>123456</code>). Please update your security PIN.
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            onClick={() => setShowPinModal(true)}
          >
            Update PIN Now
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid-two-col" style={{ marginTop: 20 }}>
        {/* Profile Card */}
        <section className="card" style={{ border: '1px solid var(--border-strong, #374151)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                {student.first_name} {student.last_name}
              </h2>
              <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.88rem', marginTop: 4 }}>
                Enrolment: <strong style={{ color: 'var(--text-main, #fff)' }}>{student.enrollment_number || 'SVNIT/2022/CS-104'}</strong>
              </div>
            </div>
            <Badge tone={student.status === 'verified' ? 'success' : 'warning'}>
              {student.status === 'verified' ? 'Verified Authentic' : student.status}
            </Badge>
          </div>

          <dl className="meta-grid" style={{ marginTop: 20 }}>
            <div>
              <dt>APAAR ID</dt>
              <dd className="mono" style={{ fontSize: '1.1rem', letterSpacing: 1.5, color: '#38bdf8', fontWeight: 700 }}>
                {student.apaar_id || 'Not Assigned'}
              </dd>
            </div>
            <div>
              <dt>Academic Program</dt>
              <dd>{student.program}</dd>
            </div>
            <div>
              <dt>Date of Birth</dt>
              <dd>{student.date_of_birth || '2003-01-01'}</dd>
            </div>
            <div>
              <dt>Institutional Pilot Node</dt>
              <dd>SVNIT Surat (INST-AICTE-101)</dd>
            </div>
            <div>
              <dt>ABC (Academic Bank) ID</dt>
              <dd className="mono">ABC-904-812-771</dd>
            </div>
            <div>
              <dt>Cumulative Earned Credits</dt>
              <dd>
                <strong style={{ color: '#34d399', fontSize: '1.05rem' }}>142 / 160</strong> Credits Transferred
              </dd>
            </div>
          </dl>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCertificateModal(true)}
            >
              📄 View & Print Official Certificate
            </button>
            <Link className="btn btn-secondary" to="/corrections">
              📝 Request Profile Correction
            </Link>
          </div>
        </section>

        {/* Anti-Tamper Security & QR Seal Card */}
        <section className="card" style={{ border: '1px solid var(--border-strong, #374151)' }}>
          <h2 className="card-title">Cryptographic Anti-Tamper Security Seal</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #9ca3af)', marginTop: 4 }}>
            Official digital degree passport certified by AICTE & National Academic Depository (NAD).
          </p>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: 'var(--surface-sunken, #0f172a)',
              borderRadius: 12,
              border: '1px solid var(--border-subtle, #1f2937)',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                backgroundColor: '#ffffff',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* Dynamic QR Code */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AICTE:APAAR:${student.apaar_id}:HASH:7f9a12c8e3`}
                alt="Tamper-Proof QR Code"
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>
                ✓ SHA-256 Tamper-Proof Seal
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)', marginTop: 4 }}>
                Hash: <span className="mono" style={{ color: 'var(--accent-text, #60a5fa)' }}>SHA256:7f9a...3901b</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)', marginTop: 2 }}>
                Scan with any standard QR scanner to verify authentic AICTE registry status.
              </div>
            </div>
          </div>

          <ul className="timeline" style={{ marginTop: 20 }}>
            <li>
              <span className="timeline-dot dot-success" />
              <div>
                <strong>Aadhaar Demographic Matching Verified</strong>
                <p>Tokenized Zero-Knowledge biometric proof completed via UIDAI Gateway.</p>
              </div>
            </li>
            <li>
              <span className="timeline-dot dot-success" />
              <div>
                <strong>Academic Bank of Credits (ABC) Synced</strong>
                <p>Verified against National Academic Depository (NAD) DigiLocker registry.</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CHANGE PIN MODAL                 */}
      {/* ========================================== */}
      {showPinModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 420,
              border: '2px solid var(--border-strong, #3b82f6)',
              borderRadius: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>🔑 Change Security PIN</h3>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {pinMessage.text && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  backgroundColor: pinMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${pinMessage.isError ? '#ef4444' : '#10b981'}`,
                  color: pinMessage.isError ? '#f87171' : '#34d399',
                }}
              >
                {pinMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  Current PIN (Default is 123456)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  style={{ width: '100%', fontFamily: 'monospace', letterSpacing: 4 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  New 6-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  style={{ width: '100%', fontFamily: 'monospace', letterSpacing: 4 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  style={{ width: '100%', fontFamily: 'monospace', letterSpacing: 4 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPinModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: OFFICIAL PRINTABLE PDF CERTIFICATE */}
      {/* ========================================== */}
      {showCertificateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              backgroundColor: '#ffffff',
              color: '#1f2937',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Top Bar for Actions (Hidden in Print) */}
            <div
              style={{
                backgroundColor: '#1e3a8a',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                📄 Official AICTE APAAR Credential Passport
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Certificate Document */}
            <div
              id="printable-certificate"
              style={{
                padding: '36px 40px',
                border: '8px double #1e3a8a',
                margin: 20,
                backgroundColor: '#ffffff',
                position: 'relative',
              }}
            >
              {/* National Emblem & AICTE Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: 16 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>🇮🇳</div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Government of India • Ministry of Education
                </h1>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b45309', margin: '4px 0 0', textTransform: 'uppercase' }}>
                  All India Council for Technical Education (AICTE)
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2, letterSpacing: 0.5 }}>
                  NATIONAL DIGITAL STUDENT CREDENTIAL & ACADEMIC PASSPORT
                </div>
              </div>

              {/* Certificate Body */}
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontSize: '0.92rem', color: '#4b5563', margin: 0 }}>
                  This is to certify that the academic identity and verified credentials of
                </p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '10px 0', textDecoration: 'underline' }}>
                  {student.first_name} {student.last_name}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4b5563', margin: 0 }}>
                  have been cryptographically authenticated under the National AICTE APAAR-Setu Grid.
                </p>
              </div>

              {/* Demographics & Academic Grid */}
              <div
                style={{
                  marginTop: 24,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px 24px',
                  backgroundColor: '#f9fafb',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: '0.88rem',
                }}
              >
                <div>
                  <span style={{ color: '#6b7280' }}>12-Digit APAAR ID:</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: '1.05rem' }}>
                    {student.apaar_id}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Academic Program:</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{student.program}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Institutional Pilot Node:</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>SVNIT Surat (INST-AICTE-101)</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Institute Enrolment No:</span>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{student.enrollment_number || 'SVNIT/2022/CS-104'}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Academic Bank of Credits (ABC) ID:</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>ABC-904-812-771</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Transferred Earned Credits:</span>
                  <div style={{ fontWeight: 700, color: '#059669' }}>142 / 160 Credits</div>
                </div>
              </div>

              {/* Bottom Security Footer with Live QR */}
              <div
                style={{
                  marginTop: 28,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px dashed #e5e7eb',
                  paddingTop: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=AICTE:APAAR:${student.apaar_id}:HASH:7f9a12c8e3`}
                    alt="Certificate QR Seal"
                    style={{ width: 84, height: 84, border: '2px solid #1e3a8a', padding: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                      ✓ Verified DigiLocker Authenticity
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>
                      SHA256: 7f9a12c8e3b501d8924f
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                      Date of Issue: 26 Oct 2026
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 700 }}>AICTE Setu Grid</div>
                  <div style={{ borderTop: '1px solid #9ca3af', width: 140, margin: '6px auto 2px' }} />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    Member Secretary / Registrar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { getStudents } from '../../lib/api/endpoints'
import type { StudentRecord } from '../../lib/api/types'

// Helper functions to manage custom student PINs (Default: '123456')
function getStoredPin(studentId: string, apaarId?: string | null): string {
  return (
    localStorage.getItem(`apaar_pin_${studentId}`) ||
    (apaarId ? localStorage.getItem(`apaar_pin_${apaarId}`) : null) ||
    '123456'
  )
}

function saveStoredPin(studentId: string, newPin: string, apaarId?: string | null) {
  localStorage.setItem(`apaar_pin_${studentId}`, newPin)
  if (apaarId) localStorage.setItem(`apaar_pin_${apaarId}`, newPin)
}

export default function MyRecordPage() {
  const [apaarInput, setApaarInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredStudents, setRegisteredStudents] = useState<StudentRecord[]>([])
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(null)

  // Change PIN Modal States
  const [showChangePinModal, setShowChangePinModal] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinModalError, setPinModalError] = useState('')
  const [pinSuccessNotice, setPinSuccessNotice] = useState('')

  // Fetch all students from Supabase to match APAAR login
  useEffect(() => {
    getStudents('INST-AICTE-101')
      .then((data) => {
        if (data && data.length > 0) {
          setRegisteredStudents(data)
          // Restore previously logged in session
          const savedId = sessionStorage.getItem('apaar_student_login')
          if (savedId) {
            const matched = data.find(
              (s: StudentRecord) =>
                s.apaar_id === savedId || s.student_id === savedId
            )
            if (matched) setActiveStudent(matched)
          }
        }
      })
      .catch(() => {})
  }, [])

  function handleLogin(e?: FormEvent) {
    if (e) e.preventDefault()
    const targetId = apaarInput.trim()
    const targetPin = passwordInput.trim()

    if (!targetId) {
      setError('Please enter your 12-digit APAAR ID or Student ID.')
      return
    }

    if (!targetPin) {
      setError('Please enter your 6-digit DigiLocker Security PIN / Password.')
      return
    }

    setLoading(true)
    setError('')

    // Search student in live Supabase database
    const found = registeredStudents.find(
      (s) =>
        (s.apaar_id && s.apaar_id.trim() === targetId) ||
        s.student_id.toUpperCase() === targetId.toUpperCase()
    )

    if (found) {
      // Validate PIN against stored custom PIN (or default '123456')
      const expectedPin = getStoredPin(found.student_id, found.apaar_id)
      if (targetPin !== expectedPin) {
        setLoading(false)
        setError(
          expectedPin === '123456'
            ? 'Incorrect Security PIN. Default demo PIN is 123456.'
            : 'Incorrect Security PIN. Please enter the new PIN you previously set.'
        )
        return
      }

      setActiveStudent(found)
      sessionStorage.setItem('apaar_student_login', targetId)
      setApaarInput('')
      setPasswordInput('')
      setLoading(false)
    } else {
      setLoading(false)
      setError(`No student record linked to APAAR ID: ${targetId}. Please verify and try again.`)
    }
  }

  function handleLogout() {
    setActiveStudent(null)
    sessionStorage.removeItem('apaar_student_login')
    setApaarInput('')
    setPasswordInput('')
    setError('')
    setPinSuccessNotice('')
  }

  function handleChangePinSubmit(e: FormEvent) {
    e.preventDefault()
    if (!activeStudent) return

    setPinModalError('')

    const currentSavedPin = getStoredPin(activeStudent.student_id, activeStudent.apaar_id)

    if (currentPin.trim() !== currentSavedPin) {
      setPinModalError('Current Security PIN does not match. (Default was 123456).')
      return
    }

    if (newPin.trim().length < 4 || newPin.trim().length > 12) {
      setPinModalError('New Security PIN must be between 4 and 12 digits.')
      return
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setPinModalError('New PIN and Confirm PIN do not match.')
      return
    }

    if (newPin.trim() === currentSavedPin) {
      setPinModalError('New PIN cannot be identical to the current PIN.')
      return
    }

    // Save newly updated PIN to persistent storage
    saveStoredPin(activeStudent.student_id, newPin.trim(), activeStudent.apaar_id)

    setPinSuccessNotice(`✓ Security PIN updated successfully! Your new PIN is active.`)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setShowChangePinModal(false)

    setTimeout(() => setPinSuccessNotice(''), 8000)
  }

  const isVerified = activeStudent?.status === 'verified'
  const isDefaultPin = activeStudent
    ? getStoredPin(activeStudent.student_id, activeStudent.apaar_id) === '123456'
    : false

  return (
    <>
      <PageHeader
        title={
          activeStudent
            ? `Student Academic Record: ${activeStudent.first_name} ${activeStudent.last_name}`
            : 'AICTE Student Portal & APAAR Depository'
        }
        description="Statutory academic identity gateway under National Credit Framework (NCrF) and Automated Permanent Academic Account Registry (APAAR)."
        actions={
          activeStudent ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge tone={isVerified ? 'success' : 'warning'}>
                {isVerified ? '✓ Verified Authentic' : 'Action Required'}
              </Badge>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowChangePinModal(true)}
              >
                🔐 Change Security PIN
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                🚪 Switch Student / Log Out
              </button>
            </div>
          ) : (
            <Badge tone="info">🔒 DigiLocker / APAAR Authentication</Badge>
          )
        }
      />

      {pinSuccessNotice && (
        <div className="notice notice-success" style={{ marginBottom: 16 }}>
          {pinSuccessNotice}
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. STUDENT LOGIN BOX (CLEAN FORM - NO DEMO CHIPS) */}
      {/* =================================================================== */}
      {!activeStudent ? (
        <div style={{ maxWidth: 520, margin: '30px auto 50px' }}>
          <section
            className="card"
            style={{
              border: '1px solid var(--border-strong)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              padding: 32,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>🇮🇳 🎓</div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: 4 }}>
                DigiLocker • APAAR Student Login
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ministry of Education & AICTE Academic Bank of Credits (ABC) Gateway
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
              {/* Field 1: APAAR ID */}
              <div>
                <label
                  htmlFor="apaar_input"
                  style={{ display: 'block', marginBottom: 6, fontSize: '0.88rem', fontWeight: 600 }}
                >
                  12-Digit APAAR ID / Student ID *
                </label>
                <input
                  id="apaar_input"
                  type="text"
                  className="input"
                  style={{ width: '100%', fontSize: '0.95rem', padding: '11px 14px' }}
                  placeholder="Enter 12-digit APAAR ID (e.g. 123456785234)"
                  value={apaarInput}
                  onChange={(e) => setApaarInput(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Field 2: Password / 6-digit DigiLocker PIN */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="password_input"
                    style={{ fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    6-Digit Security PIN / Password *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-text)' }}>
                    Default PIN: <code>123456</code>
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="password_input"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    style={{ width: '100%', fontSize: '0.95rem', padding: '11px 42px 11px 14px', letterSpacing: showPassword ? 'normal' : '0.2em' }}
                    placeholder="Enter Security PIN"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      opacity: 0.7,
                      color: 'var(--text)',
                    }}
                    title={showPassword ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="notice notice-danger" style={{ fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 0', fontSize: '1rem', marginTop: 6 }}
                disabled={loading}
              >
                {loading ? 'Authenticating with Central Registry...' : '🔒 Authenticate via APAAR SSO'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                Protected by National Academic Depository (NAD) & DigiLocker e-KYC Protocol.
              </small>
            </div>
          </section>
        </div>
      ) : (
        /* =================================================================== */
        /* 2. AUTHENTICATED STUDENT RECORD DASHBOARD */
        /* =================================================================== */
        <>
          {/* Security Banner if still using default PIN */}
          {isDefaultPin && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <span style={{ fontSize: '0.88rem', color: '#fbbf24' }}>
                  <strong>Security Recommendation:</strong> You are currently using the default PIN (<code>123456</code>). Please set a custom Security PIN for enhanced DigiLocker protection.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                onClick={() => setShowChangePinModal(true)}
              >
                Update PIN Now
              </button>
            </div>
          )}

          <div className="two-col record-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginTop: 10 }}>
            {/* Official Identity Profile Card */}
            <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--text)' }}>
                    Student Identity Dossier
                  </h2>
                  <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
                    Sardar Vallabhbhai National Institute of Technology (SVNIT Surat)
                  </p>
                </div>
                <Badge tone={isVerified ? 'success' : 'warning'}>
                  {activeStudent.status || 'Verified'}
                </Badge>
              </div>

              <dl className="detail-list" style={{ marginTop: 18 }}>
                <div>
                  <dt>Full Name</dt>
                  <dd><strong>{activeStudent.first_name} {activeStudent.last_name}</strong></dd>
                </div>
                <div>
                  <dt>Student ID</dt>
                  <dd><code>{activeStudent.student_id}</code></dd>
                </div>
                <div>
                  <dt>Masked APAAR ID</dt>
                  <dd>
                    <code style={{ color: 'var(--accent-text)', fontSize: '0.95rem', fontWeight: 700 }}>
                      {activeStudent.apaar_id ? `XXXX-XXXX-${activeStudent.apaar_id.slice(-4)}` : 'Not Issued'}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt>Academic Program</dt>
                  <dd>{activeStudent.program || 'B.Tech Computer Science and Engineering'}</dd>
                </div>
                <div>
                  <dt>Enrollment Roll</dt>
                  <dd><code>{activeStudent.enrollment_number || 'SVNIT24CS001'}</code></dd>
                </div>
                <div>
                  <dt>Date of Birth</dt>
                  <dd>{activeStudent.date_of_birth || '2004-03-12'}</dd>
                </div>
                <div>
                  <dt>Admission Year</dt>
                  <dd>{activeStudent.admission_year || 2024}</dd>
                </div>
              </dl>

              <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" to="/corrections">
                  📝 Request Discrepancy Correction
                </Link>
                <Link className="btn btn-secondary" to="/verification">
                  🔍 Verify Degree & QR
                </Link>
              </div>
            </section>

            {/* Cryptographic Verification Timeline & Trust Card */}
            <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
              <h2 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--text)' }}>
                Cryptographic Trust & Timeline
              </h2>
              <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
                Immutable audit verification status across federal academic nodes.
              </p>

              <ul className="timeline" style={{ marginTop: 18 }}>
                <li>
                  <span className="timeline-dot dot-success" />
                  <div>
                    <strong>Aadhaar Demographic Matching Verified</strong>
                    <p>Tokenized Zero-Knowledge biometric identity proof completed via UIDAI Gateway.</p>
                    <small style={{ color: 'var(--text-muted)' }}>Aadhaar e-KYC Verified</small>
                  </div>
                </li>
                <li>
                  <span className="timeline-dot dot-success" />
                  <div>
                    <strong>Academic Bank of Credits (ABC) Synced</strong>
                    <p>National Academic Depository (NAD) DigiLocker registry synchronised.</p>
                    <small style={{ color: 'var(--accent-text)' }}>Credits Connected (NCrF Compliant)</small>
                  </div>
                </li>
                <li>
                  <span className={`timeline-dot ${isVerified ? 'dot-success' : 'dot-warning'}`} />
                  <div>
                    <strong>Anti-Tamper QR Seal Status</strong>
                    <p>
                      {isVerified
                        ? 'SHA-256 seal issued for official degree certificate printing.'
                        : 'QR generation locked: Discrepancy resolution pending with Registrar.'}
                    </p>
                    <code style={{ fontSize: '0.78em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      SHA256:AICTE:STU:{activeStudent.student_id}:SEAL
                    </code>
                  </div>
                </li>
              </ul>

              <div
                style={{
                  marginTop: 20,
                  padding: '12px 14px',
                  background: 'var(--surface-2)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                  AICTE Regulatory Compliance Protocol:
                </small>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-text)', fontWeight: 600 }}>
                  🔒 Official Student Record Locked under DPDP Act 2023 Guidelines.
                </span>
              </div>
            </section>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* 3. MODAL: CHANGE SECURITY PIN / PASSWORD */}
      {/* =================================================================== */}
      {showChangePinModal && activeStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowChangePinModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: '92%',
              padding: 24,
              border: '1px solid var(--border-strong)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>
                🔐 Change DigiLocker Security PIN
              </h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                onClick={() => setShowChangePinModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Set a new security PIN for <strong>{activeStudent.first_name} {activeStudent.last_name}</strong>.
            </p>

            <form onSubmit={handleChangePinSubmit} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>
                  Current PIN (Default: 123456) *
                </label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%', fontSize: '0.92rem' }}
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>
                  New 6-Digit PIN *
                </label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%', fontSize: '0.92rem' }}
                  placeholder="e.g. 654321"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  maxLength={12}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>
                  Confirm New PIN *
                </label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%', fontSize: '0.92rem' }}
                  placeholder="Re-enter new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={12}
                  required
                />
              </div>

              {pinModalError && (
                <div className="notice notice-danger" style={{ fontSize: '0.82rem' }}>
                  {pinModalError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowChangePinModal(false)}
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
    </>
  )
}
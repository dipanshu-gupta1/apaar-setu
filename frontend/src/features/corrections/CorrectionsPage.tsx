import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { CORRECTION_STATUS_META } from '../../lib/mock/demoData'
import { useAuth } from '../auth/AuthContext'
import { useCorrections } from './CorrectionsContext'
import { useNotifications } from '../notifications/NotificationsContext'
import { getStudents, updateStudent } from '../../lib/api/endpoints'

const DISCREPANCY_FIELDS = [
  'Date of Birth',
  'APAAR ID Linkage',
  'Full Legal Name',
  'Category Quota',
  'Enrollment Number',
  'Academic Program',
]

export default function CorrectionsPage() {
  const { user } = useAuth()
  const { requests, addRequest, updateStatus } = useCorrections()
  const { addNotification } = useNotifications()

  // Live Supabase students state
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [field, setField] = useState(DISCREPANCY_FIELDS[0])
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState('')
  const [notice, setNotice] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRegisteredStudents()
  }, [])

  async function fetchRegisteredStudents() {
    try {
      const data = await getStudents('INST-AICTE-101')
      if (data && data.length > 0) {
        setStudents(data)
        if (!selectedStudentId) {
          setSelectedStudentId(data[0].student_id)
        }
      }
    } catch {
      // Fallback
    }
  }

  const currentStudent = useMemo(() => {
    return students.find((s) => s.student_id === selectedStudentId) || students[0]
  }, [students, selectedStudentId])

  // Get current value preview
  const currentValuePreview = useMemo(() => {
    if (!currentStudent) return 'Loading...'
    if (field === 'Date of Birth') return currentStudent.date_of_birth || 'Not recorded'
    if (field === 'APAAR ID Linkage') return currentStudent.apaar_id || 'Not Issued'
    if (field === 'Full Legal Name') return `${currentStudent.first_name} ${currentStudent.last_name}`
    if (field === 'Category Quota') return currentStudent.category || 'General'
    if (field === 'Enrollment Number') return currentStudent.enrollment_number || 'Pending'
    if (field === 'Academic Program') return currentStudent.program || 'Engineering'
    return 'Registered Record'
  }, [currentStudent, field])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim() || reason.trim().length < 5) {
      setNotice('Please provide a valid proposed value and detailed official justification.')
      return
    }

    const sName = currentStudent ? `${currentStudent.first_name} ${currentStudent.last_name}` : 'Student'
    const sId = currentStudent ? currentStudent.student_id : 'STU-AICTE'
    const ticketId = `AICTE-COR-${Math.floor(1000 + Math.random() * 9000)}`

    addRequest({
      studentId: sId,
      studentName: sName,
      field,
      currentValue: currentValuePreview,
      requestedValue: value.trim(),
      reason: reason.trim(),
      evidence: evidence.trim() || 'DigiLocker Verified Document Reference',
    })

    addNotification({
      id: `N-${Date.now()}`,
      roles: ['institution_admin', 'verification_officer'],
      title: 'Discrepancy Redressal Ticket Submitted',
      body: `Ticket ${ticketId} created for ${sName} (${field}). Queued for verification officer review.`,
      when: 'Just now',
      read: false,
      to: '/corrections',
    })

    setValue('')
    setReason('')
    setEvidence('')
    setNotice(`✓ Official Discrepancy Ticket ${ticketId} submitted to AICTE Central Audit queue.`)
    setTimeout(() => setNotice(''), 6000)
  }

  // REAL LIVE SUPABASE DATABASE SYNC UPON APPROVAL
  async function handleDecision(req: any, status: 'approved' | 'rejected', remark: string) {
    updateStatus(req.id, status, remark)

    if (status === 'approved') {
      setSyncingId(req.id)
      const updates: Record<string, any> = {}

      if (req.field === 'Full Legal Name' || req.field === 'Full name') {
        const parts = req.requestedValue.trim().split(/\s+/)
        updates.first_name = parts[0]
        updates.last_name = parts.slice(1).join(' ') || ''
      } else if (req.field === 'Date of Birth' || req.field === 'Date of birth') {
        updates.date_of_birth = req.requestedValue.trim()
      } else if (req.field === 'APAAR ID Linkage' || req.field.toLowerCase().includes('apaar')) {
        updates.apaar_id = req.requestedValue.trim()
      } else if (req.field === 'Category Quota' || req.field.toLowerCase().includes('category')) {
        updates.category = req.requestedValue.trim()
      } else if (req.field === 'Enrollment Number' || req.field.toLowerCase().includes('enrollment')) {
        updates.enrollment_number = req.requestedValue.trim()
      } else if (req.field === 'Academic Program' || req.field.toLowerCase().includes('program')) {
        updates.program = req.requestedValue.trim()
      }

      // Mark status as verified once discrepancy is resolved
      updates.status = 'verified'

      try {
        await updateStudent(req.studentId, updates)
        setNotice(`✓ Database Synced: Student ${req.studentId} record successfully updated in Central Supabase Cloud to "${req.requestedValue}".`)

        // Update local state and refetch
        await fetchRegisteredStudents()
      } catch (err: any) {
        console.error('Failed to sync update to Supabase:', err)
        setNotice(`⚠️ Marked as approved locally, but Supabase sync failed: ${err.message}`)
      } finally {
        setSyncingId(null)
      }
    }

    addNotification({
      id: `N-${Date.now()}`,
      roles: ['institution_admin', 'verification_officer', 'student'],
      title: `Discrepancy Ticket ${status === 'approved' ? 'Approved & Registry Synced' : 'Rejected'}`,
      body: `Ticket ${req.id} for ${req.studentName} marked as ${status.toUpperCase()}. Central registry updated.`,
      when: 'Just now',
      read: false,
      to: '/students',
    })
  }

  return (
    <>
      <PageHeader
        title="Student Discrepancy & Correction Redressal"
        description="Official statutory portal for resolving data discrepancies in student records, APAAR linkages and identity mismatches."
        actions={<Badge tone="success">✓ AICTE Redressal Active</Badge>}
      />

      {notice && (
        <p className="notice notice-success" role="status" style={{ marginBottom: 16 }}>
          {notice}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: FORM */}
        <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
          <h2 className="card-title">Initiate Formal Correction Request</h2>
          <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
            AICTE Data Governance Protocol (SOP Sec 4.2): All changes create an immutable audit trail.
          </p>

          <form className="form-stack" onSubmit={submit} style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="student">Select Registered Student (Supabase Cloud)</label>
              <select
                id="student"
                className="select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.first_name} {s.last_name} • {s.student_id} ({s.program || 'CSE'})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="field">Discrepancy Field</label>
              <select
                id="field"
                className="select"
                value={field}
                onChange={(e) => setField(e.target.value)}
              >
                {DISCREPANCY_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Current Value in Central Registry</label>
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  color: 'var(--text)',
                }}
              >
                {currentValuePreview}
              </div>
            </div>

            <div className="field">
              <label htmlFor="proposed">Proposed Correct Value *</label>
              <input
                id="proposed"
                className="input"
                placeholder="Enter verified correct value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="evidence">Supporting Document / DigiLocker URI</label>
              <input
                id="evidence"
                className="input"
                placeholder="e.g. DigiLocker CBSE Class X Marksheet (DL-CBSE-2020-X)"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="reason">Official Reason & Justification *</label>
              <textarea
                id="reason"
                className="textarea"
                placeholder="State reason for discrepancy and how verified document was inspected..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
              />
            </div>

            <button className="btn btn-primary" type="submit" style={{ marginTop: 8 }}>
              Submit Official Redressal Ticket
            </button>
          </form>
        </section>

        {/* RIGHT COLUMN: QUEUE */}
        <section className="card" style={{ border: '1px solid var(--border-strong)', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Active Redressal Audit Queue</h2>
            <Badge tone="info">{requests.length} Cases</Badge>
          </div>
          <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
            Real-time queue for Verification Officers and AICTE Nodal Registrars.
          </p>

          <div className="request-list" style={{ marginTop: 16, display: 'grid', gap: 16 }}>
            {requests.map((r) => {
              const meta = CORRECTION_STATUS_META[r.status] || { label: r.status, tone: 'warning' }
              const isSyncing = syncingId === r.id

              return (
                <article
                  className="request-item"
                  key={r.id}
                  style={{
                    padding: 16,
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{r.field}</strong>
                      <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ({r.id})
                      </span>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <p style={{ margin: '4px 0 10px 0', fontSize: '0.88rem', color: 'var(--accent-text)', fontWeight: 600 }}>
                    {r.studentName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {r.studentId}</span>
                  </p>

                  <div className="compare-values" style={{ margin: '8px 0 12px 0' }}>
                    <span style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--text-muted)' }}>Current Registry</small>
                      <strong style={{ color: 'var(--text)' }}>{r.currentValue}</strong>
                    </span>
                    <span style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--accent-text)' }}>Requested Update</small>
                      <strong style={{ color: 'var(--text)' }}>{r.requestedValue}</strong>
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '6px 0' }}>
                    <strong>Reason:</strong> {r.reason}
                  </p>

                  {r.evidence && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', margin: '4px 0' }}>
                      <strong>Evidence:</strong> {r.evidence}
                    </p>
                  )}

                  {r.decisionNote && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: 'var(--accent-soft)',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        fontSize: '0.82rem',
                        color: 'var(--text)',
                      }}
                    >
                      <strong>Officer Decision:</strong> {r.decisionNote}
                    </div>
                  )}

                  {(r.status === 'submitted' || r.status === 'in_review') && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                        disabled={isSyncing}
                        onClick={() =>
                          handleDecision(
                            r,
                            'approved',
                            'Verified against official DigiLocker repository. Identity seal generated.'
                          )
                        }
                      >
                        {isSyncing ? 'Syncing Supabase Database...' : '✓ Approve & Update Registry'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                        disabled={isSyncing}
                        onClick={() =>
                          handleDecision(
                            r,
                            'rejected',
                            'Supporting documentation insufficient as per AICTE Gazette directive.'
                          )
                        }
                      >
                        ✕ Reject Request
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
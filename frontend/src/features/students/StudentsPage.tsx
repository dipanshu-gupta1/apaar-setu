
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { STATUS_META, type VerificationStatus } from '../../lib/mock/demoData'
import { getStudents, createStudent } from '../../lib/api/endpoints'

const PAGE_SIZE = 8

function maskApaar(apaar?: string | null): string {
  if (!apaar) return 'Not Issued'
  const clean = apaar.trim()
  if (clean.length === 12 && /^\d+$/.test(clean)) {
    return `XXXX-XXXX-${clean.slice(-4)}`
  }
  return clean
}

export default function StudentsPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // API State
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('2003-01-01')
  const [program, setProgram] = useState('B.Tech Computer Science')
  const [apaarId, setApaarId] = useState('')
  const [enrollment, setEnrollment] = useState('')

  useEffect(() => {
    fetchLiveStudents()
  }, [])

  async function fetchLiveStudents() {
    setLoading(true)
    setError('')
    try {
      const data = await getStudents('INST-AICTE-101')
      setStudents(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students from central registry')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStudent(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    setSubmitting(true)
    try {
      await createStudent(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
          program,
          apaar_id: apaarId.trim() || undefined,
          enrollment_number: enrollment.trim() || undefined,
          admission_year: 2024,
        },
        'INST-AICTE-101'
      )
      setShowAddModal(false)
      setFirstName('')
      setLastName('')
      setApaarId('')
      setEnrollment('')
      await fetchLiveStudents()
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const raw = params.get('status')
  const status: VerificationStatus | 'all' =
    raw && raw in STATUS_META ? (raw as VerificationStatus) : 'all'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim().toLowerCase()
      const matchesStatus = status === 'all' || s.status === status
      const matchesQuery =
        !q ||
        fullName.includes(q) ||
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        (s.program && s.program.toLowerCase().includes(q))
      return matchesStatus && matchesQuery
    })
  }, [students, query, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1
  const to = Math.min(current * PAGE_SIZE, filtered.length)

  return (
    <>
      <PageHeader
        title="Student Directory (Central Registry)"
        description="Institution-scoped student academic records with privacy-preserving masked APAAR identifiers."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Register New Student
            </button>
            <Badge tone="success">Live Central Registry</Badge>
          </div>
        }
      />

      {error && <p className="notice notice-danger">{error}</p>}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: 500, width: '90%', padding: 24 }}>
            <h2 className="card-title">Register Student in Central Registry</h2>
            <form onSubmit={handleAddStudent} style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>First Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>Date of Birth *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>Academic Program</label>
                <input
                  type="text"
                  className="input"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>12-Digit APAAR ID</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="987654321012"
                    className="input"
                    value={apaarId}
                    onChange={(e) => setApaarId(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85em', color: '#9ca3af' }}>Enrollment Number</label>
                  <input
                    type="text"
                    placeholder="SVNIT24CS099"
                    className="input"
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Save to Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER TOOLBAR */}
      <div className="toolbar" style={{ marginTop: 16 }}>
        <div className="field">
          <input
            type="search"
            className="input"
            placeholder="Search by name, ID or program..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="field field-select">
          <select
            className="select"
            value={status}
            onChange={(e) => {
              const v = e.target.value
              setParams(v === 'all' ? {} : { status: v })
              setPage(1)
            }}
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="correction_needed">Correction Needed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <section className="card empty-state">
          <p>Loading students from AICTE Central Registry...</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="card empty-state">
          <h2>No students found</h2>
          <p>Register a student using "+ Register New Student" button.</p>
        </section>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name & ID</th>
                  <th>Masked APAAR ID</th>
                  <th>Program</th>
                  <th>Enrolment No</th>
                  <th>Verification Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const sStatus = s.status || 'pending'
                  const meta = STATUS_META[sStatus as VerificationStatus] || { label: 'Pending', tone: 'warning' }

                  return (
                    <tr key={s.student_id}>
                      <td>
                        <strong>{s.first_name} {s.last_name}</strong>
                        <div className="cell-sub" style={{ fontSize: '0.8em', color: '#9ca3af' }}>{s.student_id}</div>
                      </td>
                      <td className="mono" style={{ letterSpacing: 0.5 }}>{maskApaar(s.apaar_id)}</td>
                      <td>{s.program}</td>
                      <td>{s.enrollment_number || 'Pending'}</td>
                      <td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td style={{ color: '#9ca3af', fontSize: '0.85em' }}>{s.updated || '2026-10-25'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination" style={{ marginTop: 16 }}>
            <span>Showing {from}–{to} of {filtered.length} students</span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="button button-secondary"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
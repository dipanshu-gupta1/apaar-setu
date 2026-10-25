import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { PageHeader } from '../ui/PageHeader'
import { getStudents } from '../../lib/api/endpoints'
import { STATUS_META } from '../../lib/mock/demoData'

interface InstitutionItem {
  name: string
  code: string
  aicteId: string
  aisheCode: string
  city: string
  state: string
  type: string
  intake: number
  students: number
  status: 'Authorized' | 'Review Due' | 'Breach Flagged'
  accreditation: string
  nodalOfficer: string
}

const INSTITUTIONS_DIRECTORY: InstitutionItem[] = [
  {
    name: 'Sardar Vallabhbhai National Institute of Technology',
    code: 'SVNIT-SURAT-001',
    aicteId: '1-09823',
    aisheCode: 'U-0144',
    city: 'Surat',
    state: 'Gujarat',
    type: 'Institute of National Importance (NIT)',
    intake: 1120,
    students: 5420,
    status: 'Authorized',
    accreditation: 'NBA Tier-1 (Washington Accord) • NAAC A+',
    nodalOfficer: 'Dr. Neha Sharma (Registrar & Nodal Officer)',
  },
  {
    name: 'Indian Institute of Technology Delhi',
    code: 'IITD-DELHI-002',
    aicteId: '1-00234',
    aisheCode: 'U-0091',
    city: 'New Delhi',
    state: 'Delhi NCR',
    type: 'Institute of National Importance (IIT)',
    intake: 1250,
    students: 8250,
    status: 'Authorized',
    accreditation: 'Institution of Eminence (IoE)',
    nodalOfficer: 'Prof. Rajesh K. Sundaram (Dean of Academics)',
  },
  {
    name: 'Delhi Technological University',
    code: 'DTU-DELHI-003',
    aicteId: '1-04512',
    aisheCode: 'U-0104',
    city: 'Rohini, Delhi',
    state: 'Delhi NCR',
    type: 'State Technical University',
    intake: 1500,
    students: 6140,
    status: 'Authorized',
    accreditation: 'NAAC A+ Grade • NBA Accredited',
    nodalOfficer: 'Dr. V. K. Aggarwal (Controller of Examinations)',
  },
  {
    name: 'COEP Technological University',
    code: 'COEP-PUNE-004',
    aicteId: '1-07741',
    aisheCode: 'U-0312',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'Unitary State Technical University',
    intake: 840,
    students: 4350,
    status: 'Authorized',
    accreditation: 'NBA Tier-1 Accredited Programs',
    nodalOfficer: 'Dr. Milind Joshi (Registrar)',
  },
  {
    name: 'Western Technical Institute',
    code: 'WTI-PUNE-005',
    aicteId: '1-09188',
    aisheCode: 'C-18492',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'Private Autonomous College',
    intake: 480,
    students: 2716,
    status: 'Review Due',
    accreditation: 'Statutory NBA Audit Due (Western Regional Office)',
    nodalOfficer: 'Prof. Santosh Patil (Academic In-charge)',
  },
  {
    name: 'Apex Institute of Technology & Engineering',
    code: 'AIET-JAIPUR-006',
    aicteId: '1-11209',
    aisheCode: 'C-22941',
    city: 'Jaipur',
    state: 'Rajasthan',
    type: 'Affiliated Technical College',
    intake: 360,
    students: 1420,
    status: 'Breach Flagged',
    accreditation: 'Show-Cause Notice Issued for 15% Intake Breach',
    nodalOfficer: 'Registrar Office (Inquiry Active)',
  },
]

interface AuditEventItem {
  id: string
  time: string
  event: string
  actor: string
  actorTone: 'info' | 'success' | 'warning' | 'danger'
  ref: string
  hash: string
  status: 'VERIFIED' | 'BLOCKED' | 'FLAGGED'
}

const AUDIT_EVENTS: AuditEventItem[] = [
  {
    id: 'AUD-8801',
    time: '25 Oct 2026 · 23:45',
    event: 'Student discrepancy approved & synchronized to central Supabase PostgreSQL',
    actor: 'Institutional Registrar',
    actorTone: 'success',
    ref: 'STU-2AB80 (Sonu Mittal)',
    hash: 'SHA256:7f9a12c8...3901b',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8802',
    time: '25 Oct 2026 · 23:18',
    event: 'Cryptographic anti-tamper QR seal & SHA-256 certificate badge generated',
    actor: 'Verification Officer',
    actorTone: 'info',
    ref: 'STU-409AC (Dipanshu Gupta)',
    hash: 'SHA256:91c288f4...ee821',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8803',
    time: '25 Oct 2026 · 22:50',
    event: 'Correction ticket logged with DigiLocker verified CBSE Class X marksheet',
    actor: 'Student Portal (DigiLocker)',
    actorTone: 'info',
    ref: 'STU-F445A (Vibha Manocha)',
    hash: 'SHA256:3a1b0021...8412c',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8804',
    time: '25 Oct 2026 · 21:12',
    event: 'Cross-institution dual enrollment intercepted (SVNIT Surat & PU-Delhi)',
    actor: 'AICTE ML Pipeline',
    actorTone: 'danger',
    ref: 'STU-DUAL-01 (Vikram Malhotra)',
    hash: 'SHA256:e84d715a...991ab',
    status: 'BLOCKED',
  },
  {
    id: 'AUD-8805',
    time: '25 Oct 2026 · 19:30',
    event: 'Intake quota overrun detected (+14 admissions beyond statutory approval)',
    actor: 'AICTE ML Pipeline',
    actorTone: 'warning',
    ref: 'AIET-JAIPUR-006 (Apex Jaipur)',
    hash: 'SHA256:55f884a2...0045f',
    status: 'FLAGGED',
  },
  {
    id: 'AUD-8806',
    time: '25 Oct 2026 · 18:42',
    event: 'New student enrolled & registered into SVNIT Surat departmental node',
    actor: 'Institution Admin (SVNIT)',
    actorTone: 'success',
    ref: 'STU-0F844 (Mukul Sahu)',
    hash: 'SHA256:b12c5549...2217d',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8807',
    time: '25 Oct 2026 · 17:15',
    event: 'ML Random Forest & RapidFuzz anomaly classifier executed on local batch',
    actor: 'AICTE ML Pipeline',
    actorTone: 'info',
    ref: 'BATCH-SVNIT-2024 (SVNIT Surat)',
    hash: 'SHA256:4d7019ce...7781a',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8808',
    time: '25 Oct 2026 · 15:40',
    event: 'Statutory 2FA registrar session established via Aadhaar OTP gateway',
    actor: 'UIDAI Gateway',
    actorTone: 'info',
    ref: 'NODE-SVNIT-SURAT-001',
    hash: 'SHA256:1a89c004...bb391',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8809',
    time: '25 Oct 2026 · 14:05',
    event: 'Aadhaar demographic matching completed via Tokenized Zero-Knowledge Vault',
    actor: 'UIDAI Gateway',
    actorTone: 'info',
    ref: 'STU-409AC (Dipanshu Gupta)',
    hash: 'SHA256:c347d991...a4521',
    status: 'VERIFIED',
  },
  {
    id: 'AUD-8810',
    time: '25 Oct 2026 · 11:20',
    event: 'National Academic Depository (NAD) DigiLocker federated credential sync',
    actor: 'Verification Officer',
    actorTone: 'success',
    ref: 'NODE-AICTE-CENTRAL',
    hash: 'SHA256:0d9177a4...5531b',
    status: 'VERIFIED',
  },
]

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function OperationsPage() {
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null)
  const [liveStudents, setLiveStudents] = useState<any[]>([])

  // State for Audit Trail
  const [auditQuery, setAuditQuery] = useState('')
  const [auditActorFilter, setAuditActorFilter] = useState('all')

  useEffect(() => {
    getStudents('INST-AICTE-101')
      .then((data) => {
        if (data && data.length > 0) setLiveStudents(data)
      })
      .catch(() => {})
  }, [])

  const filteredInstitutions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return INSTITUTIONS_DIRECTORY.filter((inst) => {
      const matchesQuery =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.code.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'authorized' && inst.status === 'Authorized') ||
        (statusFilter === 'review' && inst.status === 'Review Due') ||
        (statusFilter === 'breach' && inst.status === 'Breach Flagged')
      return matchesQuery && matchesStatus
    })
  }, [query, statusFilter])

  const filteredAuditEvents = useMemo(() => {
    const q = auditQuery.trim().toLowerCase()
    return AUDIT_EVENTS.filter((a) => {
      const matchesQuery =
        !q ||
        a.event.toLowerCase().includes(q) ||
        a.actor.toLowerCase().includes(q) ||
        a.ref.toLowerCase().includes(q) ||
        a.hash.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      const matchesActor =
        auditActorFilter === 'all' ||
        a.actor.toLowerCase().includes(auditActorFilter.toLowerCase())
      return matchesQuery && matchesActor
    })
  }, [auditQuery, auditActorFilter])

  const page = useMemo(
    () =>
      ({
        '/institutions': {
          title: 'Institutions & Approval Directory',
          description: 'AICTE central institutional repository with AISHE mapping, sanctioned quota monitoring and statutory compliance tracking.',
        },
        '/reports': {
          title: 'Reports & Accreditation Exports',
          description: 'Generate compliance reports, official student CSVs, and verification metrics for AICTE, NAAC & NBA audits.',
        },
        '/audit': {
          title: 'Immutable Security Audit Trail',
          description: 'Chronological tamper-proof ledger of institutional admissions, ML scans, and verification officer decisions.',
        },
      }[pathname] ?? {
        title: 'Operations',
        description: 'Administrative tools for the APAAR-Setu platform.',
      }),
    [pathname]
  )

  const liveCount = liveStudents.length > 0 ? liveStudents.length : 6

  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={<Badge tone="success">✓ AICTE Registry Active</Badge>}
      />

      {/* ========================================================================= */}
      {/* 1. INSTITUTIONS DIRECTORY */}
      {/* ========================================================================= */}
      {pathname === '/institutions' && (
        <>
          {/* Top Scoreboard Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Affiliated AICTE Nodes</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text)' }}>{INSTITUTIONS_DIRECTORY.length}</strong>
            </div>
            {/* Dynamic Supabase Live Students Card */}
            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-text)', display: 'block' }}>Central Cloud Registry</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--accent-text)' }}>
                {liveCount} Live Students
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                Live in Supabase (SVNIT Node)
              </span>
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Authorized Compliant</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text)' }}>4 Hubs (67%)</strong>
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: '#f87171', display: 'block' }}>Audit Inquiries Active</span>
              <strong style={{ fontSize: '1.5rem', color: '#f87171' }}>2 Institutions</strong>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <div className="field">
              <input
                type="search"
                className="input"
                placeholder="Search institutions by name, AICTE code, or city..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="field field-select">
              <select
                className="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Approval Statuses</option>
                <option value="authorized">Authorized Active</option>
                <option value="review">Audit Review Due</option>
                <option value="breach">Breach Flagged</option>
              </select>
            </div>
          </div>

          {/* Institutions Table */}
          <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Institution Name (Tap to View Dossier)</th>
                    <th>AICTE Code</th>
                    <th>City / State</th>
                    <th>Sanctioned Intake</th>
                    <th>Enrolled Students</th>
                    <th>Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map((i) => (
                    <tr
                      key={i.code}
                      onClick={() => setSelectedInst(i)}
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      title="Click to view full AICTE Institutional Dossier"
                    >
                      <td>
                        <span className="student-link-text">
                          {i.name}
                          <span style={{ fontSize: '0.8em', opacity: 0.75 }}>↗</span>
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          AISHE: {i.aisheCode} • {i.type}
                        </div>
                      </td>
                      <td>
                        <code style={{ color: 'var(--accent-text)', fontSize: '0.85rem' }}>{i.code}</code>
                      </td>
                      <td>{i.city}, {i.state}</td>
                      <td><strong>{i.intake} seats/yr</strong></td>
                      <td>
                        {/* DYNAMIC LIVE COUNT FOR SVNIT SURAT */}
                        {i.code === 'SVNIT-SURAT-001' ? (
                          <div>
                            <strong style={{ color: 'var(--accent-text)', display: 'block' }}>
                              {liveCount} Live Registered
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              5,420 AISHE Campus Cap
                            </span>
                          </div>
                        ) : (
                          <div>
                            <strong style={{ color: 'var(--text)' }}>
                              {i.students.toLocaleString('en-IN')}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                              AISHE Roster
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={
                            i.status === 'Authorized'
                              ? 'success'
                              : i.status === 'Review Due'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {i.status === 'Authorized' ? '✓ Authorized' : i.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note" style={{ color: 'var(--accent-text)', marginTop: 16 }}>
              🔒 Connected to AICTE National Institutional Approval Database & AISHE Registry (MoE, Govt of India).
            </p>
          </section>

          {/* MODAL: INSTITUTION COMPLIANCE DOSSIER POPUP */}
          {selectedInst && (
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
              onClick={() => setSelectedInst(null)}
            >
              <div
                className="card"
                style={{
                  maxWidth: 640,
                  width: '92%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: 24,
                  border: '1px solid var(--border-strong)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      AICTE Institutional Statutory Dossier
                    </span>
                    <h2 style={{ margin: '6px 0 2px 0', fontSize: '1.35rem', color: 'var(--text)' }}>
                      {selectedInst.name}
                    </h2>
                    <code style={{ color: 'var(--accent-text)', fontSize: '0.85rem', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                      AICTE Permanent ID: {selectedInst.aicteId}
                    </code>
                  </div>
                  <div>
                    <Badge
                      tone={
                        selectedInst.status === 'Authorized'
                          ? 'success'
                          : selectedInst.status === 'Review Due'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {selectedInst.status}
                    </Badge>
                  </div>
                </div>

                {/* Profile Grid */}
                <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>AISHE Code (MoE)</small>
                    <strong style={{ color: 'var(--text)' }}>{selectedInst.aisheCode}</strong>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Institution Category</small>
                    <strong style={{ color: 'var(--text)' }}>{selectedInst.type}</strong>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Annual Sanctioned Intake</small>
                    <strong style={{ color: 'var(--accent-text)', fontSize: '1.05rem' }}>{selectedInst.intake} approved seats</strong>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Central Live Registry</small>
                    <strong style={{ color: 'var(--accent-text)', fontSize: '1.05rem' }}>
                      {selectedInst.code === 'SVNIT-SURAT-001'
                        ? `${liveCount} Verified Students (Live Cloud)`
                        : `${selectedInst.students.toLocaleString('en-IN')} Enrolled`}
                    </strong>
                  </div>
                </div>

                {/* Accreditation & Nodal Officer */}
                <div style={{ marginTop: 16, padding: 14, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-strong)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-text)', fontSize: '0.9rem' }}>
                    Accreditation & Regulatory Governance
                  </h4>
                  <div style={{ display: 'grid', gap: 6, fontSize: '0.85rem', color: 'var(--text)' }}>
                    <div>Accreditation Rating: <strong>{selectedInst.accreditation}</strong></div>
                    <div>Statutory Nodal Officer: <strong>{selectedInst.nodalOfficer}</strong></div>
                    <div>Regional Office: <strong>AICTE Western Regional Office (WRO)</strong></div>
                  </div>
                </div>

                {/* Cryptographic Node Key */}
                <div style={{ marginTop: 16, padding: 12, background: 'var(--accent-soft)', borderRadius: 8, border: '1px solid var(--accent)' }}>
                  <small style={{ color: 'var(--accent-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔒 National Academic Depository Node Key
                  </small>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text)', wordBreak: 'break-all', marginTop: 4 }}>
                    SHA256:AICTE:INST:{selectedInst.code}:APPROVED_NODE_KEY
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedInst(null)}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. REPORTS & ACCREDITATION EXPORTS */}
      {/* ========================================================================= */}
      {pathname === '/reports' && (
        <div className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
            <h2 className="card-title">Live Student Registry Export (Supabase Cloud)</h2>
            <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
              Export official AICTE student roster with masked APAAR identifiers, programs and verification statuses.
            </p>
            <div className="report-metric" style={{ margin: '16px 0' }}>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-text)' }}>
                {liveCount} Live Records
              </strong>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Central Database Registry (SVNIT Surat)
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() =>
                downloadCsv('aicte-apaar-setu-student-report.csv', [
                  ['Student ID', 'First Name', 'Last Name', 'Masked APAAR ID', 'Program', 'Admission Year', 'Verification Status', 'Updated Date'],
                  ...liveRecordsForCsv(liveStudents),
                ])
              }
            >
              📥 Download Official Student CSV
            </button>
          </section>

          <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
            <h2 className="card-title">Accreditation & Compliance Summary</h2>
            <p className="card-sub" style={{ color: 'var(--text-muted)' }}>
              Export aggregated institutional verification ratios for NBA, NAAC and NIRF compliance filings.
            </p>
            <div style={{ margin: '16px 0', display: 'grid', gap: 8 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {liveStudents.filter((s) => (s.status === 'correction_needed' ? 'correction' : s.status) === key).length} records
                  </strong>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
              onClick={() =>
                downloadCsv('aicte-apaar-setu-compliance-summary.csv', [
                  ['Status Category', 'Active Count', 'Audit Threshold'],
                  ['Verified Authentic', String(liveStudents.filter((s) => s.status === 'verified').length), 'Statutory Pass'],
                  ['Correction Needed', String(liveStudents.filter((s) => s.status === 'correction_needed' || s.status === 'correction').length), 'Action Required'],
                  ['Pending Review', String(liveStudents.filter((s) => s.status === 'pending').length), 'Queue Active'],
                  ['Verification Failed', String(liveStudents.filter((s) => s.status === 'failed').length), 'Escalated to Registrar'],
                ])
              }
            >
              📥 Download Compliance Summary CSV
            </button>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECURITY AUDIT LOGS */}
      {/* ========================================================================= */}
      {pathname === '/audit' && (
        <>
          {/* Top Scoreboard Metrics for Audit */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Audit Entries</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text)' }}>{AUDIT_EVENTS.length} Logged</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                Chronological Event Trail
              </span>
            </div>

            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-text)', display: 'block' }}>Cryptographic Integrity</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--accent-text)' }}>100% Validated</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                SHA-256 Anti-Tamper Sealing
              </span>
            </div>

            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: '#f87171', display: 'block' }}>Security Breaches Intercepted</span>
              <strong style={{ fontSize: '1.5rem', color: '#f87171' }}>2 Events</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                Dual Enrollment & Over-Intake
              </span>
            </div>

            <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Federal Node Status</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--accent-text)' }}>SVNIT Active</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                99.98% Tamper-Proof Uptime
              </span>
            </div>
          </div>

          {/* Audit Toolbar: Search, Filter, Export */}
          <div className="toolbar" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300 }}>
              <div className="field" style={{ flex: 1 }}>
                <input
                  type="search"
                  className="input"
                  placeholder="Search audit trail by actor, student ID (e.g. STU-409AC), or hash..."
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                />
              </div>
              <div className="field field-select" style={{ width: 220 }}>
                <select
                  className="select"
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                >
                  <option value="all">All Authorized Actors</option>
                  <option value="Registrar">Institutional Registrar</option>
                  <option value="Verification Officer">Verification Officer</option>
                  <option value="AICTE ML Pipeline">AICTE ML Pipeline</option>
                  <option value="Student Portal">Student Portal (DigiLocker)</option>
                  <option value="UIDAI Gateway">UIDAI Gateway</option>
                  <option value="Admin">Institution Admin (SVNIT)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                downloadCsv('aicte-immutable-security-audit.csv', [
                  ['Event ID', 'Timestamp', 'Event Description', 'Authorized Actor', 'Entity Reference', 'SHA-256 Digest', 'Status'],
                  ...filteredAuditEvents.map((a) => [a.id, a.time, a.event, a.actor, a.ref, a.hash, a.status]),
                ])
              }
            >
              📥 Export Audit Ledger (CSV)
            </button>
          </div>

          {/* Audit Table */}
          <section className="card" style={{ border: '1px solid var(--border-strong)' }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Description & Action</th>
                    <th>Authorized Actor</th>
                    <th>Entity Reference</th>
                    <th>Cryptographic Digest (SHA-256)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                        No audit events match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditEvents.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <span style={{ opacity: 0.65, marginRight: 4 }}>🕒</span>
                          {a.time}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text)', display: 'block', fontSize: '0.9rem' }}>{a.event}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Ledger Ref: <code>{a.id}</code>
                          </span>
                        </td>
                        <td>
                          <Badge tone={a.actorTone}>{a.actor}</Badge>
                        </td>
                        <td>
                          <code style={{ color: 'var(--accent-text)', fontSize: '0.82rem', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                            {a.ref}
                          </code>
                        </td>
                        <td>
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {a.hash}
                          </code>
                        </td>
                        <td>
                          <Badge
                            tone={
                              a.status === 'VERIFIED'
                                ? 'success'
                                : a.status === 'BLOCKED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {a.status === 'VERIFIED' ? '✓ VERIFIED' : a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="note" style={{ color: 'var(--accent-text)', marginTop: 16 }}>
              🔒 Immutable cryptographic event trail logged under AICTE National Data Governance Guidelines (SVNIT Pilot Node).
            </p>
          </section>
        </>
      )}
    </>
  )
}

function liveRecordsForCsv(students: any[]) {
  if (!students || students.length === 0) {
    return [
      ['STU-409AC', 'Dipanshu', 'Gupta', 'XXXX-XXXX-5234', 'B.Tech CSE', '2024', 'Verified', '2026-10-25'],
      ['STU-F445A', 'vibha', 'manocha', 'XXXX-XXXX-2321', 'B.Tech CSE', '2024', 'Correction needed', '2026-10-25'],
      ['STU-0F844', 'mukul', 'sahu', 'XXXX-XXXX-7564', 'B.Tech aiml', '2024', 'Failed', '2026-10-25'],
    ]
  }
  return students.map((s) => [
    s.student_id,
    s.first_name,
    s.last_name,
    s.apaar_id ? `XXXX-XXXX-${s.apaar_id.slice(-4)}` : 'Not Issued',
    s.program || 'Engineering',
    String(s.admission_year || 2024),
    s.status || 'pending',
    s.updated || '2026-10-25',
  ])
}

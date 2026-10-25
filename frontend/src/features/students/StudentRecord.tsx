import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { detailFor, STATUS_META, type DemoStudent } from '../../lib/mock/demoData'
export function StudentRecord({ student, title, description }: { student: DemoStudent; title: string; description: string }) {
  const detail = detailFor(student)
  return <>
    <PageHeader title={title} description={description} actions={<Badge tone={STATUS_META[student.status].tone}>{STATUS_META[student.status].label}</Badge>} />
    <div className="two-col record-grid">
      <section className="card"><h2 className="card-title">Student information</h2><p className="card-sub">Sensitive identifiers are masked in this demo.</p><dl className="detail-list">
        <div><dt>Student ID</dt><dd>{student.id}</dd></div><div><dt>APAAR ID</dt><dd>{student.maskedApaar}</dd></div><div><dt>Programme</dt><dd>{student.program}</dd></div><div><dt>Academic year</dt><dd>{student.year}</dd></div><div><dt>Enrolment</dt><dd>{student.enrolment}</dd></div><div><dt>Last updated</dt><dd>{student.updated}</dd></div>
      </dl><p className="note">{detail.statusNote}</p><Link className="btn btn-secondary" to="/corrections">View correction requests</Link></section>
      <section className="card"><h2 className="card-title">Verification timeline</h2><ul className="timeline">{detail.timeline.map((event) => <li key={event.title}><span className={`timeline-dot dot-${event.tone}`} /><div><strong>{event.title}</strong><p>{event.detail}</p><small>{event.when}</small></div></li>)}</ul></section>
    </div>
    <section className="card section-gap"><h2 className="card-title">Record fields</h2><div className="table-wrap"><table className="table"><thead><tr><th>Field</th><th>Current value</th><th>Proposed value</th></tr></thead><tbody>{detail.fields.map((field) => <tr key={field.label}><td className="cell-main">{field.label}</td><td>{field.approved}</td><td>{field.pending ?? '—'}</td></tr>)}</tbody></table></div></section>
  </>
}

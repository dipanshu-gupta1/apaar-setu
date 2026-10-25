import { Link, useParams } from 'react-router-dom'
import { DEMO_STUDENTS } from '../../lib/mock/demoData'
import { StudentRecord } from './StudentRecord'

export default function StudentDetailPage() {
  const { id } = useParams()
  const student = DEMO_STUDENTS.find((s) => s.id === id)

  if (!student) {
    return (
      <section className="card empty-state">
        <h1>Student not found</h1>
        <p>There is no record with this ID in your scope.</p>
        <Link to="/students">Back to students</Link>
      </section>
    )
  }

  return (
    <>
      <Link to="/students" className="back-link">Back to students</Link>
      <StudentRecord
        student={student}
        title={student.name}
        description={`${student.id}, ${student.program}`}
      />
    </>
  )
}

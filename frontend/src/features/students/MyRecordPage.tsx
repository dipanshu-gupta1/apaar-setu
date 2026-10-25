import { StudentRecord } from './StudentRecord'
import { SELF_STUDENT } from '../../lib/mock/demoData'
export default function MyRecordPage() { return <StudentRecord student={SELF_STUDENT} title="My Student Record" description="Review your demo profile, masked APAAR identifier and verification status." /> }

// Student Model
export interface StudentRecord {
  student_id: string
  institution_id: string
  first_name: string
  last_name: string
  date_of_birth: string // YYYY-MM-DD
  gender?: string
  email?: string
  phone?: string
  apaar_id?: string | null
  enrollment_number?: string
  admission_year?: number
  program?: string
  status?: string
}

// ML Data Quality & Duplicate Report (Matches Backend Exactly)
export interface DataQualityIssue {
  field: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  issue_code: string
  message: string
}

export interface DuplicateCandidate {
  target_student_id: string
  matched_student_id: string
  overall_score: number
  confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW'
  matched_signals: Record<string, any>
  explanation: string
  recommended_action: string
}

export interface QualityAndDuplicateReport {
  student_id: string
  institution_id: string
  quality_issues: DataQualityIssue[]
  duplicate_candidates: DuplicateCandidate[]
  has_critical_issues: boolean
  summary: string
}

// Public / Employer Verification Badge
export interface VerifiedStudentBadge {
  verification_status: string
  student_name: string
  apaar_id_masked: string
  student_id: string
  institution_name: string
  aicte_approval_status: string
  program: string
  admission_year: number
  enrollment_number: string
  digital_signature_hash: string
  verified_at: string
  verification_authority: string
}

// Certificate Anti-Tamper QR Payload
export interface CertificateQrPayload {
  certificate_verification_url: string
  student_id: string
  apaar_id: string
  qr_encoded_text: string
  anti_tamper_signature: string
  format_instructions: string
}

// AICTE National Dashboard Metrics
export interface NationalSummary {
  platform: string
  timestamp: string
  total_enrolled_students: number
  apaar_coverage_percentage: number
  capacity_utilization_avg: string
  flagged_dual_enrollments: number
  institutions_with_intake_breach: number
  system_status: string
}
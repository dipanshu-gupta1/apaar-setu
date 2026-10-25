import { apiRequest } from './client'
import type {
  StudentRecord,
  QualityAndDuplicateReport,
  VerifiedStudentBadge,
  CertificateQrPayload,
  NationalSummary,
  DualEnrollmentAlert,
} from './types'

// 1. Health Checks
export const checkBackendHealth = () => apiRequest<{ status: string }>('/health')
export const checkDbHealth = () => apiRequest<{ status: string }>('/db-health')

// 2. Students API
export const getStudents = (institutionId: string) =>
  apiRequest<StudentRecord[]>(`/students?institution_id=${encodeURIComponent(institutionId)}`)

export const createStudent = (student: Partial<StudentRecord>, institutionId: string) =>
  apiRequest<{ message: string; data: any }>('/students?institution_id=' + encodeURIComponent(institutionId), {
    method: 'POST',
    body: JSON.stringify(student),
  })

// 3. ML Anomaly & Data Quality Check
export const runQualityAndDuplicateCheck = (records: StudentRecord[]) =>
  apiRequest<QualityAndDuplicateReport[]>('/ml/quality-check', {
    method: 'POST',
    body: JSON.stringify(records),
  })

// 4. Verification & QR Anti-Tamper Badges
export const verifyStudentRecord = (identifier: string) =>
  apiRequest<VerifiedStudentBadge>(`/verification/verify-student?identifier=${encodeURIComponent(identifier)}`)

export const getCertificateBadge = (studentId: string, apaarId?: string) => {
  const query = apaarId ? `?apaar_id=${encodeURIComponent(apaarId)}` : ''
  return apiRequest<CertificateQrPayload>(`/verification/certificate-badge/${studentId}${query}`)
}

// 5. AICTE Analytics & Monitoring
export const getNationalSummary = () => apiRequest<NationalSummary>('/analytics/national-summary')

export const detectDualEnrollment = (records: any[]) =>
  apiRequest<DualEnrollmentAlert[]>('/analytics/cross-institution-dual-enrollment', {
    method: 'POST',
    body: JSON.stringify(records),
  })
  export const auditIntakeCapacity = (records: any[]) =>
  apiRequest<any[]>('/analytics/intake-capacity-audit', {
    method: 'POST',
    body: JSON.stringify(records),
  })
  export const updateStudentStatus = (studentId: string, status: string) =>
  apiRequest<{ message: string; data: any }>(
    `/students/${encodeURIComponent(studentId)}/status?status=${encodeURIComponent(status)}`,
    { method: 'PATCH' }
  )
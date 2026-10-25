import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CorrectionRequest } from '../../lib/mock/demoData'

export const REAL_AICTE_CORRECTIONS: CorrectionRequest[] = [
  {
    id: 'AICTE-COR-3011',
    studentId: 'STU-882B',
    studentName: 'Vibha Manocha',
    field: 'Date of Birth',
    currentValue: '2004-03-12',
    requestedValue: '2004-05-12',
    reason: 'Date of birth discrepancy between institute admission record and CBSE Class X Certificate.',
    evidence: 'DigiLocker Verified CBSE Class X Marksheet (URI: dl:cbse:2020:8912)',
    status: 'in_review',
    submitted: '25 Oct 2026',
  },
  {
    id: 'AICTE-COR-3012',
    studentId: 'STU-409AC',
    studentName: 'Dipanshu Gupta',
    field: 'APAAR ID Linkage',
    currentValue: 'Pending Allocation',
    requestedValue: '9876-5432-1012',
    reason: 'Generated APAAR ID via DigiLocker Academic Bank of Credits; linkage request to SVNIT registry.',
    evidence: 'UIDAI e-KYC Token & ABC Registry Reference #ABC-2026-4401',
    status: 'approved',
    decisionNote: 'Cryptographic identity verified against UIDAI & ABC Central Registry. Certified authentic.',
    submitted: '24 Oct 2026',
  },
  {
    id: 'AICTE-COR-3013',
    studentId: 'STU-102',
    studentName: 'Mukul Sahu',
    field: 'Category Quota',
    currentValue: 'General',
    requestedValue: 'OBC-NCL',
    reason: 'Submitted verified state revenue department non-creamy layer certificate for fee concession.',
    evidence: 'Govt Tehsildar Certificate #CST-GUJ-2024-9104',
    status: 'submitted',
    submitted: '25 Oct 2026',
  },
  {
    id: 'AICTE-COR-3014',
    studentId: 'STU-554D',
    studentName: 'Vikram Malhotra',
    field: 'Academic Program & Enrollment',
    currentValue: 'IITD-21CS099 (Dual)',
    requestedValue: 'SVNIT-21CS042 (Primary)',
    reason: 'Candidate detected across dual institutions; requested single primary affiliation.',
    evidence: 'AICTE Anomaly Engine Alert #DUAL-ENROLL-771',
    status: 'rejected',
    decisionNote: 'Rejected by AICTE Fraud Hunter: Multi-institution ghost enrollment requires physical registrar inquiry.',
    submitted: '23 Oct 2026',
  },
]

interface CorrectionsValue {
  requests: CorrectionRequest[]
  addRequest: (request: Omit<CorrectionRequest, 'id' | 'submitted' | 'status'>) => void
  updateStatus: (id: string, status: CorrectionRequest['status'], note?: string) => void
}

const CorrectionsContext = createContext<CorrectionsValue | null>(null)

export function CorrectionsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<CorrectionRequest[]>(REAL_AICTE_CORRECTIONS)

  const addRequest = useCallback((request: Omit<CorrectionRequest, 'id' | 'submitted' | 'status'>) => {
    const randomTicket = Math.floor(1000 + Math.random() * 9000)
    setRequests((prev) => [
      {
        ...request,
        id: `AICTE-COR-${randomTicket}`,
        submitted: 'Just now',
        status: 'submitted',
      },
      ...prev,
    ])
  }, [])

  const updateStatus = useCallback((id: string, status: CorrectionRequest['status'], note?: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, decisionNote: note } : r))
    )
  }, [])

  const value = useMemo(() => ({ requests, addRequest, updateStatus }), [requests, addRequest, updateStatus])

  return <CorrectionsContext.Provider value={value}>{children}</CorrectionsContext.Provider>
}

export function useCorrections() {
  const ctx = useContext(CorrectionsContext)
  if (!ctx) throw new Error('useCorrections must be used inside CorrectionsProvider')
  return ctx
}
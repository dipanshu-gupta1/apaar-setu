import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { SEED_CORRECTIONS, type CorrectionRequest } from '../../lib/mock/demoData'
interface CorrectionsValue { requests: CorrectionRequest[]; addRequest: (request: Omit<CorrectionRequest, 'id' | 'submitted' | 'status'>) => void; updateStatus: (id: string, status: CorrectionRequest['status'], note?: string) => void }
const CorrectionsContext = createContext<CorrectionsValue | null>(null)
export function CorrectionsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState(SEED_CORRECTIONS)
  const addRequest = useCallback((request: Omit<CorrectionRequest, 'id' | 'submitted' | 'status'>) => setRequests((prev) => [{ ...request, id: `COR-${Date.now()}`, submitted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'submitted' }, ...prev]), [])
  const updateStatus = useCallback((id: string, status: CorrectionRequest['status'], note?: string) => setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status, decisionNote: note } : r)), [])
  const value = useMemo(() => ({ requests, addRequest, updateStatus }), [requests, addRequest, updateStatus])
  return <CorrectionsContext.Provider value={value}>{children}</CorrectionsContext.Provider>
}
export function useCorrections() { const ctx = useContext(CorrectionsContext); if (!ctx) throw new Error('useCorrections must be used inside CorrectionsProvider'); return ctx }

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_USERS, type DemoUser, type Role } from '../../types/auth'

interface AuthValue {
  user: DemoUser
  setRole: (role: Role) => void
}

const AuthContext = createContext<AuthValue | null>(null)
const KEY = 'demo-role'

function initialRole(): Role {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved && saved in DEMO_USERS) return saved as Role
  } catch {
    /* ignore */
  }
  return 'institution_admin'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(initialRole)

  const setRole = useCallback((next: Role) => {
    try {
      sessionStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    setRoleState(next)
  }, [])

  const value = useMemo(
    () => ({ user: DEMO_USERS[role], setRole }),
    [role, setRole],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_LABELS, type Role } from '../../types/auth'
import { useAuth } from './AuthContext'

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { user } = useAuth()

  if (!roles.includes(user.role)) {
    return (
      <section className="card empty-state" role="alert">
        <h1>Access restricted</h1>
        <p>
          Your current role ({ROLE_LABELS[user.role]}) does not have access to
          this page. In the real system, the backend enforces this as well.
        </p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }
  return <>{children}</>
}

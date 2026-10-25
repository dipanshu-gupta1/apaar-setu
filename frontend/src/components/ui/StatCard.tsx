import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

export interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: IconName
  to?: string
}

export function StatCard({ label, value, hint, icon, to }: StatCardProps) {
  const body = (
    <>
      <span className="stat-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {hint && <span className="stat-hint">{hint}</span>}
      </span>
    </>
  )

  return to ? (
    <Link to={to} className="stat stat-link">{body}</Link>
  ) : (
    <div className="stat">{body}</div>
  )
}

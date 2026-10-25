import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useNotifications } from '../../features/notifications/NotificationsContext'
import { Logo } from '../brand/Logo'
import { Icon } from '../ui/Icon'
import { navFor } from './navConfig'

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean
  onNavigate: () => void
}) {
  const { user } = useAuth()
  const { unread } = useNotifications()
  const items = navFor(user.role)

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
      </div>

      <nav aria-label="Primary">
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.path === '/notifications' && unread > 0 && (
                  <span className="nav-count">
                    {unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <p className="sidebar-footer">Demo build. Synthetic data only.</p>
    </aside>
  )
}

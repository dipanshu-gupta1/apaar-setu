import { useTheme } from '../../app/ThemeContext'
import { useAuth } from '../../features/auth/AuthContext'
import { ROLE_LABELS, type Role } from '../../types/auth'
import { Icon } from '../ui/Icon'

const ROLES = Object.keys(ROLE_LABELS) as Role[]

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, setRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-btn"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Icon name="menu" />
      </button>

      <div className="scope">
        <span className="scope-label">Access scope</span>
        <span className="scope-value">{user.institution}</span>
      </div>

      <div className="topbar-actions">
        <label className="role-switch">
          <span>Active Role</span>
          <select
            className="select"
            value={user.role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>

        <div className="user-chip">
          <span className="avatar" aria-hidden="true">{initials}</span>
          <span className="user-meta">
            <strong>{user.name}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </span>
        </div>
      </div>
    </header>
  )
}

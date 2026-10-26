import { useState, useEffect } from 'react'
import { useTheme } from '../../app/ThemeContext'
import { useAuth } from '../../features/auth/AuthContext'
import { ROLE_LABELS, type Role } from '../../types/auth'
import { Icon } from '../ui/Icon'

const ROLES = Object.keys(ROLE_LABELS) as Role[]

interface InstitutionNode {
  name: string
  aicteId: string
  state: string
}

const PRESET_INSTITUTIONS: InstitutionNode[] = [
  { name: 'SVNIT Surat', aicteId: '1-09823', state: 'Gujarat' },
  { name: 'COEP Tech University, Pune', aicteId: '1-04211', state: 'Maharashtra' },
  { name: 'Delhi Technological University (DTU)', aicteId: '1-00392', state: 'Delhi NCR' },
  { name: 'Apex Institute of Tech, Jaipur', aicteId: 'AIET-JAIPUR-006', state: 'Rajasthan' },
]

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, setRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : 'light'

  // Institution Scope State
  const [currentScope, setCurrentScope] = useState<string>(() => {
    return sessionStorage.getItem('aicte_active_scope') || 'SVNIT Surat (AICTE ID: 1-09823)'
  })
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customAicteId, setCustomAicteId] = useState('')

  useEffect(() => {
    sessionStorage.setItem('aicte_active_scope', currentScope)
  }, [currentScope])

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  function handleInstitutionChange(val: string) {
    if (val === 'CUSTOM') {
      setShowCustomModal(true)
    } else {
      setCurrentScope(val)
    }
  }

  function handleSaveCustomScope(e: React.FormEvent) {
    e.preventDefault()
    if (!customName.trim() || !customAicteId.trim()) return

    const newScope = `${customName.trim()} (AICTE ID: ${customAicteId.trim()})`
    setCurrentScope(newScope)
    setShowCustomModal(false)
    setCustomName('')
    setCustomAicteId('')
  }

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

      {/* Interactive Access Scope & Institution Switcher */}
      <div className="scope" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          className="scope-label"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block',
            }}
          />
          Access scope • Multi-Tenant Node
        </span>

        <select
          value={PRESET_INSTITUTIONS.some((i) => `${i.name} (AICTE ID: ${i.aicteId})` === currentScope) ? currentScope : 'CUSTOM_ACTIVE'}
          onChange={(e) => handleInstitutionChange(e.target.value)}
          style={{
            background: 'var(--surface-sunken, rgba(0, 0, 0, 0.25))',
            color: 'var(--text-main, #ffffff)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '4px 8px',
            cursor: 'pointer',
            outline: 'none',
            maxWidth: 320,
          }}
          title="Click to switch institutional node or enter custom AICTE ID"
        >
          {PRESET_INSTITUTIONS.map((inst) => {
            const val = `${inst.name} (AICTE ID: ${inst.aicteId})`
            return (
              <option key={inst.aicteId} value={val} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                🏛️ {val}
              </option>
            )
          })}
          {!PRESET_INSTITUTIONS.some((i) => `${i.name} (AICTE ID: ${i.aicteId})` === currentScope) && (
            <option value="CUSTOM_ACTIVE" style={{ backgroundColor: '#1e293b', color: '#38bdf8' }}>
              🏛️ {currentScope}
            </option>
          )}
          <option value="CUSTOM" style={{ backgroundColor: '#0f172a', color: '#38bdf8', fontWeight: 'bold' }}>
            ➕ Enter Custom AICTE ID...
          </option>
        </select>
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

      {/* Custom AICTE ID Switcher Modal */}
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 440,
              border: '2px solid var(--border-strong, #3b82f6)',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>🏛️ Switch AICTE Institution</h3>
                <small style={{ color: 'var(--text-muted, #9ca3af)' }}>
                  Multi-tenant Node Partitioning
                </small>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomScope} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  Institution Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology, Trichy"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  AICTE Approval ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-05512 or NIT-TRICHY-009"
                  value={customAicteId}
                  onChange={(e) => setCustomAicteId(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Switch Active Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
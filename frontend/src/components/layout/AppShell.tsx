import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ApaarChatbot } from '../chat/ApaarChatbot'

export function AppShell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && (
        <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <div className="shell-main">
        <Topbar onMenu={() => setOpen(true)} />
        <main id="main" className="content">
          <Outlet />
        </main>
        <ApaarChatbot />
        <footer className="footer">
  AICTE APAAR-Setu Platform • SIH26263 National Registry
</footer>
      </div>
    </div>
  )
}

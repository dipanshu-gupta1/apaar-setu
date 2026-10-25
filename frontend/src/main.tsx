import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import './styles/shell.css'
import './styles/ui.css'
import App from './App.tsx'
import { ThemeProvider } from './app/ThemeContext'
import { AuthProvider } from './features/auth/AuthContext'
import { CorrectionsProvider } from './features/corrections/CorrectionsContext'
import { NotificationsProvider } from './features/notifications/NotificationsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <CorrectionsProvider>
              <App />
            </CorrectionsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

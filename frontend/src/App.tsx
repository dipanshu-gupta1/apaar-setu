import type { ReactElement } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { NAV_ITEMS } from './components/layout/navConfig'
import { PagePlaceholder } from './components/layout/PagePlaceholder'
import { OperationsPage } from './components/layout/OperationsPages'
import CorrectionsPage from './features/corrections/CorrectionsPage'
import DashboardPage from './features/dashboard/DashboardPage'
import NotificationsPage from './features/notifications/NotificationsPage'
import { RequireRole } from './features/auth/RequireRole'
import MyRecordPage from './features/students/MyRecordPage'
import StudentDetailPage from './features/students/StudentDetailPage'
import StudentsPage from './features/students/StudentsPage'
import VerificationPage from './features/verification/VerificationPage'
import type { Role } from './types/auth'
import DataQualityPage from './features/data-quality/DataQualityPage'
import AiInsightsPage from './features/ai-insights/AiInsightsPage'
// Screens that are built. Everything else shows a placeholder for now.
const PAGES: Record<string, ReactElement> = {
  '/dashboard': <DashboardPage />,
  '/students': <StudentsPage />,
  '/verification': <VerificationPage />,
  '/my-record': <MyRecordPage />,
  '/corrections': <CorrectionsPage />,
  '/notifications': <NotificationsPage />,
    '/data-quality': <DataQualityPage />,
  '/institutions': <OperationsPage />,
  '/reports': <OperationsPage />,
  '/audit': <OperationsPage />,
    '/ai-insights': <AiInsightsPage />,
}

const STUDENT_VIEW_ROLES: Role[] = ['institution_admin', 'verification_officer', 'faculty']

function NotFound() {
  return (
    <section className="card empty-state">
      <h1>Page not found</h1>
      <p>This address does not exist.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {NAV_ITEMS.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={
              <RequireRole roles={item.roles}>
                {PAGES[item.path] ?? <PagePlaceholder item={item} />}
              </RequireRole>
            }
          />
        ))}
        <Route
          path="/students/:id"
          element={
            <RequireRole roles={STUDENT_VIEW_ROLES}>
              <StudentDetailPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

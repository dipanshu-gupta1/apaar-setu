import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { SEED_NOTIFICATIONS, type DemoNotification } from '../../lib/mock/demoData'

interface NotificationsValue { notifications: DemoNotification[]; unread: number; markRead: (id: string) => void; markAllRead: () => void }
const NotificationsContext = createContext<NotificationsValue | null>(null)
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState(SEED_NOTIFICATIONS)
  const notifications = useMemo(() => items.filter((n) => n.roles.includes(user.role)), [items, user.role])
  const unread = notifications.filter((n) => !n.read).length
  const markRead = useCallback((id: string) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)), [])
  const markAllRead = useCallback(() => setItems((prev) => prev.map((n) => n.roles.includes(user.role) ? { ...n, read: true } : n)), [user.role])
  const value = useMemo(() => ({ notifications, unread, markRead, markAllRead }), [notifications, unread, markRead, markAllRead])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
export function useNotifications() { const ctx = useContext(NotificationsContext); if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider'); return ctx }

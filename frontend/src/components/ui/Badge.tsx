import type { ReactNode } from 'react'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

// A symbol is shown with the text so status is never conveyed by color alone.
const SYMBOL: Record<Tone, string> = {
  success: '✓',
  warning: '!',
  danger: '✕',
  info: 'i',
  neutral: '•',
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span aria-hidden="true">{SYMBOL[tone]}</span>
      {children}
    </span>
  )
}

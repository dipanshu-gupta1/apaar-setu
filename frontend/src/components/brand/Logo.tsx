import { Link } from 'react-router-dom'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link to="/dashboard" className="logo" aria-label="APAAR Setu home">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="var(--accent)" />
        <path
          d="M20 7.5l10 3.9v7.6c0 6-4.2 10.6-10 13.5-5.8-2.9-10-7.5-10-13.5v-7.6L20 7.5z"
          fill="var(--accent-contrast)"
          fillOpacity="0.16"
          stroke="var(--accent-contrast)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M14.8 20.2l3.6 3.6 6.8-7.2"
          fill="none"
          stroke="var(--accent-contrast)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo-text">
        <strong>
          APAAR <span>Setu</span>
        </strong>
        <small>AICTE Student Data Platform</small>
      </span>
    </Link>
  )
}
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
  link?: {
    label: string
    url: string
  }
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'bot',
    text: 'Namaste! 🙏 I am APAAR Sahayak — AICTE National Student Verification AI Assistant. How can I assist you with APAAR IDs, DigiLocker sync, or Academic Bank of Credits (ABC) today?',
    time: 'Just now',
  },
]

const QUICK_PROMPTS = [
  '🔍 Verify APAAR: 123456785234',
  '🔒 Why is a Degree QR Code withheld?',
  '💳 How does ABC credit transfer work?',
  '📑 How to fix a DOB / Quota discrepancy?',
  '🏛️ What is SVNIT Surat Pilot Node?',
  '⚡ How does Dual-Enrollment fraud detection work?',
]

export function ApaarChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isTyping])

  function getBotResponse(userText: string): { reply: string; link?: { label: string; url: string } } {
    const q = userText.toLowerCase()

    if (q.includes('verify') || q.includes('check apaar') || q.includes('status')) {
      return {
        reply: 'You can perform live, cryptographic employer or public verification by entering any 12-digit APAAR ID in our Verification Gateway. Authentic credentials receive a tamper-proof SHA-256 QR code instantly.',
        link: { label: 'Go to Verification Portal ➔', url: '/verification' },
      }
    }

    if (q.includes('withheld') || q.includes('qr') || q.includes('not showing')) {
      return {
        reply: 'Under the AICTE Anti-Tamper Security Protocol, if a student profile has an active discrepancy (like DOB mismatch or unverified category certificate), the official degree QR code is automatically WITHHELD to prevent forged degree circulation.',
        link: { label: 'Check Verification Queue ➔', url: '/verification' },
      }
    }

    if (q.includes('correct') || q.includes('discrepancy') || q.includes('dob') || q.includes('fix')) {
      return {
        reply: 'Profile discrepancies (such as Date of Birth or Quota Category mismatches against CBSE/State Revenue databases) can be submitted for review. Once verified by the institutional node officer, changes sync directly to the central registry.',
        link: { label: 'Open Corrections Desk ➔', url: '/corrections' },
      }
    }

    if (q.includes('abc') || q.includes('credit') || q.includes('bank') || q.includes('digilocker')) {
      return {
        reply: 'The Academic Bank of Credits (ABC) functions as an educational credit passport under NEP 2020. Your APAAR ID acts as the master key, allowing verified credits to seamlessly transfer between AICTE-approved institutions and universities.',
        link: { label: 'View Student Record & ABC ➔', url: '/my-record' },
      }
    }

    if (q.includes('svnit') || q.includes('pilot') || q.includes('node') || q.includes('surat')) {
      return {
        reply: 'SVNIT Surat (Sardar Vallabhbhai National Institute of Technology) serves as the primary national pilot node for this AICTE deployment. It tests high-throughput student demographic ingestion and sub-second verification across Western Region institutes.',
      }
    }

    if (q.includes('fraud') || q.includes('dual') || q.includes('dbt') || q.includes('leakage') || q.includes('intake')) {
      return {
        reply: 'Our AICTE Intelligence engine runs cross-institution correlation algorithms to detect students concurrently registered across multiple colleges. This stops duplicate Direct Benefit Transfer (DBT) scholarship leakage and flags unapproved seat intake over-admissions.',
        link: { label: 'Explore AICTE Fraud Hunter ➔', url: '/ai-insights' },
      }
    }

    if (q.includes('login') || q.includes('password') || q.includes('pin')) {
      return {
        reply: 'Students can securely log into their profile using their 12-digit APAAR ID and 6-digit DigiLocker Security PIN (Default: 123456). You can also update your security PIN at any time from your record dashboard.',
        link: { label: 'Student APAAR Login ➔', url: '/my-record' },
      }
    }

    return {
      reply: `Thank you for your query regarding "${userText}". The AICTE APAAR-Setu platform provides Zero-Knowledge verification, tamper-proof academic credentials, and automated compliance auditing across all affiliated institutes.`,
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputValue).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputValue('')
    setIsTyping(true)

    try {
      const res = await fetch('http://127.0.0.1:8000/chatbot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, user_role: 'public' }),
      })

      if (res.ok) {
        const data = await res.json()
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: data.link,
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        throw new Error('Backend failed')
      }
    } catch {
      const { reply, link } = getBotResponse(text)
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link,
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setIsTyping(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    handleSend()
  }

  return (
    <>
      {/* 1. Small Circular Robot Floating FAB */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="APAAR Sahayak (AI Support)"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card, #121824)',
              border: '1px solid var(--border-strong, #374151)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-text, #60a5fa)'
              e.currentTarget.style.transform = 'scale(1.08)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong, #374151)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: '1.45rem', lineHeight: 1 }}>🤖</span>
            {/* Green Online Dot */}
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
                border: '2px solid var(--bg-card, #121824)',
              }}
            />
          </button>
        )}
      </div>

      {/* 2. Theme-Matched Native Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            height: '490px',
            maxHeight: 'calc(100vh - 40px)',
            backgroundColor: 'var(--bg-card, #121824)',
            color: 'var(--text-main, #f3f4f6)',
            borderRadius: '12px',
            border: '1px solid var(--border-strong, #374151)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--surface-sunken, #0f172a)',
              color: 'var(--text-main, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle, #1f2937)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main, #fff)' }}>
                  APAAR Sahayak
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #9ca3af)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                  AICTE Support Grid
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #9ca3af)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--surface-sunken, #0a0e17)',
              borderBottom: '1px solid var(--border-subtle, #1f2937)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card, #121824)',
                  color: 'var(--accent-text, #38bdf8)',
                  border: '1px solid var(--border-subtle, #1f2937)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'border-color 0.15s ease',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '12px 14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: 'var(--bg-card, #121824)',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: m.sender === 'user' ? 'var(--border-strong, #334155)' : 'var(--surface-sunken, #0f172a)',
                    color: 'var(--text-main, #ffffff)',
                    fontSize: '0.82rem',
                    lineHeight: '1.45',
                    border: '1px solid var(--border-subtle, #1f2937)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {m.text}
                  {m.link && (
                    <div style={{ marginTop: '6px' }}>
                      <Link
                        to={m.link.url}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'inline-block',
                          fontSize: '0.74rem',
                          color: 'var(--accent-text, #38bdf8)',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        {m.link.label}
                      </Link>
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted, #9ca3af)',
                    marginTop: '2px',
                    padding: '0 4px',
                  }}
                >
                  {m.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #9ca3af)' }}>
                  Sahayak is thinking...
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-text, #38bdf8)',
                  }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Theme-Matched Input Footer */}
          <form
            onSubmit={onSubmit}
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--border-subtle, #1f2937)',
              backgroundColor: 'var(--surface-sunken, #0f172a)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              className="input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask APAAR Sahayak..."
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '6px 10px',
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="btn btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: inputValue.trim() ? 'pointer' : 'default',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
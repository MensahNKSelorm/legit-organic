'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('General Inquiry')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subjectLine = encodeURIComponent(`[Website] ${subject} — ${name}`)
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`
    )
    window.open(`mailto:hello@legitorganic.com?subject=${subjectLine}&body=${body}`)
    setSubmitted(true)
  }

  const reset = () => {
    setSubmitted(false)
    setName('')
    setEmail('')
    setPhone('')
    setSubject('General Inquiry')
    setMessage('')
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E6D8BD] shadow-sm flex flex-col items-center justify-center text-center min-h-[420px]">
        <div className="w-16 h-16 bg-[#0D3B2A] rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-2">Message Sent!</h3>
        <p className="text-[#0D3B2A]/70 text-sm leading-relaxed max-w-xs">
          Thank you for reaching out. We&apos;ll be in touch within 24 hours.
        </p>
        <button
          onClick={reset}
          className="mt-6 text-sm text-[#0D3B2A] font-semibold underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-[#E6D8BD] bg-[#FAF7F0] text-[#0D3B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-colors'

  const labelClass =
    'block text-xs font-semibold text-[#0D3B2A]/60 uppercase tracking-wide mb-1.5'

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E6D8BD] shadow-sm">
      <h2 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-6">Send a Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Kwame Asante"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="kwame@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Phone Number{' '}
            <span className="normal-case font-normal text-[#0D3B2A]/40">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+233 XX XXX XXXX"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Subject</label>
          <div className="relative">
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6D8BD] bg-[#FAF7F0] text-[#0D3B2A] text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition-colors"
            >
              <option>General Inquiry</option>
              <option>Order Support</option>
              <option>Farmer Partnership</option>
              <option>Press / Media</option>
              <option>Bulk Orders</option>
              <option>Technical Support</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D3B2A" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Message</label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#F4C430] text-[#0D3B2A] font-semibold py-3 rounded-xl hover:bg-[#e5b520] transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  )
}

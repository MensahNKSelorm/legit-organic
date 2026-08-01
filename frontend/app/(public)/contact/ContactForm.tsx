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
      <div className="flex min-h-[420px] flex-col items-start justify-center border-y editorial-rule py-12">
        <div className="mb-6 grid h-14 w-14 place-items-center bg-[#0D3B2A]">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 className="display-organic mb-2 text-4xl text-[#0D3B2A] dark:text-white">Your email app is open.</h3>
        <p className="max-w-md text-sm leading-relaxed text-[#5B3E31] dark:text-[#B8D4BD]">
          Finish sending the prepared message there. We&apos;ll reply as soon as someone on the team is available.
        </p>
        <button
          onClick={reset}
          className="mt-6 text-sm text-[#0D3B2A] dark:text-white font-semibold underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  const inputClass =
    'w-full border-0 border-b border-[#0D3B2A]/25 bg-transparent px-0 py-3 text-[#0D3B2A] placeholder:text-[#0D3B2A]/35 focus:border-[#2E7D32] focus:outline-none dark:border-white/20 dark:text-white dark:placeholder:text-white/35 text-base transition-colors'

  const labelClass =
    'block text-xs font-bold text-[#2E7D32] dark:text-[#9FC5A4] mb-1'

  return (
    <div className="border-t editorial-rule pt-6 lg:pt-0 lg:border-t-0">
      <p className="editorial-label mb-7 text-[#2E7D32] dark:text-[#9FC5A4]">Write to the team</p>
      <form onSubmit={handleSubmit} className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <div className="md:col-span-2">
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
            <span className="normal-case font-normal text-[#0D3B2A]/40 dark:text-gray-500">(optional)</span>
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
              className={`${inputClass} cursor-pointer appearance-none`}
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

        <div className="md:col-span-2">
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
          className="mt-2 w-full bg-[#F4C430] py-4 font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white md:col-span-2"
        >
          Send Message
        </button>
      </form>
    </div>
  )
}

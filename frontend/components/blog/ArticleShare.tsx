'use client'

import { useState } from 'react'

export default function ArticleShare({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://legitorganic.com/blog/${slug}`

  const linkCls =
    'editorial-label text-[#5B3E31] dark:text-[#B8D4BD] border-b border-transparent ' +
    'hover:border-current hover:text-[#0D3B2A] dark:hover:text-white transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="editorial-label text-[#0D3B2A] dark:text-[#FAF7F0]">Share</span>
      <a
        className={linkCls}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
      >
        X / Twitter
      </a>
      <a
        className={linkCls}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
      >
        WhatsApp
      </a>
      <button
        type="button"
        className={linkCls}
        onClick={() => {
          navigator.clipboard?.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }}
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}

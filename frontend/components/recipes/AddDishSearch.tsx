'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export default function AddDishSearch({ currentTitles, catalogue }: { currentTitles: string[]; catalogue: string[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const matches = useMemo(() => query.trim().length < 1 ? [] : catalogue
    .filter(title => !currentTitles.some(current => normalise(current) === normalise(title)))
    .filter(title => normalise(title).includes(normalise(query)))
    .slice(0, 6), [catalogue, currentTitles, query])

  return (
    <div className="relative mt-5 w-full max-w-md">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {currentTitles.length < 4
          ? <button type="button" onClick={() => setOpen(value => !value)} className="border-b border-white/55 pb-1 text-sm font-bold text-white hover:border-[#F4C430]">Add dish +</button>
          : <span className="text-sm font-bold text-[#F4C430]">Plate complete · 4 dishes</span>}
        {currentTitles.length > 1 && currentTitles.map(title => {
          const remaining = currentTitles.filter(current => normalise(current) !== normalise(title))
          const href = remaining.length === 1
            ? `/recipes/combined?q=${encodeURIComponent(remaining[0])}`
            : `/recipes/combined?q=${encodeURIComponent(remaining.join(' + '))}`
          return <Link key={title} href={href} className="text-xs text-white/65 transition-colors hover:text-[#F4C430]" aria-label={`Remove ${title} from this meal`}>Remove {title} ×</Link>
        })}
      </div>
      {open && currentTitles.length < 4 && <div className="absolute left-0 top-full z-30 mt-3 w-[min(28rem,80vw)] border border-white/15 bg-[#FAF7F0] p-4 text-[#0D3B2A] shadow-2xl dark:bg-[#202720] dark:text-white"><label htmlFor="add-dish" className="text-xs font-bold">What should join this recipe?</label><input autoFocus id="add-dish" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try groundnut soup" autoComplete="off" className="mt-2 w-full border-0 border-b-2 border-[#0D3B2A] bg-transparent py-3 text-lg outline-none placeholder:text-[#0D3B2A]/35 dark:border-white dark:placeholder:text-white/35" />
      {matches.length > 0 && <div className="mt-2 border-t border-[#0D3B2A]/15 dark:border-white/15">{matches.map(title => {
        const combined = [...currentTitles, title].join(' + ')
        return <Link key={title} href={`/recipes/combined?q=${encodeURIComponent(combined)}`} onClick={() => { setOpen(false); setQuery('') }} className="flex justify-between gap-4 border-b border-[#0D3B2A]/10 px-4 py-3 last:border-0 hover:bg-[#F4C430]/20 dark:border-white/10"><span className="display-organic text-xl">{combined}</span><span className="text-xs font-bold">Add ↗</span></Link>
      })}</div>}</div>}
    </div>
  )
}

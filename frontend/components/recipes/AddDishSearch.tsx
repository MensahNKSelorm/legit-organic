'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export default function AddDishSearch({ currentTitles, catalogue }: { currentTitles: string[]; catalogue: string[] }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => query.trim().length < 1 ? [] : catalogue
    .filter(title => !currentTitles.some(current => normalise(current) === normalise(title)))
    .filter(title => normalise(title).includes(normalise(query)))
    .slice(0, 6), [catalogue, currentTitles, query])

  return (
    <div className="relative mt-10 border-t editorial-rule pt-5">
      <label htmlFor="add-dish" className="text-sm font-bold">Add another dish</label>
      <input id="add-dish" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try groundnut soup" autoComplete="off" className="mt-2 w-full border-0 border-b-2 border-[#0D3B2A] bg-transparent py-3 text-lg outline-none placeholder:text-[#0D3B2A]/35 dark:border-white dark:placeholder:text-white/35" />
      {matches.length > 0 && <div className="absolute inset-x-0 top-full z-20 border border-[#0D3B2A]/20 bg-[#FAF7F0] shadow-xl dark:border-white/15 dark:bg-[#202720]">{matches.map(title => {
        const combined = [...currentTitles, title].join(' + ')
        return <Link key={title} href={`/recipes/combined?q=${encodeURIComponent(combined)}`} className="flex justify-between gap-4 border-b border-[#0D3B2A]/10 px-4 py-3 last:border-0 hover:bg-[#F4C430]/20 dark:border-white/10"><span className="display-organic text-xl">{combined}</span><span className="text-xs font-bold">Add ↗</span></Link>
      })}</div>}
    </div>
  )
}

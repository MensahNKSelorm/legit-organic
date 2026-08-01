'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function CombinationNote({ titles, fallback }: { titles: string[]; fallback: string }) {
  const [note, setNote] = useState(fallback)

  useEffect(() => {
    const controller = new AbortController()
    api.recipes.combinationNote(titles, controller.signal)
      .then(result => setNote(result.note || fallback))
      .catch(() => setNote(fallback))
    return () => controller.abort()
  }, [fallback, titles])

  return <p className="mt-7 max-w-2xl text-base leading-7 text-white/75">{note}</p>
}

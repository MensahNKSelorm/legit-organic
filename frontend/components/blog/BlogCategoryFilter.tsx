'use client'

import { useRouter } from 'next/navigation'
import type { BlogCategory } from '@/types'

interface Props {
  categories: BlogCategory[]
  activeCategory?: string
}

export default function BlogCategoryFilter({ categories, activeCategory }: Props) {
  const router = useRouter()

  const base = 'px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap'
  const active = 'bg-[#F4C430] text-[#0D3B2A]'
  const inactive =
    'bg-[#F5F0E6] dark:bg-[#374151] text-charcoal dark:text-[#d1d5db] hover:bg-[#E6D8BD] dark:hover:bg-[#4b5563]'

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => router.push('/blog')}
        className={[base, !activeCategory ? active : inactive].join(' ')}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => router.push(`/blog?category=${cat.slug}`)}
          className={[base, activeCategory === cat.slug ? active : inactive].join(' ')}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

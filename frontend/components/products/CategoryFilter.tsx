'use client'

import { useRouter } from 'next/navigation'
import type { Category } from '@/types'

interface CategoryFilterProps {
  categories: Category[]
  activeCategory: string
}

const activeClass = 'bg-[#F4C430] text-[#0D3B2A]'
const inactiveClass =
  'bg-[#F5F0E6] dark:bg-[#374151] text-[#0D3B2A] dark:text-[#F9FAFB] hover:bg-[#E6D8BD] dark:hover:bg-[#4a4a4a]'

export default function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const router = useRouter()

  const navigate = (slug: string) => {
    router.push(slug ? `/products?category=${slug}` : '/products')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => navigate('')}
        className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
          activeCategory === '' ? activeClass : inactiveClass
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigate(cat.slug)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeCategory === cat.slug ? activeClass : inactiveClass
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

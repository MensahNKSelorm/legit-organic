'use client'

import { useState } from 'react'
import type { ProductDetail } from '@/types'

type Tab = 'details' | 'storage' | 'nutrition'

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: 'details', label: 'Product details', short: 'What it is' },
  { id: 'storage', label: 'Storage & handling', short: 'Keep it fresh' },
  { id: 'nutrition', label: 'Nutritional information', short: 'What it offers' },
]

function scoreMessage(score: number) {
  if (score >= 80) return 'An excellent nutritional profile for everyday meals.'
  if (score >= 60) return 'A strong addition to a varied, balanced diet.'
  return 'Best enjoyed as one part of a balanced meal.'
}

export default function ProductTabs({ product }: { product: ProductDetail }) {
  const [active, setActive] = useState<Tab>('details')
  const score = Math.max(0, Math.min(100, product.nutritional_score || 0))

  return (
    <div>
      <div className="grid border-y border-[#0D3B2A]/20 dark:border-white/15 md:grid-cols-3" role="tablist" aria-label="Product information">
        {TABS.map((tab, index) => {
          const selected = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`relative px-5 py-6 text-left transition-colors md:px-7 ${index ? 'border-t border-[#0D3B2A]/20 dark:border-white/15 md:border-l md:border-t-0' : ''} ${selected ? 'bg-[#0D3B2A] text-white dark:bg-[#F4C430] dark:text-[#0D3B2A]' : 'hover:bg-[#E6D8BD]/55 dark:hover:bg-white/5'}`}
            >
              <span className={`block text-[10px] font-bold uppercase tracking-[.16em] ${selected ? 'text-[#F4C430] dark:text-[#0D3B2A]/65' : 'text-[#2E7D32] dark:text-[#9FC5A4]'}`}>{tab.short}</span>
              <span className="display-organic mt-2 block text-2xl leading-none">{tab.label}</span>
              {selected && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#F4C430] dark:bg-[#0D3B2A]" />}
            </button>
          )
        })}
      </div>

      <div className="pt-12 md:pt-16">
        {active === 'details' && (
          <div id="panel-details" role="tabpanel" className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
            <div>
              <h3 className="display-organic text-4xl leading-tight md:text-5xl">The essentials, at a glance.</h3>
              <p className="mt-5 leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">Useful information about what you are buying and where it comes from.</p>
            </div>
            <div>
              <div className="prose prose-lg max-w-none text-[#5B3E31] dark:prose-invert dark:text-[#D5E7D8]" dangerouslySetInnerHTML={{ __html: product.description }} />
              <dl className="mt-10 border-y border-[#0D3B2A]/20 dark:border-white/15">
                {[
                  ['Category', product.category?.name],
                  ['Growing region', product.region?.name],
                  ['Purchase unit', product.unit],
                  ...(product.ingredients ? [['Ingredients', product.ingredients]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[.7fr_1.3fr] gap-5 border-b border-[#0D3B2A]/15 py-4 last:border-b-0 dark:border-white/10">
                    <dt className="text-xs font-bold uppercase tracking-[.14em] text-[#2E7D32] dark:text-[#9FC5A4]">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {active === 'storage' && (
          <div id="panel-storage" role="tabpanel" className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <h3 className="display-organic text-4xl leading-tight md:text-5xl">Keep it at its best.</h3>
              <p className="mt-5 max-w-md leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">A little care after delivery helps protect flavour, texture and shelf life.</p>
            </div>
            <div className="border-l-2 border-[#F4C430] pl-7 text-lg leading-8 text-[#5B3E31] dark:text-[#D5E7D8] md:pl-10">
              {product.storage_tips ? (
                <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.storage_tips }} />
              ) : (
                <p>Store in a cool, dry place away from direct sunlight. Once opened, keep in an airtight container and consume within the recommended period.</p>
              )}
            </div>
          </div>
        )}

        {active === 'nutrition' && (
          <div id="panel-nutrition" role="tabpanel" className="grid items-center gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {score > 0 ? (
                <div
                  className="relative grid size-52 place-items-center rounded-full md:size-60"
                  style={{ background: `conic-gradient(#2E7D32 ${score}%, rgba(46,125,50,.14) ${score}% 100%)` }}
                  aria-label={`Nutritional score ${score} out of 100`}
                >
                  <div className="grid size-[82%] place-items-center rounded-full bg-[#F5F0E6] text-center dark:bg-[#202621]">
                    <div><strong className="display-organic block text-6xl leading-none text-[#0D3B2A] dark:text-[#F4C430]">{score}</strong><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#5B3E31] dark:text-[#B8D4BD]">out of 100</span></div>
                  </div>
                </div>
              ) : (
                <div className="grid size-52 place-items-center rounded-full border border-dashed border-[#0D3B2A]/30 text-sm text-[#5B3E31] dark:border-white/25 dark:text-[#B8D4BD]">Score pending</div>
              )}
              <p className="mt-6 max-w-xs font-medium text-[#2E7D32] dark:text-[#9FC5A4]">{score ? scoreMessage(score) : 'Nutritional scoring will appear once the product information is complete.'}</p>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#2E7D32] dark:text-[#9FC5A4]">Nutritional profile</p>
              <h3 className="display-organic mt-4 text-4xl leading-tight md:text-6xl">What this food brings to the table.</h3>
              <div className="mt-8 border-t border-[#0D3B2A]/20 pt-7 text-lg leading-8 text-[#5B3E31] dark:border-white/15 dark:text-[#D5E7D8]">
                {product.nutritional_info ? (
                  <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.nutritional_info }} />
                ) : (
                  <p>Detailed nutritional information is being prepared. This product contains no synthetic additives or preservatives.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

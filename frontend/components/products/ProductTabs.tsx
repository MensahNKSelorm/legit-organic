'use client'

import { useState } from 'react'
import type { ProductDetail } from '@/types'

type Tab = 'details' | 'storage' | 'nutrition'

const TABS: { id: Tab; label: string }[] = [
  { id: 'details',   label: 'Details' },
  { id: 'storage',   label: 'Storage & Handling' },
  { id: 'nutrition', label: 'Nutritional Info' },
]

export default function ProductTabs({ product }: { product: ProductDetail }) {
  const [active, setActive] = useState<Tab>('details')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#E6D8BD] dark:border-[#374151] mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              'px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
              active === tab.id
                ? 'border-[#F4C430] text-[#0D3B2A] dark:text-[#faf7f0]'
                : 'border-transparent text-charcoal/50 hover:text-[#0D3B2A] dark:hover:text-[#faf7f0]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details */}
      {active === 'details' && (
        <div className="space-y-6 text-charcoal/70 dark:text-[#d1d5db] leading-relaxed">
          <p>{product.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-beige dark:bg-[#374151] rounded-xl p-4">
              <p className="text-xs font-semibold text-charcoal/50 dark:text-[#9ca3af] uppercase tracking-wide mb-1">
                Category
              </p>
              <p className="font-semibold text-forest-green dark:text-[#81C784]">
                {product.category?.name}
              </p>
            </div>
            <div className="bg-beige dark:bg-[#374151] rounded-xl p-4">
              <p className="text-xs font-semibold text-charcoal/50 dark:text-[#9ca3af] uppercase tracking-wide mb-1">
                Region
              </p>
              <p className="font-semibold text-forest-green dark:text-[#81C784]">{product.region?.name}</p>
            </div>
            <div className="bg-beige dark:bg-[#374151] rounded-xl p-4">
              <p className="text-xs font-semibold text-charcoal/50 dark:text-[#9ca3af] uppercase tracking-wide mb-1">
                Unit
              </p>
              <p className="font-semibold text-forest-green dark:text-[#81C784]">{product.unit}</p>
            </div>
          </div>

          {product.ingredients && (
            <div>
              <h4 className="font-semibold text-forest-green dark:text-[#faf7f0] mb-2">
                Ingredients
              </h4>
              <p>{product.ingredients}</p>
            </div>
          )}
        </div>
      )}

      {/* Storage */}
      {active === 'storage' && (
        <div className="text-charcoal/70 dark:text-[#d1d5db] leading-relaxed space-y-4">
          {product.storage_tips ? (
            <p>{product.storage_tips}</p>
          ) : (
            <p>
              Store in a cool, dry place away from direct sunlight. Once opened, keep in an
              airtight container and consume within the recommended period.
            </p>
          )}
        </div>
      )}

      {/* Nutrition */}
      {active === 'nutrition' && (
        <div className="text-charcoal/70 dark:text-[#d1d5db] leading-relaxed space-y-4">
          {/* Score indicator — top-right */}
          {product.nutritional_score && product.nutritional_score > 0 ? (
            <div className="flex justify-end">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{
                    backgroundColor:
                      product.nutritional_score >= 80
                        ? '#2E7D32'
                        : product.nutritional_score >= 60
                        ? '#F4C430'
                        : '#E65100',
                    color:
                      product.nutritional_score >= 60 && product.nutritional_score < 80
                        ? '#0D3B2A'
                        : '#ffffff',
                  }}
                >
                  {product.nutritional_score}
                </div>
                <p className="text-xs text-charcoal/50 dark:text-[#9ca3af] text-center leading-tight">
                  Nutritional<br />Score
                </p>
              </div>
            </div>
          ) : null}

          {product.nutritional_info ? (
            <p>{product.nutritional_info}</p>
          ) : (
            <p>
              Detailed nutritional information coming soon. All our products are certified
              organic with no synthetic additives or preservatives.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

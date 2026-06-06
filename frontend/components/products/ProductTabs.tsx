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
            <>
              <p>Store in a cool, dry place away from direct sunlight and heat sources.</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Keep away from moisture and humidity</li>
                <li>Transfer to an airtight container after opening</li>
                <li>Refrigerate perishable items promptly upon delivery</li>
                <li>Use within the recommended period after opening</li>
                <li>Keep out of reach of children and pets</li>
              </ul>
              <p className="text-sm text-charcoal/40 dark:text-[#6b7280] mt-4">
                Product-specific storage guidance will be added soon.
              </p>
            </>
          )}
        </div>
      )}

      {/* Nutrition */}
      {active === 'nutrition' && (
        <div className="text-charcoal/70 dark:text-[#d1d5db] leading-relaxed space-y-4">
          {product.nutritional_info ? (
            <p>{product.nutritional_info}</p>
          ) : (
            <>
              <p>
                This product is certified organic and cultivated without synthetic pesticides,
                herbicides, or artificial fertilisers.
              </p>
              <p>
                Organic farming preserves natural nutrient profiles, meaning you get the full
                benefit of what nature intended — no chemical residues, no artificial additives.
              </p>
              <p className="text-sm text-charcoal/40 dark:text-[#6b7280]">
                Full nutritional breakdown per serving will be available soon.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

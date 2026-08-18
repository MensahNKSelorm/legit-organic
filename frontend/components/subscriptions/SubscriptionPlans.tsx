'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { SubscriptionPlan } from '@/types'

const PREVIEW_PLANS: SubscriptionPlan[] = [
  { id: -1, name: 'Solo', slug: 'solo', audience: 'household', plan_type: 'curated', short_description: 'A practical weekly mix for one.', weekly_price: '145.00', household_size: 1, image: null, is_featured: false, items: [] },
  { id: -2, name: 'Family', slug: 'family', audience: 'household', plan_type: 'curated', short_description: 'Staples and fresh produce for a family.', weekly_price: '295.00', household_size: 4, image: null, is_featured: true, items: [] },
  { id: -3, name: 'Large household', slug: 'large-household', audience: 'household', plan_type: 'curated', short_description: 'A fuller basket for busy homes.', weekly_price: '460.00', household_size: 6, image: null, is_featured: false, items: [] },
]

function BasketSizeMark({ size = 1 }: { size?: number | null }) {
  const count = size && size >= 6 ? 17 : size && size >= 4 ? 10 : 4
  const layouts = {
    4: [[17, 30, 3, -8, .88], [28, 28, 0, 5, .82], [39, 30, 1, -4, .86], [49, 27, 2, 9, .8]],
    10: [[14, 32, 3, -9, .8], [23, 30, 0, 4, .78], [32, 32, 4, -3, .84], [41, 30, 1, 7, .8], [50, 32, 2, -7, .76], [18, 24, 1, 8, .8], [28, 23, 2, -8, .76], [38, 24, 0, 3, .82], [47, 23, 3, 8, .78], [33, 16, 4, -5, .84]],
    17: [[13, 33, 3, -10, .76], [21, 31, 0, 4, .74], [29, 33, 4, -3, .8], [37, 31, 1, 8, .76], [45, 33, 2, -8, .72], [52, 31, 0, 5, .74], [16, 26, 1, 7, .76], [25, 24, 2, -9, .72], [34, 26, 0, 3, .78], [43, 24, 3, 10, .74], [50, 26, 4, -5, .78], [20, 18, 4, -7, .76], [29, 17, 0, 5, .74], [38, 18, 1, -3, .78], [47, 17, 2, 8, .72], [29, 10, 3, -8, .74], [40, 10, 4, 6, .76]],
  } as const
  const produce = layouts[count as keyof typeof layouts].map(([x, y, kind, rotation, scale], index) => ({
    x, y, kind, rotation, scale,
    color: ['#F4C430', '#6E9B70', '#D77A3D', '#A85D3A', '#8AA65E'][index % 5],
  }))

  return (
    <svg className="subscription-basket h-20 w-20 text-[#75917C] opacity-55 group-hover:opacity-90 [--basket-fill:#FFFDF8] dark:text-[#A4BBA8] dark:[--basket-fill:#202620]" viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <clipPath id={`plan-basket-produce-${count}`}>
          <rect x="10" y="0" width="44" height="56" />
        </clipPath>
      </defs>
      <path d="M19 31c2-12 7-18 13-18s11 6 13 18" stroke="currentColor" strokeWidth="1.4" />
      <g clipPath={`url(#plan-basket-produce-${count})`}>{produce.map((item, index) => (
        <g key={index} transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}>
          <g className="subscription-produce" style={{ '--produce-index': index } as CSSProperties}>
          {item.kind === 0 && <><circle cx="0" cy="1" r="7" fill={item.color} stroke="currentColor" /><path d="M-1-6c0-4 2-6 5-7M2-8c4-2 7-1 8 2-4 2-7 1-8-2Z" fill="#6E9B70" stroke="currentColor" /></>}
          {item.kind === 1 && <><circle cx="0" cy="1" r="8" fill={item.color} stroke="currentColor" /><path d="M-6 2c2-7 5-9 7-2 2-7 6-5 6 2M-4 6c1-5 4-6 5-1 2-5 4-4 5 0" stroke="#DCE8D8" strokeWidth="1.4" /></>}
          {item.kind === 2 && <><path d="M-4-7C5-5 7 1 2 9l-8-3 2-13Z" fill={item.color} stroke="currentColor" /><path d="M-3-7c-2-4 0-7 3-9M-2-7c3-4 6-5 9-3" stroke="currentColor" /></>}
          {item.kind === 3 && <><path d="M-10-2c5 9 14 11 20 2-3 13-16 16-22 4" fill="#F4C430" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M-8-1c4 6 11 8 16 2" stroke="#8AA65E" /></>}
          {item.kind === 4 && <><path d="M-9 2c2-8 8-11 13-6 7-1 9 7 4 11-7 5-15 2-17-5Z" fill={item.color} stroke="currentColor" /><path d="M-5 3c4-2 7-2 11 1" stroke="#DCE8D8" /></>}
          </g>
        </g>
      ))}</g>
      <path d="M10 31h44l-5 25H15l-5-25Z" fill="var(--basket-fill)" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 31H54M18 42H50M16 49H49" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(PREVIEW_PLANS)

  useEffect(() => {
    api.subscriptions.plans('household').then((rows) => {
      if (rows.length) setPlans(rows)
    }).catch(() => undefined)
  }, [])

  return (
    <div className="subscription-plan-grid grid gap-px overflow-hidden border border-[#D8CEBC] bg-[#D8CEBC] md:grid-cols-3 dark:border-white/15 dark:bg-white/15">
      {plans.map((plan, index) => (
        <article key={plan.slug} style={{ '--plan-index': index } as CSSProperties} className="subscription-plan-card group relative flex min-h-[25rem] flex-col overflow-hidden bg-[#FFFDF8] p-7 md:p-8 dark:bg-[#202620]">
          <div className="mb-auto flex items-start justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#53705A] dark:text-[#A8C4AE]">
              {plan.household_size ? `${plan.household_size} ${plan.household_size === 1 ? 'person' : 'people'}` : 'Flexible'}
            </span>
            <BasketSizeMark size={plan.household_size} />
          </div>
          <div className="mt-16">
            <h3 className="font-sans text-3xl font-semibold tracking-[-.04em] text-[#173C2A] dark:text-white">{plan.name}</h3>
            <p className="mt-3 max-w-[17rem] text-sm leading-6 text-[#675E52] dark:text-[#BBC8BD]">{plan.short_description}</p>
          </div>
          <div className="mt-10 border-t border-[#D8CEBC] pt-6 dark:border-white/15">
            <p className="text-2xl font-semibold tracking-[-.03em] text-[#173C2A] dark:text-white">
              GH₵{Number(plan.weekly_price).toFixed(0)} <span className="text-sm font-normal text-[#675E52] dark:text-[#A8B5AA]">/ week</span>
            </p>
            <Link href={`/subscriptions/start?plan=${plan.slug}`} className="mt-6 inline-flex items-center gap-3 border-b border-[#173C2A] pb-1 text-sm font-bold text-[#173C2A] transition-[gap] hover:gap-5 dark:border-[#F4C430] dark:text-[#F4C430]">
              Choose plan <span aria-hidden>→</span>
            </Link>
          </div>
        </article>
      ))}
      <style jsx>{`
        .subscription-plan-card {
          animation: plan-rise 700ms cubic-bezier(.2,.75,.25,1) both;
          animation-delay: calc(var(--plan-index) * 110ms);
          transition: transform 420ms cubic-bezier(.2,.75,.25,1), background-color 300ms ease;
        }
        .subscription-plan-card::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 4px;
          background: #2E7D32;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 420ms cubic-bezier(.2,.75,.25,1);
        }
        .subscription-plan-card:hover { transform: translateY(-8px); }
        .subscription-plan-card:hover::after { transform: scaleX(1); }
        .subscription-basket { transition: opacity 350ms ease, transform 450ms cubic-bezier(.2,.75,.25,1); }
        .subscription-plan-card:hover .subscription-basket { transform: translateY(-4px) rotate(-1deg); }
        .subscription-produce { transform-origin: center; transform-box: fill-box; }
        .subscription-plan-card:hover .subscription-produce { animation: produce-settle 700ms cubic-bezier(.2,.75,.25,1) both; animation-delay: calc(var(--produce-index) * 70ms); }
        @keyframes plan-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes produce-settle { 0% { transform: translateY(0); } 45% { transform: translateY(-5px); } 100% { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .subscription-plan-card { animation: none; transition: none; }
          .subscription-plan-card:hover { transform: none; }
          .subscription-plan-card:hover .subscription-produce { animation: none; }
        }
      `}</style>
    </div>
  )
}

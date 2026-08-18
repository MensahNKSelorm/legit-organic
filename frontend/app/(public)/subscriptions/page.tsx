import Link from 'next/link'
import SubscriptionPlans from '@/components/subscriptions/SubscriptionPlans'
import ManageDeliveriesLink from '@/components/subscriptions/ManageDeliveriesLink'

const HERO_PRODUCE = [
  [43, 72, 3, -12, 1.08], [61, 70, 0, 5, 1.02], [80, 73, 4, -4, 1.12],
  [100, 69, 1, 9, 1.05], [120, 72, 2, -9, 1], [141, 70, 5, 7, 1.06],
  [160, 73, 0, -5, 1.02], [178, 70, 3, 11, 1.04],
  [50, 58, 1, 8, 1.06], [70, 55, 2, -10, 1], [92, 58, 0, 4, 1.08],
  [114, 54, 3, 12, 1.03], [136, 58, 4, -7, 1.08], [157, 55, 1, 5, 1.04],
  [174, 59, 2, -8, .98],
  [61, 43, 4, -6, 1.03], [84, 42, 0, 7, 1.06], [108, 40, 1, -4, 1.08],
  [133, 43, 5, 8, 1.02], [157, 42, 3, -9, 1.04],
  [93, 29, 2, -7, 1], [126, 28, 4, 6, 1.06],
] as const

export default function SubscriptionsPage() {
  return (
    <main className="min-h-screen bg-[#F4EFE4] text-[#173C2A] dark:bg-[#171B18] dark:text-white">
      <section className="subscription-hero page-container relative grid min-h-[38rem] gap-12 overflow-hidden pb-16 pt-32 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:pb-24 lg:pt-40">
        <div className="subscription-hero-copy">
          <p className="subscription-kicker text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Weekly food delivery</p>
          <h1 className="subscription-title display-organic mt-5 max-w-4xl text-6xl leading-[.86] sm:text-7xl lg:text-[7.5rem]">
            Your week,<br /><em className="font-normal text-[#2E7D32] dark:text-[#F4C430]">already stocked.</em>
          </h1>
        </div>
        <div className="subscription-intro border-l border-[#C9BEAA] pl-6 lg:mb-3 dark:border-white/20">
          <p className="max-w-sm text-base leading-7 text-[#5B574E] dark:text-[#C4CEC6]">Pick a weekly basket or build your own. Skip, pause or cancel anytime.</p>
          <ManageDeliveriesLink />
        </div>
      </section>

      <div className="subscription-track h-px overflow-hidden bg-[#C9BEAA] dark:bg-white/15" aria-hidden><span className="block h-px w-28 bg-[#2E7D32] dark:bg-[#F4C430]" /></div>

      <section className="bg-[#E8E0CF] py-16 md:py-24 dark:bg-[#101511]">
        <div className="page-container">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="font-sans text-3xl font-semibold tracking-[-.04em] md:text-5xl">Choose your basket</h2>
            <Link href="/subscriptions/start?plan=custom" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Build your week →</Link>
          </div>
          <SubscriptionPlans />
        </div>
      </section>

      <section className="page-container py-20 md:py-28">
        <div className="weekly-sequence grid overflow-hidden border border-[#173C2A]/20 lg:grid-cols-[1.12fr_.88fr] dark:border-white/15">
          <div className="weekly-sequence-main relative min-h-[23rem] overflow-hidden bg-[#173C2A] p-8 text-white md:p-12">
            <div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#F4C430]">Every week</p>
            <h2 className="display-organic mt-8 text-6xl leading-[.88] md:text-8xl">Pick what<br /><em className="weekly-home-text font-normal text-[#F4C430]">comes home.</em></h2></div>
            <svg className="weekly-crate absolute -bottom-5 right-2 z-0 h-44 w-52 text-white/20 md:right-8 md:h-56 md:w-64" viewBox="0 0 220 170" fill="none" aria-hidden>
              <defs><clipPath id="weekly-basket-width"><rect x="26" y="0" width="168" height="156" /></clipPath></defs>
              <path d="M55 64c8-40 27-57 55-57s47 17 55 57" stroke="currentColor" strokeWidth="2" />
              <g clipPath="url(#weekly-basket-width)">{HERO_PRODUCE.map(([x, y, kind, rotation, scale], index) => {
                const colors = ['#F4C430', '#6E9B70', '#D77A3D', '#E8E0CF', '#A85D3A']
                const color = colors[index % colors.length]
                return <g key={index} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
                  {kind === 0 && <><circle r="12" fill={color}/><path d="M-2-11c0-7 4-10 9-12M3-16c7-2 11 0 12 5-6 3-10 1-12-5Z" fill="#6E9B70" stroke="#173C2A" strokeWidth="2"/></>}
                  {kind === 1 && <><circle r="14" fill={color}/><path d="M-10 3c4-13 9-14 12-2 3-12 10-9 10 3M-7 9c3-8 7-8 9-1 4-7 8-5 8 1" stroke="#E5EFDF" strokeWidth="2"/></>}
                  {kind === 2 && <><path d="M-6-13C9-9 12 2 4 15L-9 9-6-13Z" fill={color}/><path d="M-5-12c-2-7 1-11 6-14M-3-11c6-6 11-7 16-4" stroke="#173C2A" strokeWidth="2"/></>}
                  {kind === 3 && <><path d="M-17-3c8 17 23 19 35 2-7 23-28 24-38 8" fill="#F4C430" stroke="#173C2A" strokeWidth="4" strokeLinecap="round"/><path d="M-13-1c7 11 19 12 27 2" stroke="#6E9B70" strokeWidth="2"/></>}
                  {kind === 4 && <><path d="M-15 2c4-14 15-18 23-9 11-1 14 12 6 19-12 8-25 4-29-10Z" fill={color}/><path d="M-9 4c7-5 13-4 20 2" stroke="#E5EFDF" strokeWidth="2"/></>}
                  {kind === 5 && <><path d="M-14-4c5-10 20-13 27-3 7 10-4 22-17 20-11-1-16-9-10-17Z" fill="#A85D3A"/><path d="M-5-6c7-5 15-2 17 4-5 7-13 9-20 5" stroke="#F2D2BC" strokeWidth="3"/></>}
                </g>
              })}</g>
              <path d="M25 64h170l-18 88H43L25 64Z" fill="#173C2A" stroke="currentColor" strokeWidth="2" />
              <path d="M25 64H195M37 94H183M32 122H184" stroke="#AFC7B4" strokeOpacity=".58" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="grid bg-[#FFFDF8] dark:bg-[#202620]">
            <div className="weekly-info-panel flex items-end justify-between gap-6 border-b border-[#173C2A]/20 bg-[#EFE7D7] p-8 md:p-10 dark:border-white/15 dark:bg-[#262E27]">
              <div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#53705A] dark:text-[#A4B8A8]">Payment</p><p className="mt-3 max-w-xs text-lg font-semibold leading-6">A new renewal order is created each week. You choose when to pay it securely with SeevCash.</p></div>
              <svg className="weekly-info-mark h-24 w-28 shrink-0 text-[#173C2A] dark:text-[#D7E5D9]" viewBox="0 0 112 96" fill="none" aria-hidden><g transform="rotate(-8 38 48)"><rect x="4" y="24" width="72" height="45" fill="#FFFDF8" stroke="currentColor" strokeWidth="1.8"/><path d="M4 37h72" stroke="currentColor" strokeWidth="5"/><rect x="13" y="48" width="13" height="10" fill="#F4C430" stroke="currentColor"/><path d="M34 54h28M13 63h36" stroke="currentColor" strokeWidth="1.5"/></g><g><rect x="67" y="8" width="39" height="78" rx="6" fill="#F4C430" stroke="currentColor" strokeWidth="2"/><path d="M80 15h13M80 78h13" stroke="#173C2A" strokeWidth="2"/><path d="M78 45c5-7 12-7 17 0M82 50c3-4 6-4 9 0" stroke="#173C2A" strokeWidth="2"/></g></svg>
            </div>
            <div className="weekly-info-panel flex items-end justify-between gap-6 bg-[#FFFDF8] p-8 md:p-10 dark:bg-[#202620]">
              <div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#53705A] dark:text-[#A4B8A8]">Your week</p><p className="mt-3 max-w-xs text-lg font-semibold leading-6">Skip, pause or cancel<br />before the cutoff.</p></div>
              <svg className="weekly-info-mark h-20 w-24 shrink-0 text-[#173C2A] dark:text-[#D7E5D9]" viewBox="0 0 96 80" fill="none" aria-hidden><path d="M14 15h67v58H14zM14 31h67M28 8v15M67 8v15" stroke="currentColor" strokeWidth="1.5"/><path d="M31 45v15M39 45v15" stroke="#2E7D32" strokeWidth="4"/><path d="M57 47h12M63 41v12" stroke="#F4C430" strokeWidth="3"/></svg>
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .subscription-kicker { animation: subscription-reveal 550ms 80ms ease-out both; }
        .subscription-title { animation: subscription-reveal 820ms 150ms cubic-bezier(.2,.75,.25,1) both; }
        .subscription-intro { animation: subscription-reveal 700ms 330ms ease-out both; }
        .subscription-track span { animation: subscription-travel 8s linear infinite; }
        .weekly-home-text { -webkit-text-stroke: 1px #173C2A; paint-order: stroke fill; }
        .weekly-crate { transition: transform 700ms cubic-bezier(.2,.75,.25,1); }
        .weekly-sequence-main:hover .weekly-crate { transform: translate(-8px, -8px) rotate(-2deg); }
        .weekly-info-mark { transition: transform 500ms cubic-bezier(.2,.75,.25,1); }
        .weekly-info-panel:hover .weekly-info-mark { transform: translateY(-5px); }
        @keyframes subscription-reveal { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes subscription-travel { from { transform: translateX(-7rem); } to { transform: translateX(100vw); } }
        @media (prefers-reduced-motion: reduce) {
          .subscription-kicker, .subscription-title, .subscription-intro, .subscription-track span { animation: none; }
          .weekly-crate, .weekly-info-mark { transition: none; }
        }
      `}</style>
    </main>
  )
}

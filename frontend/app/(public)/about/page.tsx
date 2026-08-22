import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Why Legit Organic Exists',
  description: 'Why Legit Organic is building a clearer route between Ghanaian farms and the people they feed.',
  path: '/about',
})

const principles = [
  { number: '01', title: 'Start with the soil', body: 'Healthy harvests begin below the surface. Growing practices should protect the land expected to feed the next season too.' },
  { number: '02', title: 'Keep farmers visible', body: 'Good food depends on growers having a fair route to market and being recognised for the value they create.' },
  { number: '03', title: 'Make information useful', body: 'Origin, availability and handling should help someone choose. The details should be easy to understand.' },
] as const

const route = [
  ['Source', 'Work with Ghanaian growers and suppliers.'],
  ['Select', 'Choose produce for freshness, usefulness and the season.'],
  ['Explain', 'Keep origin and handling information close to the food.'],
  ['Deliver', 'Move food into homes and working kitchens with care.'],
] as const

export default function AboutPage() {
  return (
    <div className="bg-[#FAF7F0] text-[#0D3B2A] dark:bg-[#171B18] dark:text-[#FEFCF7]">
      <section className="grid min-h-[88svh] border-b border-white/15 bg-[#0D3B2A] pt-[76px] text-white lg:grid-cols-[1.15fr_.85fr]">
        <div className="page-container flex items-end py-14 lg:mr-0 lg:pr-16 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:py-20">
          <div className="max-w-4xl">
            <p className="max-w-lg text-lg leading-8 text-[#B8D4BD]">Legit Organic began with a simple frustration: shoppers often know too little about where their food comes from.</p>
            <h1 className="display-organic mt-12 text-[clamp(4.6rem,9vw,9.5rem)] leading-[.78] tracking-[-.055em]">Know your food <span className="font-normal text-[#F4C430]">better.</span></h1>
          </div>
        </div>
        <figure className="relative min-h-[45vh] overflow-hidden lg:min-h-0">
          <Image src="/images/hero/8.webp" alt="Fresh produce from Ghanaian farms" fill priority sizes="(max-width: 1024px) 100vw, 43vw" className="object-cover transition-transform duration-700 hover:scale-[1.02]" />
          <figcaption className="absolute right-0 bottom-0 max-w-xs bg-[#F4C430] p-5 text-sm leading-6 text-[#0D3B2A]">Clear information makes food easier to choose.</figcaption>
        </figure>
      </section>

      <section className="page-container py-20 md:py-28" aria-labelledby="about-work-title">
        <div className="grid gap-12 lg:grid-cols-[.55fr_1.45fr] lg:gap-24">
          <h2 id="about-work-title" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">What we are building</h2>
          <div>
            <p className="display-organic max-w-5xl text-4xl leading-[1.05] md:text-6xl">A clearer route from Ghanaian farms to the homes and kitchens they feed.</p>
            <div className="mt-12 grid gap-8 border-t border-[#0D3B2A]/20 pt-8 text-lg leading-8 text-[#5B3E31] md:grid-cols-2 dark:border-white/15 dark:text-[#B8D4BD]">
              <p>We bring produce into one marketplace while making freshness, origin and responsible handling easier to understand.</p>
              <p>That means giving growers a useful route to customers and giving customers enough context to choose with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#0D3B2A]/20 bg-[#EFE7D7] dark:border-white/15 dark:bg-[#202620]" aria-labelledby="principles-title">
        <div className="page-container grid gap-12 py-20 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
          <div>
            <h2 id="principles-title" className="display-organic max-w-lg text-5xl leading-[.9] md:text-7xl">What we want to keep as we grow.</h2>
          </div>
          <div className="border-t border-[#0D3B2A]/25 dark:border-white/20">
            {principles.map((item) => (
              <article key={item.number} className="grid gap-5 border-b border-[#0D3B2A]/25 py-9 sm:grid-cols-[3rem_1fr] dark:border-white/20">
                <span className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">{item.number}</span>
                <div><h3 className="display-organic text-3xl md:text-4xl">{item.title}</h3><p className="mt-4 max-w-xl leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">{item.body}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-20 md:py-28" aria-labelledby="route-title">
        <div className="flex flex-col justify-between gap-6 border-b border-[#0D3B2A]/25 pb-8 md:flex-row md:items-end dark:border-white/20">
          <h2 id="route-title" className="display-organic text-5xl leading-none md:text-7xl">How the work moves.</h2>
          <p className="max-w-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">We keep each step clear, from sourcing to delivery.</p>
        </div>
        <ol className="grid border-b border-[#0D3B2A]/25 md:grid-cols-4 dark:border-white/20">
          {route.map(([title, body], index) => (
            <li key={title} className="border-b border-[#0D3B2A]/20 py-8 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0 dark:border-white/15">
              <span className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">0{index + 1}</span>
              <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#F4C430] text-[#0D3B2A]">
        <div className="page-container grid items-end gap-10 py-16 md:grid-cols-[1fr_auto] md:py-20">
          <h2 className="display-organic max-w-4xl text-5xl leading-[.9] md:text-7xl">Shop today or plan next week&apos;s basket.</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/products" className="bg-[#0D3B2A] px-7 py-4 font-bold text-white transition-colors hover:bg-white hover:text-[#0D3B2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D3B2A]">Visit the market</Link>
            <Link href="/subscriptions" className="border border-[#0D3B2A] px-7 py-4 font-bold transition-colors hover:bg-[#0D3B2A] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D3B2A]">Plan the week</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

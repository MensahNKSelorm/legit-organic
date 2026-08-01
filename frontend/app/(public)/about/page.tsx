import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn how Legit Organic is building a more trustworthy connection between Ghanaian farms and the people they feed.",
}

const beliefs = [
  ['Healthy soil changes everything.', 'Farming starts below the surface. We support growing practices that protect the land responsible for every harvest.'],
  ['Farmers deserve a fair route to market.', 'Good food depends on growers being recognised, supported and paid fairly for the value they create.'],
  ['People should know what they are eating.', 'Origin and handling information should be useful, understandable and close to the food—not hidden in paperwork.'],
]

export default function AboutPage() {
  return (
    <div className="bg-[#faf7f0] text-[#0d3b2a] dark:bg-[#171b18] dark:text-[#fefcf7]">
      <section className="grid min-h-[92svh] bg-[#0d3b2a] pt-[76px] text-white lg:grid-cols-2">
        <div className="flex items-end px-6 py-16 md:px-12 lg:px-[max(3rem,calc((100vw-80rem)/2+1.5rem))] lg:py-20">
          <div className="max-w-2xl">
            <p className="max-w-md text-lg leading-8 text-[#b8d4bd]">Legit Organic began with a simple frustration: buying food should not require guessing how it was grown or where it came from.</p>
            <h1 className="display-organic mt-10 text-[clamp(4rem,8vw,8.5rem)] leading-[.82]">Closer to the farm.<br /><em className="font-normal text-[#f4c430]">Closer to trust.</em></h1>
          </div>
        </div>
        <div className="relative min-h-[55vh] lg:min-h-0">
          <Image src="/images/hero/8.webp" alt="Fresh produce from Ghanaian farms" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3b2a]/50 to-transparent lg:bg-gradient-to-r" />
        </div>
      </section>

      <section className="page-container py-24 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:gap-28">
          <p className="display-organic text-4xl leading-tight text-[#2e7d32] dark:text-[#9fc5a4]">A food system becomes stronger when the distance between people and producers becomes smaller.</p>
          <div className="space-y-8 text-lg leading-8 text-[#5b3e31] dark:text-[#d5e7d8]">
            <p>We connect households with produce sourced from Ghanaian farms while making freshness, origin and responsible handling easier to understand.</p>
            <p>This is not only about selling vegetables. It is about creating a marketplace where honest farming is valuable, trustworthy food is easier to find, and local agriculture has room to grow.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f0e6] py-24 dark:bg-[#202621] md:py-32">
        <div className="page-container">
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
            <div>
              <h2 className="display-organic text-5xl leading-[.95] md:text-7xl">What we want to protect as we grow.</h2>
            </div>
            <div className="border-t border-[#0d3b2a]/20 dark:border-white/20">
              {beliefs.map(([title, body]) => (
                <article key={title} className="border-b border-[#0d3b2a]/20 py-10 dark:border-white/20">
                  <h3 className="display-organic text-3xl">{title}</h3>
                  <p className="mt-4 max-w-xl leading-7 text-[#5b3e31] dark:text-[#b8d4bd]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#f4c430] py-20 text-[#0d3b2a] md:py-28">
        <div className="page-container grid items-end gap-10 md:grid-cols-[1fr_auto]">
          <h2 className="display-organic max-w-4xl text-5xl leading-[.92] md:text-7xl">Bring better food into your everyday life.</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/products" className="bg-[#0d3b2a] px-7 py-4 font-bold text-white">Shop produce</Link>
            <Link href="/contact" className="border border-[#0d3b2a] px-7 py-4 font-bold">Talk to us</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

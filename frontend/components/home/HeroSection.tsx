'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const produce = [
  { src: '/images/hero/1.webp', label: 'Harvested in Ghana' },
  { src: '/images/hero/8.webp', label: 'Naturally grown' },
  { src: '/images/hero/5.webp', label: 'Delivered fresh' },
]

export default function HeroSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % produce.length), 5200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="grain-overlay relative overflow-hidden bg-[#0d3b2a] text-[#fefcf7]">
      <div className="absolute inset-0 opacity-[0.13] field-grid" aria-hidden />
      <div className="page-container relative z-10 grid min-h-[100svh] items-center pb-20 pt-24 lg:h-[100svh] lg:min-h-[700px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-20 lg:pt-24 xl:gap-20">
        <div className="relative z-20 max-w-[34rem] lg:max-w-none">
          <p className="reveal-up font-medium text-[#f4c430]">Ghanaian farms. Honest food.</p>
          <h1 className="display-organic reveal-up mt-5 max-w-[760px] text-[clamp(3.4rem,8vw,8.25rem)] leading-[0.82] text-[#fefcf7] sm:mt-7">
            Food you can <em className="font-normal text-[#f4c430]">trust.</em>
          </h1>
          <p className="reveal-up-delay mt-6 max-w-xl text-base leading-7 text-[#d5e7d8] sm:mt-8 md:text-xl md:leading-8">
            Fresh produce from Ghanaian farms, selected with care and brought closer to the people who value where their food comes from.
          </p>

          <div className="reveal-up-delay mt-7 flex flex-wrap items-center gap-5 sm:mt-10">
            <Link href="/products" className="group inline-flex min-h-14 items-center gap-8 bg-[#f4c430] px-7 font-bold text-[#0d3b2a] transition-colors hover:bg-[#fefcf7]">
              Shop the harvest
              <span className="text-xl transition-transform group-hover:translate-x-1" aria-hidden>↗</span>
            </Link>
            <Link href="/about" className="inline-flex min-h-14 items-center border-b border-white/60 px-1 font-medium text-white transition-colors hover:border-[#f4c430] hover:text-[#f4c430]">
              See how we source
            </Link>
          </div>

          <div className="mt-16 hidden max-w-lg grid-cols-3 border-y border-white/15 py-5 sm:grid">
            {[
              ['Farm', 'traceable'],
              ['Ghana', 'grown'],
              ['Fresh', 'delivered'],
            ].map(([strong, small], index) => (
              <div key={strong} className={index ? 'border-l border-white/15 pl-5' : ''}>
                <strong className="display-organic block text-2xl text-white">{strong}</strong>
                <span className="text-xs uppercase tracking-[.14em] text-[#9fc5a4]">{small}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 min-h-0 lg:relative lg:h-[min(68vh,650px)] lg:min-h-[500px]">
          <div className="absolute inset-0 overflow-hidden bg-[#164d39] lg:rounded-[50%_50%_5%_5%/34%_34%_5%_5%]">
            {produce.map((item, index) => (
              <Image
                key={item.src}
                src={item.src}
                alt={index === active ? item.label : ''}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 85vw, 50vw"
                className={`object-cover transition-[opacity,transform] duration-[1400ms] ${index === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-black/45 lg:bg-gradient-to-t lg:from-black/55 lg:via-black/5 lg:to-black/10" />
          </div>

          <div className="absolute right-6 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 lg:-right-4 lg:top-16 lg:translate-y-0">
            {produce.map((item, index) => (
              <button key={item.src} onClick={() => setActive(index)} aria-label={`Show ${item.label}`} className={`h-10 w-[3px] transition-colors ${index === active ? 'bg-[#f4c430]' : 'bg-white/25'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="market-ribbon absolute inset-x-0 bottom-0 z-20 overflow-hidden border-y border-[#F4C430]/35 bg-[#F4C430] py-3 text-[#0D3B2A]">
        <div className="market-ribbon-track flex w-max items-center whitespace-nowrap text-[10px] font-bold uppercase tracking-[.16em] sm:text-[11px] sm:tracking-[.2em]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              <span className="px-7">In season now</span><span aria-hidden>✦</span>
              <span className="px-7">Ghana grown</span><span aria-hidden>✦</span>
              <span className="px-7">Honest sourcing</span><span aria-hidden>✦</span>
              <span className="px-7">Quick delivery</span><span aria-hidden>✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

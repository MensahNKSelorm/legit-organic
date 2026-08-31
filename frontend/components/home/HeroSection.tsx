"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const produce = [
  {
    src: "/images/photography/carrot_harvest_with_subtle_rebellion.webp",
    label: "Carrot harvest in Ghana's Volta Region",
    position: "center",
  },
  {
    src: "/images/photography/homepage-harvest.webp",
    label: "A farmer standing beside a fresh pepper harvest",
    position: "60% center",
  },
  {
    src: "/images/photography/homepage-packing.webp",
    label: "A woven basket of fresh produce being carried",
    position: "center",
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));

  useEffect(() => {
    const next = (active + 1) % produce.length;
    const preloadTimer = window.setTimeout(() => {
      setLoaded((current) => new Set(current).add(next));
    }, 3800);
    const advanceTimer = window.setTimeout(() => setActive(next), 5200);

    return () => {
      window.clearTimeout(preloadTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [active]);

  return (
    <section className="grain-overlay relative min-h-[100svh] overflow-hidden bg-[#0D3B2A] text-[#FEFCF7]">
      <div className="absolute inset-0 bg-[#164D39]">
        {produce.map((item, index) =>
          loaded.has(index) ? (
            <Image
              key={item.src}
              src={item.src}
              alt={index === active ? item.label : ""}
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover transition-[opacity,transform] duration-[1400ms] ${index === active ? "scale-100 opacity-100" : "scale-[1.035] opacity-0"}`}
              style={{ objectPosition: item.position }}
            />
          ) : null
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,20,13,.82)_0%,rgba(3,20,13,.54)_42%,rgba(3,20,13,.08)_78%),linear-gradient(0deg,rgba(3,20,13,.68)_0%,transparent_48%)]" />
      </div>

      <div className="page-container relative z-10 flex min-h-[100svh] flex-col justify-end pt-32 pb-24 md:pb-28">
        <div className="max-w-[48rem]">
          <p className="reveal-up text-sm font-bold text-[#F4C430]">
            Grown in Ghana · meant for everyday cooking
          </p>
          <h1 className="display-organic reveal-up mt-5 min-w-0 text-[clamp(3rem,8.7vw,8.75rem)] leading-[0.82] [overflow-wrap:anywhere] text-[#FEFCF7]">
            Your week starts at the farm.
          </h1>
          <div className="reveal-up-delay mt-7 grid gap-7 md:grid-cols-[minmax(0,31rem)_auto] md:items-end md:gap-10">
            <p className="max-w-xl text-lg leading-8 text-[#D5E7D8] md:text-xl">
              Shop the season and plan a basket that fits your week.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/products"
                className="group inline-flex min-h-14 items-center gap-8 bg-[#F4C430] px-7 font-bold whitespace-nowrap text-[#0D3B2A] transition-[background-color,transform] duration-200 hover:bg-[#FEFCF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] active:scale-[.97]"
              >
                Shop what&apos;s fresh
                <span
                  className="text-xl transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex min-h-14 items-center border-b border-white/60 px-1 font-bold whitespace-nowrap text-white transition-colors duration-200 hover:border-[#F4C430] hover:text-[#F4C430] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430]"
              >
                Plan my week
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-white/25 pt-5 sm:flex-row sm:items-end sm:gap-8">
          <p className="text-xs font-bold tracking-[.14em] text-white/75 uppercase">
            From Ghanaian farms to everyday kitchens
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {produce.map((item, index) => (
              <button
                key={item.src}
                onClick={() => {
                  setLoaded((current) => new Set(current).add(index));
                  setActive(index);
                }}
                aria-label={`Show ${item.label}`}
                aria-pressed={index === active}
                className={`h-11 w-11 border text-xs font-bold tabular-nums transition-[background-color,color,border-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C430] ${index === active ? "border-[#F4C430] bg-[#F4C430] text-[#0D3B2A]" : "border-white/35 text-white hover:border-white"}`}
              >
                0{index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="market-ribbon absolute inset-x-0 bottom-0 z-20 overflow-hidden border-y border-[#F4C430]/35 bg-[#F4C430] py-3 text-[#0D3B2A]"
      >
        <div className="market-ribbon-track flex w-max items-center text-[10px] font-bold tracking-[.16em] whitespace-nowrap uppercase sm:text-[11px] sm:tracking-[.2em]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((copy) => (
            <div key={copy} className="flex items-center">
              <span className="px-7">In season now</span>
              <span aria-hidden>✦</span>
              <span className="px-7">Ghana grown</span>
              <span aria-hidden>✦</span>
              <span className="px-7">Cook what&apos;s fresh</span>
              <span aria-hidden>✦</span>
              <span className="px-7">Plan your week</span>
              <span aria-hidden>✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

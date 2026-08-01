import Image from 'next/image'
import Link from 'next/link'

const promises = [
  ['Know the source', 'Origin, farm and handling information should travel with the food—not disappear after harvest.'],
  ['Choose better food', 'We focus on produce grown with care and handled for freshness, flavour and everyday nourishment.'],
  ['Strengthen local farms', 'A shorter route to market helps growers earn fairly while households gain access to better produce.'],
]

export default function WhyUs() {
  return (
    <section id="why-us" className="overflow-hidden bg-[#0d3b2a] py-24 text-[#fefcf7] md:py-32">
      <div className="page-container">
        <h2 className="display-organic max-w-6xl text-[clamp(3.6rem,7.8vw,8.4rem)] leading-[.84]">
          Good food should never arrive as a <em className="font-normal text-[#f4c430]">mystery.</em>
        </h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch lg:gap-0">
          <div className="relative min-h-[520px] overflow-hidden lg:min-h-[680px]">
            <Image src="/images/hero/4.webp" alt="Food grown and handled with care" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-7 left-7 max-w-sm border-l border-[#f4c430] pl-5 text-sm leading-6 text-white/85 md:bottom-10 md:left-10">
              Trust is grown through every decision—from the soil and the people tending it to the way produce reaches your home.
            </p>
          </div>

          <div className="flex flex-col justify-center bg-[#f5f0e6] px-7 py-10 text-[#0d3b2a] dark:bg-[#202621] dark:text-[#fefcf7] md:px-12 lg:px-14 lg:py-16">
            {promises.map(([title, body], index) => (
              <article key={title} className={`py-8 ${index ? 'border-t border-[#0d3b2a]/20 dark:border-white/15' : ''}`}>
                <h3 className="display-organic text-3xl md:text-4xl">{title}</h3>
                <p className="mt-4 max-w-lg leading-7 text-[#5b3e31] dark:text-[#b8d4bd]">{body}</p>
              </article>
            ))}
            <Link href="/about" className="mt-4 inline-flex w-fit border-b border-[#0d3b2a] pb-2 font-bold dark:border-[#f4c430] dark:text-[#f4c430]">Follow the story ↗</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

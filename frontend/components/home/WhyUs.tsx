import Image from "next/image";
import Link from "next/link";

const promises = [
  ["Know where it grew.", "Region and handling stay with the food."],
  ["Buy with the season.", "What is good now gets the spotlight."],
  ["Keep farms closer.", "A shorter route keeps more value near the people who grow."],
];

export default function WhyUs() {
  return (
    <section id="why-us" className="overflow-hidden bg-[#0d3b2a] py-24 text-[#fefcf7] md:py-32">
      <div className="page-container">
        <h2 className="display-organic max-w-6xl text-[clamp(3.6rem,7.8vw,8.4rem)] leading-[.84]">
          Food with roots
        </h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch lg:gap-0">
          <div className="relative min-h-[520px] overflow-hidden lg:min-h-[680px]">
            <Image
              src="/images/hero/4.webp"
              alt="Food grown and handled with care"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-7 left-7 max-w-sm border-l border-[#f4c430] pl-5 text-sm leading-6 text-white/85 md:bottom-10 md:left-10">
              Good food carries a place, a season and the work of the people behind it.
            </p>
          </div>

          <div className="flex flex-col justify-center bg-[#f5f0e6] px-7 py-10 text-[#0d3b2a] md:px-12 lg:px-14 lg:py-16 dark:bg-[#202621] dark:text-[#fefcf7]">
            {promises.map(([title, body], index) => (
              <article
                key={title}
                className={`py-8 ${index ? "border-t border-[#0d3b2a]/20 dark:border-white/15" : ""}`}
              >
                <h3 className="display-organic text-3xl md:text-4xl">{title}</h3>
                <p className="mt-4 max-w-lg leading-7 text-[#5b3e31] dark:text-[#b8d4bd]">{body}</p>
              </article>
            ))}
            <Link
              href="/about"
              className="mt-4 inline-flex w-fit border-b border-[#0d3b2a] pb-2 font-bold whitespace-nowrap transition-colors hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:border-[#f4c430] dark:text-[#f4c430]"
            >
              See where it starts →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

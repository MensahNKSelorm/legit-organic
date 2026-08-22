import Link from "next/link";

const stops = [
  {
    href: "/products",
    place: "Market",
    verb: "Choose fresh.",
    body: "Shop what is in season and available now.",
    action: "Open the market",
  },
  {
    href: "/recipes",
    place: "Kitchen",
    verb: "Cook local.",
    body: "Turn familiar Ghanaian ingredients into a meal worth repeating.",
    action: "Find a recipe",
  },
  {
    href: "/subscriptions",
    place: "Weekly",
    verb: "Keep it moving.",
    body: "Buy once, or prepare the next basket before the week gets busy.",
    action: "Plan the week",
  },
];

export default function HomeJourney() {
  return (
    <section
      className="home-journey bg-[#0D3B2A] text-[#FEFCF7]"
      aria-labelledby="home-journey-title"
    >
      <div className="page-container py-12 md:py-16">
        <div className="grid gap-8 border-b border-white/25 pb-8 md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,.75fr)] md:items-end">
          <h2
            id="home-journey-title"
            className="display-organic overflow-wrap-anywhere max-w-4xl min-w-0 text-[clamp(3rem,6vw,6.75rem)] leading-[0.86]"
          >
            A better week begins at the market.
          </h2>
          <p className="max-w-md text-base leading-7 font-medium md:justify-self-end md:text-lg">
            Fresh food becomes useful when deciding, shopping and cooking feel like one thing.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.12fr_.88fr_1fr]">
          {stops.map((stop, index) => (
            <Link
              key={stop.href}
              href={stop.href}
              className={`group flex min-h-64 flex-col justify-between border-white/25 py-8 transition-[background-color,color] duration-200 hover:bg-[#F4C430] hover:text-[#0D3B2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F4C430] active:bg-[#E6D8BD] md:min-h-80 md:px-8 ${index ? "border-t md:border-t-0 md:border-l" : ""}`}
            >
              <span className="text-xs font-bold tracking-[.14em] uppercase">{stop.place}</span>
              <span>
                <strong className="display-organic block text-4xl leading-none font-medium md:text-5xl">
                  {stop.verb}
                </strong>
                <span className="mt-4 block max-w-xs leading-6 opacity-75">{stop.body}</span>
              </span>
              <span className="flex items-center justify-between border-t border-current/30 pt-4 text-sm font-bold whitespace-nowrap">
                {stop.action}
                <span
                  className="text-xl transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

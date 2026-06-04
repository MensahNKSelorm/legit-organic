import SectionWrapper from "@/components/ui/SectionWrapper";

const pillars = [
  {
    icon: () => (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: "Radical Transparency",
    description:
      "Every product comes with a full traceability report — from the farm GPS coordinates to harvest date, storage conditions, and the farmer's name. You always know where your food came from.",
    metric: "Full Farm Traceability",
  },
  {
    icon: () => (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: "Uncompromising Quality",
    description:
      "All produce passes a three-stage quality check: in-field inspection, post-harvest assessment, and lab testing for pesticide residue. Only products that clear all three stages reach your door.",
    metric: "3-Stage Quality Check",
  },
  {
    icon: () => (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22V11"/>
        <path d="M12 11C12 7 8 3 4 3c0 4 4 8 8 8z"/>
        <path d="M12 11c0-4 4-8 8-8 0 4-4 8-8 8z"/>
      </svg>
    ),
    title: "Farmer Empowerment",
    description:
      "We pay farmers 30–40% above market rate and invest in their training. Our partnership model gives smallholder farmers access to certification, tools, and a reliable market — building a sustainable food future.",
    metric: "30–40% Above Market Rate",
  },
];

export default function WhyUs() {
  return (
    <SectionWrapper id="why-us" background="forest">
      <div className="relative">
        {/* Decorative leaf watermark */}
        <svg
          className="absolute -top-8 right-0 w-80 h-80 opacity-5 text-white pointer-events-none"
          viewBox="0 0 200 280"
          fill="currentColor"
          aria-hidden
        >
          <path d="M100 10C140 10 180 50 180 110C180 180 140 260 100 270C60 260 20 180 20 110C20 50 60 10 100 10Z"/>
        </svg>

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            Why Choose Us
          </span>
          <h2 className="font-display text-4xl font-bold text-mist-white mt-3 mb-5">
            Our Three Core Promises
          </h2>
          <p className="text-light-leaf text-lg leading-relaxed max-w-xl mx-auto">
            Legit Organic was founded on a simple belief: Ghanaians deserve to know exactly what they
            are eating, and farmers deserve fair pay for honest work.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-[#0D3B2A]/80 backdrop-blur-sm border-t-2 border-[#F4C430] rounded-2xl p-8 shadow-lg hover:bg-[#0D3B2A]/60 transition-colors flex flex-col"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#F4C430]">
                {pillar.icon()}
              </div>

              {/* Title */}
              <h3 className="font-display text-xl font-bold text-white mb-4">{pillar.title}</h3>

              {/* Description */}
              <p className="text-light-leaf leading-relaxed">{pillar.description}</p>

              {/* Badge — pinned to bottom of card */}
              <div className="mt-auto pt-6">
                <span className="inline-block bg-ghana-gold/20 border border-ghana-gold/40 text-ghana-gold text-xs font-semibold px-3 py-1 rounded-full">
                  {pillar.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

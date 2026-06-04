import SectionWrapper from "@/components/ui/SectionWrapper";

const pillars = [
  {
    icon: "🔍",
    title: "Radical Transparency",
    description:
      "Every product comes with a full traceability report — from the farm GPS coordinates to harvest date, storage conditions, and the farmer's name. You always know where your food came from.",
    metric: "Full Farm Traceability",
    color: "border-ghana-gold",
  },
  {
    icon: "✅",
    title: "Uncompromising Quality",
    description:
      "All produce passes a three-stage quality check: in-field inspection, post-harvest assessment, and lab testing for pesticide residue. Only products that clear all three stages reach your door.",
    metric: "3-Stage Quality Check",
    color: "border-leaf-green",
  },
  {
    icon: "🌱",
    title: "Farmer Empowerment",
    description:
      "We pay farmers 30–40% above market rate and invest in their training. Our partnership model gives smallholder farmers access to certification, tools, and a reliable market — building a sustainable food future.",
    metric: "30–40% Above Market Rate",
    color: "border-light-leaf",
  },
];

export default function WhyUs() {
  return (
    <SectionWrapper id="why-us" background="forest">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className={`bg-mist-white/5 border-t-4 ${pillar.color} rounded-2xl p-10 hover:bg-mist-white/10 transition-colors`}
          >
            <div className="text-5xl mb-6">{pillar.icon}</div>
            <h3 className="font-display text-2xl font-bold text-mist-white mb-4">{pillar.title}</h3>
            <p className="text-light-leaf leading-relaxed mb-8">{pillar.description}</p>
            <span className="inline-block bg-ghana-gold/20 border border-ghana-gold/40 text-ghana-gold text-xs font-semibold px-3 py-1 rounded-full">
              {pillar.metric}
            </span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

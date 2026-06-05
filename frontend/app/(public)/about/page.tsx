import type { Metadata } from "next";
import SectionWrapper from "@/components/ui/SectionWrapper";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Legit Organic — our mission to rebuild trust in Ghana's food ecosystem by connecting consumers with verified organic farmers.",
};

export default function AboutPage() {
  return (
    <>
      {/* ── Page hero ──────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "9rem", paddingBottom: "5rem" }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            Our Story
          </span>
          <h1 className="font-display text-5xl font-bold text-white mt-3 mb-6">
            Built on Trust, Grown in Ghana
          </h1>
          <p className="text-white/80 text-lg leading-relaxed" style={{ maxWidth: "40rem", margin: "0 auto" }}>
            Legit Organic was founded in 2022 by a team of Ghanaian agronomists, nutritionists,
            and tech entrepreneurs who were frustrated by the lack of transparency in the local
            food supply chain.
          </p>
        </div>
      </div>

      {/* ── Mission ────────────────────────────────────────────── */}
      <SectionWrapper background="cream">
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <h2 className="font-display text-3xl font-bold text-forest-green mb-6">Our Mission</h2>
          <p className="text-charcoal/80 text-lg leading-relaxed mb-6">
            We believe every Ghanaian family deserves access to food they can trust — food that is
            grown without synthetic pesticides, handled without harmful preservatives, and traceable
            from soil to table. And we believe Ghanaian farmers deserve fair recognition and fair
            pay for the hard, honest work of organic agriculture.
          </p>
          <p className="text-charcoal/80 text-lg leading-relaxed">
            Legit Organic closes the gap between these two groups: conscious consumers who want
            real food, and dedicated farmers who grow it. Our platform provides the technology,
            verification, and logistics to make that connection seamless, transparent, and
            sustainable.
          </p>
        </div>
      </SectionWrapper>

      {/* ── Values ─────────────────────────────────────────────── */}
      <SectionWrapper background="beige">
        <h2 className="font-display text-4xl font-bold text-forest-green mb-14 text-center">
          What We Stand For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: "🌍",
              title: "Soil Health First",
              body: "Healthy soil is the foundation of healthy food. We support regenerative farming practices that restore — rather than deplete — Ghana's agricultural land.",
            },
            {
              icon: "🤝",
              title: "Fair Partnerships",
              body: "Our farmer partnership model guarantees minimum pricing floors, training support, and guaranteed market access — creating stability for smallholder farmers.",
            },
            {
              icon: "📊",
              title: "Data-Driven Transparency",
              body: "Every product on our platform is backed by testing data, farm records, and third-party inspections that consumers can access directly from the product page.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-mist-white rounded-2xl p-8 border border-sand">
              <div className="text-5xl mb-5">{v.icon}</div>
              <h3 className="font-display text-xl font-bold text-forest-green mb-3">{v.title}</h3>
              <p className="text-charcoal/70 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <SectionWrapper background="cream">
        <div className="text-center" style={{ maxWidth: "36rem", margin: "0 auto" }}>
          <h2 className="font-display text-4xl font-bold text-forest-green mb-5">
            Join the Movement
          </h2>
          <p className="text-charcoal/70 text-lg leading-relaxed mb-10">
            Whether you&apos;re a consumer looking for trustworthy food, or a farmer ready to grow
            with us — there&apos;s a place for you in the Legit Organic community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-ghana-gold text-forest-green font-semibold px-8 py-3.5 rounded-xl hover:bg-dark-gold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="border-2 border-forest-green text-forest-green font-semibold px-8 py-3.5 rounded-xl hover:bg-forest-green hover:text-mist-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}

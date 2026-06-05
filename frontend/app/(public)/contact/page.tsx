import type { Metadata } from "next";
import SectionWrapper from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Legit Organic team — for consumer queries, farmer partnerships, or press enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "9rem", paddingBottom: "5rem" }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            Get in Touch
          </span>
          <h1 className="font-display text-5xl font-bold text-white mt-3 mb-5">
            We&apos;re Here to Help
          </h1>
          <p className="text-white/80 text-lg leading-relaxed" style={{ maxWidth: "40rem", margin: "0 auto" }}>
            Questions about an order, interest in becoming a partner farmer, or a press inquiry —
            our team responds within 24 hours.
          </p>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-display text-2xl font-bold text-forest-green mb-8">
              Contact Information
            </h2>
            <div className="space-y-6">
              {[
                { icon: "📍", label: "Office", value: "Airport West, Accra, Greater Accra Region, Ghana" },
                { icon: "📧", label: "Email", value: "hello@legitorganic.com.gh" },
                { icon: "📞", label: "Phone", value: "+233 30 222 0000" },
                { icon: "🕐", label: "Hours", value: "Monday–Friday, 8:00 AM – 5:00 PM GMT" },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-leaf-green uppercase tracking-wide mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-charcoal/80 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-mist-white rounded-2xl p-8 border border-sand">
            <h2 className="font-display text-xl font-bold text-forest-green mb-6">
              Send a Message
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/70 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Kwame"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/70 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Asante"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal/70 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="kwame@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal/70 mb-1.5">
                  Subject
                </label>
                <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors">
                  <option>General Inquiry</option>
                  <option>Farmer Partnership</option>
                  <option>Press / Media</option>
                  <option>Bulk Orders</option>
                  <option>Technical Support</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal/70 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us how we can help..."
                  className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}

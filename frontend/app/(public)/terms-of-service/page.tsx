import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing your use of Legit Organic Limited's website and services.",
};

export default function TermsOfServicePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div id="top" className="bg-[#0D3B2A] pb-14 pt-36 text-white md:pb-20">
        <div className="page-container grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="editorial-label text-[#F4C430]">Using Legit Organic</p><h1 className="display-organic mt-4 text-6xl md:text-8xl">Terms of service.</h1></div>
          <p className="border-l border-white/25 pl-5 text-sm text-[#B8D4BD]">Effective June 2026<br />Governed by the laws of Ghana</p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">
        <div className="legal-document mx-auto max-w-5xl px-6 py-16 md:py-20">

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              By using legitorganic.com, you agree to these terms. If you do not agree, please do
              not use our services.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 2. About Legit Organic */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              2. About Legit Organic
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Legit Organic Limited is a Ghana-based organic food company that sources, processes,
              and delivers certified organic produce directly from verified Ghanaian farmers to
              consumers, restaurants, schools, and retail outlets.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              3. Account Registration
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for keeping your password secure</li>
              <li>You must be 18 or older to create an account</li>
              <li>One account per person</li>
              <li>We reserve the right to suspend accounts that violate these terms</li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 4. Orders and Payments */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              4. Orders and Payments
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>All prices are in Ghana Cedis (GH₵) and include applicable taxes</li>
              <li>Orders are confirmed only after successful payment via Paystack</li>
              <li>
                We reserve the right to cancel orders if a product becomes unavailable, with a full
                refund issued
              </li>
              <li>
                Delivery times are estimates and may vary based on location and availability
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 5. Product Quality and Organic Certification */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              5. Product Quality and Organic Certification
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>All products are sourced from our verified farmer network</li>
              <li>We enforce quality standards at every stage from farm to delivery</li>
              <li>
                If you receive a product that does not meet our quality standards, contact us within
                24 hours of delivery for a replacement or refund
              </li>
              <li>
                Our &ldquo;organic&rdquo; claims are based on our farmer partnership standards and
                ongoing quality checks
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 6. Delivery */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              6. Delivery
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>Delivery is available within our current service areas in Ghana</li>
              <li>Delivery fees are shown at checkout</li>
              <li>Risk of damage passes to you upon delivery</li>
              <li>
                If you are unavailable at delivery time, we will attempt redelivery or contact you
                to arrange collection
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 7. Returns and Refunds */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              7. Returns and Refunds
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>
                <strong>Fresh produce:</strong> contact us within 24 hours of delivery if there is
                a quality issue — we will replace or refund
              </li>
              <li>
                <strong>Non-perishable products:</strong> returns accepted within 7 days if
                unopened and in original condition
              </li>
              <li>
                Refunds are processed within 5–7 business days via the original payment method
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 8. Recipe Builder and User Content */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              8. Recipe Builder and User Content
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>Recipes you create and save using our Recipe Builder are your own</li>
              <li>
                By saving recipes, you grant us permission to use anonymised recipe data to improve
                our service
              </li>
              <li>
                Do not upload any content that is illegal, offensive, or infringes third-party
                rights
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 9. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              9. Intellectual Property
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              All content on this website — including text, images, logos, and recipes — is owned
              by Legit Organic Limited unless otherwise stated. You may not reproduce or distribute
              our content without written permission.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              10. Limitation of Liability
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              To the maximum extent permitted by Ghanaian law, Legit Organic shall not be liable
              for any indirect or consequential loss arising from use of our services.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 11. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              11. Governing Law
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              These terms are governed by the laws of the Republic of Ghana. Any disputes shall be
              resolved in the courts of Ghana.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 12. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              12. Contact Us
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-1">
              Legit Organic Limited
            </p>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-1">Accra, Ghana</p>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Email:{" "}
              <a
                href="mailto:legal@legitorganic.com"
                className="text-[#2e7d32] dark:text-[#81c784] hover:underline"
              >
                legal@legitorganic.com
              </a>
            </p>
          </section>

          {/* Back to top */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <a
              href="#top"
              className="inline-flex items-center gap-2 text-[#2E7D32] dark:text-[#81C784] font-semibold hover:underline mt-12"
            >
              ↑ Back to top
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

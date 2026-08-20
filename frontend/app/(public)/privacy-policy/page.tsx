import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Legit Organic Limited collects, uses, and protects your personal data when you use our website and services.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div id="top" className="bg-[#0D3B2A] pb-14 pt-36 text-white md:pb-20">
        <div className="page-container grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="editorial-label text-[#F4C430]">Your information</p><h1 className="display-organic mt-4 text-6xl md:text-8xl">Privacy policy.</h1></div>
          <p className="border-l border-white/25 pl-5 text-sm text-[#B8D4BD]">Effective August 2026<br />Written for customers in Ghana</p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">
        <div className="legal-document mx-auto max-w-5xl px-6 py-12 md:py-16">

          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              1. Introduction
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Legit Organic Limited (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your
              personal information. This policy explains how we collect, use, and protect your data
              when you use our website and services at legitorganic.com.
            </p>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We are registered in Ghana and operate under applicable Ghanaian data protection laws.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              2. Information We Collect
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We collect the following types of personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li><strong>Account information:</strong> name, email address, phone number</li>
              <li><strong>Delivery information:</strong> delivery address</li>
              <li><strong>Order information:</strong> products ordered, quantities, order history</li>
              <li>
                <strong>Payment information:</strong> payment references and transaction status.
                Payment credentials are handled by SeevCash and are not stored by us
              </li>
              <li><strong>Usage data:</strong> pages visited, time spent, device type</li>
              <li>
                <strong>Communications:</strong> messages sent to us via contact form or email
              </li>
              <li>
                <strong>Business applications:</strong> organisation details, TIN, registration
                information, delivery information, and supporting verification documents
              </li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              3. How We Use Your Information
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>To process and deliver your orders</li>
              <li>To send order confirmations and delivery updates</li>
              <li>To send health and food content (blog, recipes) if you opt in</li>
              <li>To improve our website and services</li>
              <li>To respond to your enquiries</li>
              <li>To comply with legal obligations</li>
              <li>To verify and manage business supply applications</li>
            </ul>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 4. Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              4. Data Sharing
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We do not sell your personal data. We share data only with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li><strong>SeevCash</strong> — payment processing and payment-status confirmation</li>
              <li><strong>Delivery partners</strong> — name and address only, for delivery</li>
              <li><strong>Legal authorities</strong> — if required by Ghanaian law</li>
            </ul>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We do not share your data with advertisers or third-party marketers.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 5. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              5. Cookies
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We use essential cookies to keep you logged in and remember your preferences. We do
              not use advertising or tracking cookies.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 6. Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              6. Data Security
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Your data is stored securely. Passwords are hashed and never stored in plain text.
              Payment credentials are handled by SeevCash and are not stored on our servers.
              Business verification documents are kept in private storage and are available only
              to authorised reviewers.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              7. Your Rights
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#333333] dark:text-gray-300 mb-4">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing emails at any time</li>
            </ul>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@legitorganic.com"
                className="text-[#2e7d32] dark:text-[#81c784] hover:underline"
              >
                privacy@legitorganic.com
              </a>
              .
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Our services are not directed at children under 13. We do not knowingly collect data
              from children.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              9. Changes to This Policy
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              We may update this policy from time to time. We will notify registered users of
              significant changes by email.
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* 10. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-[#0D3B2A] dark:text-white mb-3 mt-10">
              10. Contact Us
            </h2>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-1">
              Legit Organic Limited
            </p>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-1">Accra, Ghana</p>
            <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
              Email:{" "}
              <a
                href="mailto:privacy@legitorganic.com"
                className="text-[#2e7d32] dark:text-[#81c784] hover:underline"
              >
                privacy@legitorganic.com
              </a>
            </p>
          </section>

          {/* Back to top */}
          <div className="mt-10 border-t border-gray-200 pt-6 text-center dark:border-gray-700">
            <a
              href="#top"
              className="inline-flex items-center gap-2 font-semibold text-[#2E7D32] hover:underline dark:text-[#81C784]"
            >
              ↑ Back to top
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

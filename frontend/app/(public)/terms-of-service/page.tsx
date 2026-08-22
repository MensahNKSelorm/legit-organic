import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'The terms governing the use of Legit Organic Limited’s website, ordering and delivery services.',
}

const sections = [
  { title: 'Acceptance of these terms', body: [
    'By accessing or using legitorganic.com, you confirm that you have read, understood and agree to these terms and the policies incorporated into them. If you do not agree, you must not use the platform.',
    'These terms form an agreement between you and Legit Organic Limited. If you use the platform for a business or institution, you confirm that you are authorised to bind that organisation.',
  ]},
  { title: 'About Legit Organic', body: [
    'Legit Organic Limited is a Ghana-based food company that sources, processes and delivers produce from verified Ghanaian farmers to consumers, restaurants, schools and retail outlets.',
  ]},
  { title: 'Account registration', bullets: [
    'Provide accurate and current information when creating an account.',
    'Keep your password and account access secure.',
    'You must be at least 18 years old to create an account.',
    'One account may be maintained per person.',
    'We may restrict or suspend accounts that breach these terms.',
  ]},
  { title: 'Orders and payments', bullets: [
    'Prices are displayed in Ghana cedis (GH₵), including applicable taxes unless stated otherwise.',
    'An order is confirmed only after successful payment through the payment option shown at checkout.',
    'If an item becomes unavailable, we may amend or cancel the affected order and issue the appropriate refund.',
    'Delivery dates and times are estimates and may change with location, availability or circumstances outside our control.',
    'Weekly deliveries create a separate renewal order for each cycle. You choose whether to pay each renewal; we do not automatically charge a stored payment method.',
  ]},
  { title: 'Product quality and produce information', bullets: [
    'Products are sourced through our verified farmer network and assessed against our quality standards.',
    'Report a quality concern within 24 hours of delivery so we can assess a replacement or refund.',
    'Produce descriptions, nutritional information and availability may vary by batch, season and farm location.',
    'Any organic or sourcing claim shown for a product applies according to the information and verification available for that product.',
  ]},
  { title: 'Delivery', bullets: [
    'Delivery is available only within the service areas shown on the platform.',
    'Applicable delivery fees are shown before checkout.',
    'Responsibility for the goods passes to you when delivery is completed.',
    'If nobody can receive the delivery, we may contact you to arrange redelivery or collection. Food-safety limits may prevent us from holding perishable goods beyond 48 hours.',
    'We are not responsible for delays caused by events outside our reasonable control, including traffic disruption, severe weather or public disturbances.',
  ]},
  { title: 'Returns and refunds', bullets: [
    'Fresh produce: report a quality issue within 24 hours of delivery for assessment, replacement or refund.',
    'Non-perishable goods: unopened products in their original condition may be returned within seven days, subject to prior approval.',
    'Approved refunds are returned through the original payment method, normally within five to seven business days.',
    'Change-of-mind returns are not available for perishable goods.',
  ]},
  { title: 'Recipe Builder and user content', bullets: [
    'Recipes you create remain yours.',
    'Saving a recipe allows us to use anonymised recipe data to improve the service.',
    'You must not submit unlawful, defamatory, obscene or rights-infringing content.',
    'We may remove prohibited content or restrict the responsible account.',
  ]},
  { title: 'Intellectual property', body: [
    'Platform content includes our text, photographs, logos, icons, software and original recipe content. It belongs to Legit Organic Limited or its licensors and is protected by applicable law.',
    'You may use platform content for personal, non-commercial purposes only. Reproduction, distribution, commercial use or unauthorised use of our branding requires prior written permission.',
  ]},
  { title: 'Privacy and confidentiality', body: [
    'We handle personal information in line with our Privacy Policy and applicable Ghanaian data-protection law. The Privacy Policy explains what we collect, why we use it, who may receive it and the choices available to you.',
  ], link: true },
  { title: 'Limitation of liability', body: [
    'To the fullest extent permitted by Ghanaian law, Legit Organic Limited is not liable for indirect, incidental, special, consequential or punitive loss arising from use of the platform or products purchased through it.',
    'Our total liability for a claim connected with an order will not exceed the amount paid for that order. Nothing in these terms limits liability that cannot lawfully be excluded, including liability for fraud or death or personal injury caused by negligence.',
  ]},
  { title: 'Resolving disputes', body: [
    'Please first contact support@legitorganic.com. We will acknowledge a complaint within two business days and aim to resolve it within 14 calendar days. If it remains unresolved, send a formal written complaint for senior review; we aim to respond within 21 calendar days.',
    'If the matter is still unresolved, either party may request confidential mediation through a mutually agreed accredited mediator in Ghana. If mediation fails or is declined, the dispute may be referred to binding arbitration under the applicable rules of the Ghana Arbitration Centre.',
  ]},
  { title: 'Governing law', body: [
    'These terms are governed by the laws of the Republic of Ghana. Subject to the dispute process above, the courts of Ghana have jurisdiction. If a provision is held invalid or unenforceable, the remaining provisions continue in effect.',
  ]},
  { title: 'Changes to these terms', bullets: [
    'We may update these terms when our services, legal requirements or business practices change.',
    'We will give at least 14 days’ notice of material changes by email or a prominent platform notice.',
    'Continuing to use the platform after revised terms take effect means you accept them.',
  ]},
]

export default function TermsOfServicePage() {
  return <>
    <header id="top" className="bg-[#0D3B2A] pb-14 pt-36 text-white md:pb-20">
      <div className="page-container grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div><p className="editorial-label text-[#F4C430]">The agreement</p><h1 className="display-organic mt-4 text-6xl md:text-7xl xl:text-8xl">Terms and conditions.</h1></div>
        <p className="border-l border-white/25 pl-5 text-sm text-[#B8D4BD]">Effective August 2026<br />Governed by Ghanaian law</p>
      </div>
    </header>
    <main className="min-h-screen bg-[#FAF7F0] dark:bg-[#111827]">
      <div className="terms-document mx-auto max-w-4xl px-6 py-12 md:py-16">
        <p className="max-w-2xl text-lg leading-8 text-[#4B453D] dark:text-gray-300">These terms cover accounts, purchases, deliveries, weekly orders and use of Legit Organic’s digital services.</p>
        {sections.map((section,index) => <section key={section.title} className="mt-10 border-t border-[#D8D0C1] pt-9 dark:border-white/15">
          <div className="grid gap-3 md:grid-cols-[3rem_1fr]">
            <span className="font-mono text-xs text-[#8A7F6E] dark:text-gray-500">{String(index + 1).padStart(2,'0')}</span>
            <div><h2 className="text-2xl font-semibold text-[#0D3B2A] dark:text-white">{section.title}</h2>
              {section.body?.map(paragraph => <p key={paragraph} className="mt-4 leading-7 text-[#3F3A34] dark:text-gray-300">{paragraph}</p>)}
              {section.link && <p className="mt-4"><Link href="/privacy-policy" className="font-semibold text-[#2E7D32] underline underline-offset-4 dark:text-[#F4C430]">Read the Privacy Policy</Link></p>}
              {section.bullets && <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-[#3F3A34] marker:text-[#C89F18] dark:text-gray-300">{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
          </div>
        </section>)}
        <section className="mt-12 border-t-2 border-[#0D3B2A] pt-8 dark:border-white"><h2 className="text-2xl font-semibold text-[#0D3B2A] dark:text-white">Questions about these terms?</h2><p className="mt-3 text-[#3F3A34] dark:text-gray-300">Contact <a href="mailto:legal@legitorganic.com" className="font-semibold text-[#2E7D32] underline underline-offset-4 dark:text-[#F4C430]">legal@legitorganic.com</a>.</p></section>
        <div className="mt-10 border-t border-[#D8D0C1] pt-6 text-center dark:border-white/15"><a href="#top" className="font-semibold text-[#2E7D32] hover:underline dark:text-[#F4C430]">↑ Back to top</a></div>
      </div>
    </main>
  </>
}

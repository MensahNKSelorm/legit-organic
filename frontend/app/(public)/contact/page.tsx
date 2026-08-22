import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import EditorialPageHeader from '@/components/ui/EditorialPageHeader'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Contact the Legit Organic team about orders, farmer partnerships or press enquiries.',
  path: '/contact',
})

function LocationIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

interface ContactItem {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}

const contactItems: ContactItem[] = [
  {
    icon: <LocationIcon />,
    label: 'OFFICE',
    value: '13 New Aplaku, Accra, Ghana',
  },
  {
    icon: <EmailIcon />,
    label: 'EMAIL',
    value: 'hello@legitorganic.com',
    href: 'mailto:hello@legitorganic.com',
  },
  {
    icon: <PhoneIcon />,
    label: 'PHONE',
    value: '+233 53 956 9260',
    href: 'tel:+233539569260',
  },
  {
    icon: <ClockIcon />,
    label: 'HOURS',
    value: 'Monday – Saturday, 8:00 AM – 5:00 PM GMT',
  },
  {
    icon: <WhatsAppIcon />,
    label: 'WHATSAPP',
    value: '+233 53 956 9260',
    href: 'https://wa.me/233539569260',
  },
]

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">
      <EditorialPageHeader index="Contact" title={<>Let&apos;s talk <em className="font-normal text-[#F4C430]">properly.</em></>} description="Orders, farmer partnerships, press questions or a simple hello. Choose the right contact below." />

      {/* Main content */}
      <section className="page-container py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
          {/* Left column — contact info + map */}
          <div>
            <p className="editorial-label mb-6 text-[#2E7D32] dark:text-[#9FC5A4]">Where to find us</p>

            <div className="border-t editorial-rule">
              {contactItems.map((item) => {
                const card = (
                  <div className="group grid grid-cols-[2rem_1fr] gap-4 border-b editorial-rule py-5 text-[#0D3B2A] transition-colors hover:text-[#2E7D32] dark:text-white">
                    <div className="pt-1 text-[#2E7D32] dark:text-[#F4C430]">{item.icon}</div>
                    <div><p className="text-xs font-bold text-[#8A6A22] dark:text-[#D7B951]">{item.label.toLowerCase()}</p><p className="mt-1 text-base font-semibold leading-snug">{item.value}</p></div>
                  </div>
                )

                return item.href ? (
                  <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  <div key={item.label}>{card}</div>
                )
              })}

              <div className="mt-8 overflow-hidden border editorial-rule dark:opacity-80">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=New+Aplaku,Accra,Ghana`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="w-full"
                  title="Legit Organic location map"
                />
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  )
}

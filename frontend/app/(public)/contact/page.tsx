import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Legit Organic team — for consumer queries, farmer partnerships, or press enquiries.',
}

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
  iconBg: string
}

const contactItems: ContactItem[] = [
  {
    icon: <LocationIcon />,
    label: 'OFFICE',
    value: '13 New Aplaku, Accra, Ghana',
    iconBg: 'bg-[#0D3B2A]',
  },
  {
    icon: <EmailIcon />,
    label: 'EMAIL',
    value: 'hello@legitorganic.com',
    href: 'mailto:hello@legitorganic.com',
    iconBg: 'bg-[#0D3B2A]',
  },
  {
    icon: <PhoneIcon />,
    label: 'PHONE',
    value: '+233 53 956 9260',
    href: 'tel:+233539569260',
    iconBg: 'bg-[#0D3B2A]',
  },
  {
    icon: <ClockIcon />,
    label: 'HOURS',
    value: 'Monday – Saturday, 8:00 AM – 5:00 PM GMT',
    iconBg: 'bg-[#0D3B2A]',
  },
  {
    icon: <WhatsAppIcon />,
    label: 'WHATSAPP',
    value: '+233 53 956 9260',
    href: 'https://wa.me/233539569260',
    iconBg: 'bg-[#25D366]',
  },
]

export default function ContactPage() {

  return (
    <>
      {/* Hero */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-[#F4C430] text-sm font-semibold uppercase tracking-widest">
            Contact Us
          </span>
          <h1 className="font-display text-5xl font-bold text-white mt-3 mb-5">
            Get In Touch
          </h1>
          <p
            className="text-white/80 text-lg leading-relaxed"
            style={{ maxWidth: '40rem', margin: '0 auto' }}
          >
            We&apos;d love to hear from you. Reach out via any of the channels below.
          </p>
        </div>
      </div>

      {/* Main content */}
      <section className="bg-[#FAF7F0] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left column — contact info + map */}
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0D3B2A] dark:text-white mb-6">
              Contact Information
            </h2>

            <div className="flex flex-col gap-4">
              {contactItems.map((item) => {
                const card = (
                  <div className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-[#E6D8BD] transition-shadow hover:shadow-md">
                    <div
                      className={`w-11 h-11 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0 text-white`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#B8860B] uppercase tracking-widest mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-[#0D3B2A] font-semibold text-sm leading-snug">
                        {item.value}
                      </p>
                    </div>
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

              {/* Map */}
              <div className="rounded-2xl overflow-hidden border border-[#E6D8BD] shadow-sm">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=New+Aplaku,Accra,Ghana`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-xl w-full"
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
    </>
  )
}

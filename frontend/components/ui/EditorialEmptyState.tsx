import Link from 'next/link'

interface EditorialEmptyStateProps {
  number: string
  title: string
  description: string
  href?: string
  linkLabel?: string
}

export default function EditorialEmptyState({ number, title, description, href, linkLabel }: EditorialEmptyStateProps) {
  return (
    <div className="grid border-y editorial-rule md:grid-cols-[8rem_1fr_auto] md:items-center">
      <p className="display-organic border-b editorial-rule py-6 text-5xl text-[#F4C430] md:border-b-0 md:border-r md:py-10">{number}</p>
      <div className="py-7 md:px-10 md:py-10">
        <h2 className="display-organic text-3xl text-[#0D3B2A] dark:text-[#FAF7F0]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">{description}</p>
      </div>
      {href && linkLabel && (
        <Link href={href} className="mb-8 w-fit border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] transition-colors hover:text-[#2E7D32] dark:text-[#F4C430] md:mb-0 md:mr-8">
          {linkLabel} ↗
        </Link>
      )}
    </div>
  )
}

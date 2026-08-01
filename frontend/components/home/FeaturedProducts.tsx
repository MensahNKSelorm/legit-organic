import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'
import { getMediaUrl } from '@/lib/media'

const PLACEHOLDERS = ['/images/products/p1.webp', '/images/products/p2.webp', '/images/products/p3.webp', '/images/products/p4.webp']

const DEMO_PRODUCTS: Product[] = [
  {
    id: -1, name: 'Perfumed White Rice', slug: 'preview-rice', description: 'Fragrant Ghana-grown rice for everyday meals.', price: '48.00', unit: '5 kg bag',
    region: { id: -1, name: 'Volta Region', slug: 'volta', country: 'Ghana' }, category: { id: -1, name: 'Grains', slug: 'grains', description: '', image: null },
    image: '/images/products/p1.webp', badge: { id: -1, name: 'Farm favourite', slug: 'farm-favourite', color: '#F4C430' }, is_featured: true, is_available: true, created_at: '', updated_at: '',
  },
  {
    id: -2, name: 'Seasonal Vegetable Box', slug: 'preview-vegetables', description: 'A colourful selection chosen from what is freshest.', price: '85.00', unit: 'mixed box',
    region: { id: -2, name: 'Eastern Region', slug: 'eastern', country: 'Ghana' }, category: { id: -2, name: 'Vegetables', slug: 'vegetables', description: '', image: null },
    image: '/images/products/p2.webp', badge: null, is_featured: true, is_available: true, created_at: '', updated_at: '',
  },
  {
    id: -3, name: 'Golden Maize', slug: 'preview-maize', description: 'Naturally dried maize for porridge, banku and more.', price: '30.00', unit: '2 kg bag',
    region: { id: -3, name: 'Bono East', slug: 'bono-east', country: 'Ghana' }, category: { id: -3, name: 'Grains', slug: 'grains', description: '', image: null },
    image: '/images/products/p3.webp', badge: null, is_featured: true, is_available: true, created_at: '', updated_at: '',
  },
  {
    id: -4, name: 'Mixed Local Beans', slug: 'preview-beans', description: 'A nourishing pantry staple sourced from local growers.', price: '36.00', unit: '2 kg bag',
    region: { id: -4, name: 'Northern Region', slug: 'northern', country: 'Ghana' }, category: { id: -4, name: 'Legumes', slug: 'legumes', description: '', image: null },
    image: '/images/products/p4.webp', badge: null, is_featured: true, is_available: true, created_at: '', updated_at: '',
  },
]

interface FeaturedProductsProps { products: Product[] }

function productImage(product: Product, index: number) {
  return product.images?.length
    ? getMediaUrl(product.images[0].image, PLACEHOLDERS[index % PLACEHOLDERS.length])
    : getMediaUrl(product.image, PLACEHOLDERS[index % PLACEHOLDERS.length])
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const usingDemo = products.length === 0 && process.env.NODE_ENV === 'development'
  const marketProducts = (usingDemo ? DEMO_PRODUCTS : products).slice(0, 4)
  const featured = marketProducts[0]

  return (
    <section id="products" className="relative overflow-hidden bg-[#faf7f0] py-24 text-[#0d3b2a] dark:bg-[#171b18] dark:text-[#fefcf7] md:py-32">
      <div className="pointer-events-none absolute -right-8 top-5 select-none font-serif text-[15rem] leading-none text-[#0d3b2a]/[.025] dark:text-white/[.025] md:text-[24rem]" aria-hidden>Market</div>
      <div className="page-container relative">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-20">
          <h2 className="display-organic text-6xl leading-[.87] md:text-8xl">What&apos;s good<br /><em className="font-normal text-[#2e7d32] dark:text-[#9fc5a4]">right now.</em></h2>
          <div className="pb-2">
            <p className="max-w-lg text-lg leading-8 text-[#5b3e31] dark:text-[#b8d4bd]">The market changes with the harvest. These are some of the foods worth bringing home today.</p>
            <Link href="/products" className="mt-7 inline-flex border-b border-[#0d3b2a] pb-2 font-bold dark:border-[#f4c430] dark:text-[#f4c430]">See the full market ↗</Link>
          </div>
        </div>

        {!featured ? (
          <p className="mt-14 border-y border-[#0d3b2a]/20 py-16 text-[#0d3b2a]/65 dark:border-white/15 dark:text-[#b8d4bd]">The next harvest is being prepared.</p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.16fr_.84fr] lg:gap-0">
            <Link href={usingDemo ? '/products' : `/products/${featured.slug}`} className="group relative min-h-[580px] overflow-hidden md:min-h-[720px]">
              <Image src={productImage(featured, 0)} alt={featured.name} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4c430]">{featured.region?.name} · {featured.category?.name}</p>
                <div className="mt-4 flex items-end justify-between gap-6">
                  <h3 className="display-organic max-w-xl text-5xl leading-[.9] md:text-7xl">{featured.name}</h3>
                  <div className="shrink-0 bg-[#f4c430] px-5 py-4 text-right text-[#0d3b2a]">
                    <strong className="block text-xl">GH₵ {featured.price}</strong>
                    <span className="text-xs">{featured.unit}</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="grid grid-rows-3 border-[#0d3b2a]/20 dark:border-white/15 lg:border-y lg:border-r">
              {marketProducts.slice(1).map((product, index) => (
                <Link key={product.id} href={usingDemo ? '/products' : `/products/${product.slug}`} className={`group grid min-h-0 grid-cols-[.9fr_1.1fr] ${index ? 'border-t border-[#0d3b2a]/20 dark:border-white/15' : ''}`}>
                  <div className="relative min-h-[220px] overflow-hidden bg-[#e6d8bd]">
                    <Image src={productImage(product, index + 1)} alt={product.name} fill sizes="(max-width: 1024px) 45vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                  </div>
                  <div className="flex flex-col justify-between p-5 md:p-7">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#2e7d32] dark:text-[#9fc5a4]">{product.region?.name}</p>
                    <div>
                      <h3 className="display-organic text-2xl leading-tight md:text-3xl">{product.name}</h3>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <span className="font-bold">GH₵ {product.price}</span>
                        <span className="text-xs text-[#5b3e31] dark:text-[#b8d4bd]">{product.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

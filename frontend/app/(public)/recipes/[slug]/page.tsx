import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { RecipeWithPairings } from '@/types'
import RecipeDetailActions from '@/components/recipes/RecipeDetailActions'
import { getMediaUrl } from '@/lib/media'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const recipe = await api.recipes.detail(slug)
    const description = recipe.description
      ? recipe.description.replace(/<[^>]*>/g, '').slice(0, 160)
      : `Learn how to make ${recipe.title} using fresh organic ingredients from Ghana.`

    return {
      title: recipe.title,
      description,
      keywords: [
        recipe.title,
        `${recipe.title} recipe`,
        'Ghana recipe',
        'Ghanaian cuisine',
        'organic ingredients Ghana',
        'healthy Ghanaian food',
        'traditional Ghana cooking',
      ],
      openGraph: {
        title: recipe.title,
        description,
        images: recipe.cover_image ? [{ url: recipe.cover_image }] : [],
        type: 'website',
      },
    }
  } catch {
    return { title: 'Recipe | Legit Organic' }
  }
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',     color: '#2E7D32' },
  medium: { label: 'Medium',   color: '#F4C430' },
  hard:   { label: 'Advanced', color: '#dc2626' },
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function getEmbedUrl(url: string): string {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  return url
}


export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  const recipe = await api.recipes.detail(slug).catch(() => notFound())
  const diff = difficultyConfig[recipe.difficulty] ?? { label: recipe.difficulty, color: '#6b7280' }
  const coverSrc = getMediaUrl(recipe.cover_image)

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '1rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-light-leaf flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-mist-white transition-colors">Home</Link>
            <span className="opacity-50">/</span>
            <Link href="/recipes" className="hover:text-mist-white transition-colors">Recipes</Link>
            <span className="opacity-50">/</span>
            <span className="text-ghana-gold font-medium truncate max-w-[240px]">{recipe.title}</span>
          </nav>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#0D3B2A', minHeight: '280px' }}>
        {coverSrc && (
          <Image
            src={coverSrc}
            alt={recipe.title}
            fill
            className="object-cover opacity-25"
            sizes="100vw"
            priority
          />
        )}
        <div className="relative z-10 page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 pb-16">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: diff.color + '22', color: diff.color }}
            >
              {diff.label}
            </span>
          </div>
          <h1 className="font-display text-3xl lg:text-5xl font-bold text-mist-white mb-5 leading-tight max-w-3xl">
            {recipe.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-light-leaf text-sm mb-8">
            {recipe.prep_time > 0 && (
              <span>{formatTime(recipe.prep_time)} prep</span>
            )}
            {recipe.cook_time > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatTime(recipe.cook_time)} cook</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span>{recipe.servings} servings</span>
          </div>
          <RecipeDetailActions recipe={recipe} />
        </div>
      </div>

      {/* ── Pairings ───────────────────────────────────────────── */}
      {recipe.pairings.length > 0 && (
        <div className="bg-[#F0F7F0] dark:bg-[#1a2e1a] border-b border-[#C3E6CB] dark:border-[#2d4a2d]">
          <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <p className="text-sm font-semibold text-[#2E7D32] dark:text-[#81C784] mb-3">
              {recipe.pairings[0].label}:
            </p>
            <div className="flex flex-wrap gap-3">
              {recipe.pairings.map((pairing) => (
                <div
                  key={pairing.id}
                  className="flex items-center gap-3 bg-mist-white dark:bg-[#1f2937] border border-[#C3E6CB] dark:border-[#2d4a2d] rounded-xl px-4 py-2.5"
                >
                  <span className="font-medium text-forest-green dark:text-[#faf7f0] text-sm">
                    {pairing.suggested_recipe.title}
                  </span>
                  <Link
                    href={`/recipes/builder?base=${recipe.slug}&add=${pairing.suggested_recipe.slug}`}
                    className="text-xs font-semibold bg-[#F4C430] text-[#0D3B2A] px-3 py-1 rounded-lg hover:bg-[#c59f2c] transition-colors whitespace-nowrap"
                  >
                    Add to Builder
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content + Sidebar ──────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">

          {/* Left: ingredients + steps */}
          <div className="space-y-12">

            {/* Nutritional score */}
            {recipe.nutritional_score && recipe.nutritional_score > 0 ? (
              <div className="p-4 bg-[#F5F0E6] dark:bg-gray-800 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#0D3B2A] dark:text-white">
                    Nutritional Score
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: recipe.nutritional_score >= 80 ? '#2E7D32'
                           : recipe.nutritional_score >= 60 ? '#F4C430'
                           : '#E65100',
                    }}
                  >
                    {recipe.nutritional_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${recipe.nutritional_score}%`,
                      backgroundColor: recipe.nutritional_score >= 80 ? '#2E7D32'
                                     : recipe.nutritional_score >= 60 ? '#F4C430'
                                     : '#E65100',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>
            ) : null}

            {/* Video */}
            {recipe.video_url && (
              <div>
                <h3 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-4">
                  How to Prepare
                </h3>
                <div className="relative aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    src={getEmbedUrl(recipe.video_url)}
                    title="Recipe video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Ingredients */}
            {recipe.ingredients.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold text-forest-green dark:text-[#faf7f0] mb-6">
                  Ingredients
                </h2>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-start gap-3">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F4C430] shrink-0" />
                      <span className="text-charcoal/80 dark:text-[#d1d5db]">
                        <span className="font-semibold text-forest-green dark:text-[#faf7f0]">
                          {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                        </span>
                        {' '}
                        {ing.product ? (
                          <Link
                            href={`/products/${ing.product.slug}`}
                            className="text-[#2E7D32] dark:text-[#81C784] hover:underline"
                          >
                            {ing.name}
                          </Link>
                        ) : (
                          ing.name
                        )}
                        {ing.notes && (
                          <span className="text-charcoal/40 dark:text-[#9ca3af] text-sm"> — {ing.notes}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Steps */}
            {recipe.steps.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold text-forest-green dark:text-[#faf7f0] mb-6">
                  Instructions
                </h2>
                <ol className="space-y-6">
                  {recipe.steps.map((step) => (
                    <li key={step.id} className="flex gap-5">
                      <span className="shrink-0 w-9 h-9 rounded-full bg-[#F4C430] text-[#0D3B2A] font-bold text-sm flex items-center justify-center">
                        {step.step_number}
                      </span>
                      <div
                        className="prose prose-green max-w-none dark:prose-invert pt-1.5"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {recipe.ingredients.length === 0 && recipe.steps.length === 0 && (
              <p className="text-charcoal/50 dark:text-[#9ca3af] italic">
                Full recipe details are being prepared. Check back soon.
              </p>
            )}
          </div>

          {/* Right: sticky sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24">

            {/* Build with this recipe */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-3">
                Make it yours
              </p>
              <p className="font-semibold text-forest-green dark:text-[#faf7f0] mb-4 leading-snug">
                {recipe.title}
              </p>
              <Link
                href={`/recipes/builder?base=${recipe.slug}`}
                className="block w-full text-center bg-[#F4C430] text-[#0D3B2A] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
              >
                Customise This Recipe
              </Link>
            </div>

            {/* Pairing suggestions in sidebar */}
            {recipe.pairings.length > 0 && (
              <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                  Pairs well with
                </p>
                <ul className="space-y-3">
                  {recipe.pairings.map((pairing) => (
                    <li key={pairing.id}>
                      <Link
                        href={`/recipes/builder?base=${recipe.slug}&add=${pairing.suggested_recipe.slug}`}
                        className="group flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-forest-green dark:text-[#faf7f0] group-hover:text-leaf-green dark:group-hover:text-[#81C784] transition-colors">
                          {pairing.suggested_recipe.title}
                        </span>
                        <span className="text-xs text-[#F4C430] font-semibold">+ Add</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick stats */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                At a glance
              </p>
              <dl className="space-y-2 text-sm">
                {recipe.prep_time > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60 dark:text-[#9ca3af]">Prep time</dt>
                    <dd className="font-semibold text-forest-green dark:text-[#faf7f0]">{formatTime(recipe.prep_time)}</dd>
                  </div>
                )}
                {recipe.cook_time > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60 dark:text-[#9ca3af]">Cook time</dt>
                    <dd className="font-semibold text-forest-green dark:text-[#faf7f0]">{formatTime(recipe.cook_time)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-charcoal/60 dark:text-[#9ca3af]">Servings</dt>
                  <dd className="font-semibold text-forest-green dark:text-[#faf7f0]">{recipe.servings}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-charcoal/60 dark:text-[#9ca3af]">Difficulty</dt>
                  <dd className="font-semibold" style={{ color: diff.color }}>{diff.label}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

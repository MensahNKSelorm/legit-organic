import type { Metadata } from 'next'
import SectionWrapper from '@/components/ui/SectionWrapper'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { Recipe } from '@/types'

export const metadata: Metadata = {
  title: 'Recipes — Traditional Ghanaian Cuisine with Organic Ingredients',
  description:
    'Discover authentic Ghanaian recipes made with certified organic ingredients. From Jollof Rice to Fufu — real food, the way it should taste.',
}

const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Fufu & Light Soup',
    slug: 'fufu-light-soup',
    description:
      'A classic Ghanaian comfort dish — smooth pounded fufu served with a light, fragrant soup made from garden eggs, tomatoes, and your choice of protein.',
    cover_image: null,
    prep_time: 30,
    cook_time: 60,
    servings: 4,
    difficulty: 'medium',
    is_default: true,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 2,
    title: 'One-Pot Jollof Rice',
    slug: 'one-pot-jollof-rice',
    description:
      'The pride of Ghanaian cuisine — smoky, rich Jollof rice with Legit Organic jasmine rice, fresh tomatoes, and natural Ghanaian spices.',
    cover_image: null,
    prep_time: 20,
    cook_time: 45,
    servings: 6,
    difficulty: 'easy',
    is_default: true,
    created_at: '2025-02-10T00:00:00Z',
  },
  {
    id: 3,
    title: 'Kontomire Stew (Palava Sauce)',
    slug: 'kontomire-stew-palava-sauce',
    description:
      'A rich, hearty stew made with organic cocoyam leaves, smoked fish, and garden eggs — served over boiled yam or rice. A West African classic.',
    cover_image: null,
    prep_time: 25,
    cook_time: 40,
    servings: 4,
    difficulty: 'medium',
    is_default: false,
    created_at: '2025-03-05T00:00:00Z',
  },
  {
    id: 4,
    title: 'Groundnut Soup with Organic Chicken',
    slug: 'groundnut-soup-organic-chicken',
    description:
      'Creamy, nutty groundnut soup prepared with free-range organic chicken, fresh tomatoes, and a warming blend of Ghanaian spices.',
    cover_image: null,
    prep_time: 20,
    cook_time: 55,
    servings: 6,
    difficulty: 'medium',
    is_default: false,
    created_at: '2025-03-20T00:00:00Z',
  },
]

export default function RecipesPage() {
  return (
    <>
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            In the Kitchen
          </span>
          <h1 className="font-display text-5xl font-bold text-mist-white mt-3 mb-5">
            Organic Ghanaian Recipes
          </h1>
          <p
            className="text-light-leaf text-lg leading-relaxed"
            style={{ maxWidth: '40rem', margin: '0 auto' }}
          >
            Traditional flavours, pure ingredients. Every recipe uses produce available on Legit
            Organic — so you can cook it fresh.
          </p>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}

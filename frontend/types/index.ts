export interface Category {
  id: number
  name: string
  slug: string
  description: string
  image: string | null
}

export interface Region {
  id: number
  name: string
  slug: string
  country: string
}

export interface Badge {
  id: number
  name: string
  slug: string
  color: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  unit: string
  region: Region | null
  category: Category
  image: string | null
  badge: Badge | null
  is_featured: boolean
  is_available: boolean
  storage_tips?: string
  nutritional_info?: string
  nutritional_score?: number
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: number
  name: string
  slug: string
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  author_name: string
  category: BlogCategory
  tags: string
  is_published: boolean
  published_at: string
  created_at: string
  content?: string
  updated_at?: string
}

export interface IngredientProduct {
  id: number
  name: string
  slug: string
  price: string
  unit: string
}

export interface RecipeIngredient {
  id: number
  product: IngredientProduct | null
  name: string
  quantity: string
  unit: string
  notes: string
}

export interface RecipeStep {
  id: number
  step_number: number
  instruction: string
  image: string | null
}

export interface Recipe {
  id: number
  title: string
  slug: string
  description: string
  cover_image: string | null
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  is_default: boolean
  nutritional_score?: number
  video_url?: string
  created_at: string
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
  updated_at?: string
}

export interface RecipePairing {
  id: number
  suggested_recipe: Recipe
  label: string
  order: number
}

export interface RecipeWithPairings extends Recipe {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  pairings: RecipePairing[]
}

export interface UserRecipeIngredient {
  id?: number
  product: IngredientProduct | null
  name: string
  quantity: number
  unit: string
  notes: string
  order: number
}

export interface UserRecipe {
  id: number
  name: string
  description: string
  base_recipes: Recipe[]
  ingredients: UserRecipeIngredient[]
  is_saved: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  street_address?: string
  house_number?: string
  city?: string
  delivery_region?: string
  avatar?: string | null
  created_at: string
  email_verified: boolean
}

export interface ProductDetail extends Product {
  ingredients?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export interface OrderItemData {
  product: {
    id: number
    name: string
    slug: string
    price: string
    unit: string
  }
  quantity: number
  unit_price: string
  subtotal: string
}

export interface Order {
  id: number
  reference: string
  status: string
  payment_status: string
  total_amount: string
  discount_amount?: string
  promo_code?: string
  delivery_address: string
  items: OrderItemData[]
  created_at: string
}

export interface PromoCode {
  code: string
  ambassador_name: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  final_amount: number
  message: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface ApiError {
  detail?: string
  message?: string
  errors?: Record<string, string[]>
}

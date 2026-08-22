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

export interface ProductImage {
  id: number
  image: string
  alt_text: string
  order: number
  is_primary: boolean
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
  images?: ProductImage[]
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
  image: string | null
  is_available: boolean
}

export interface RecipeIngredient {
  id: number
  product: IngredientProduct | null
  matched_products: IngredientProduct[]
  name: string
  raw_text: string
  quantity: string
  quantity_max: string | null
  unit: string
  normalized_unit: string
  preparation: string
  optional: boolean
  notes: string
}

export interface RecipeNutrition {
  source: string
  is_complete: boolean
  calculation_warnings: string[]
  calories: string | null
  protein_g: string | null
  carbohydrate_g: string | null
  fat_g: string | null
  saturated_fat_g: string | null
  fibre_g: string | null
  sugar_g: string | null
  sodium_mg: string | null
  cholesterol_mg: string | null
  calculated_at: string
}

export interface RecipeStep {
  id: number
  step_number: number
  section: string
  instruction: string
  image: string | null
}

export interface Recipe {
  id: number
  title: string
  local_name?: string
  slug: string
  description: string
  cover_image: string | null
  prep_time: number
  cook_time: number
  total_time?: number
  servings: number
  cuisine?: string
  country?: string
  region?: string
  recipe_category?: string
  meal_type?: string
  keywords?: string[]
  difficulty: string
  is_default: boolean
  nutritional_score?: number
  video_url?: string
  created_at: string
  published_at?: string | null
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
  nutrition: RecipeNutrition | null
  nutrition_attribution: { name: string; url: string } | null
  source_attribution: { name: string; url: string; author: string; license: string } | null
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
  is_staff?: boolean
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

export interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    slug: string
    image: string | null
    price: string
    unit: string
  } | null
  quantity: number
  unit_price: string
}

export interface Order {
  id: number
  reference: string
  status: 'pending' | 'whatsapp_pending' | 'paid' | 'processing' | 'ready_for_dispatch' | 'out_for_delivery' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'success' | 'failed' | 'expired'
  order_source: 'seevcash' | 'subscription' | 'paystack' | 'whatsapp'
  total_amount: string
  discount_amount: string
  promo_code?: string
  delivery_address: string
  guest_name?: string
  guest_phone?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
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

export interface WishlistItem {
  id: number
  product: Product
  created_at: string
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

export interface BusinessPrice {
  id: number
  product: Product
  unit_price: string
  minimum_quantity: number
  is_available: boolean
}

export interface BusinessPriceList {
  id: number
  name: string
  description: string
  prices: BusinessPrice[]
}

export interface B2BProfile {
  id: number
  company_name: string
  business_type: string
  business_type_display: string
  contact_person: string
  business_phone: string
  business_email: string
  business_address: string
  estimated_monthly_order: string | null
  status: 'pending' | 'under_review' | 'changes_requested' | 'approved' | 'rejected' | 'suspended'
  status_display: string
  price_list: BusinessPriceList | null
  rejection_reason: string
  approved_at: string | null
  created_at: string
}

export interface DeliveryZone {
  id: number
  name: string
  slug: string
  delivery_weekday: number
  delivery_day: string
  cutoff_hours: number
  delivery_fee: string
}

export interface SubscriptionPlanItem {
  id: number
  product: Product
  quantity: number
  can_swap: boolean
}

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  audience: 'household' | 'business'
  plan_type: 'curated' | 'custom'
  short_description: string
  weekly_price: string
  household_size: number | null
  image: string | null
  is_featured: boolean
  items: SubscriptionPlanItem[]
}

export interface SubscriptionItem {
  id: number
  product: Product
  quantity: number
  unit_price: string
  subtotal: string
  can_substitute: boolean
  display_order: number
}

export interface SubscriptionWeek {
  id: number
  delivery_date: string
  cutoff_at: string
  status: string
  subtotal: string
  delivery_fee: string
  total: string
  payment_reference: string | null
  paid_at: string | null
  customer_note: string
  order: number | null
}

export interface FoodSubscription {
  id: number
  name: string
  audience: 'household' | 'business'
  status: 'draft' | 'active' | 'paused' | 'cancelled'
  plan: number | null
  plan_detail: SubscriptionPlan | null
  delivery_zone: number
  delivery_zone_detail: DeliveryZone
  delivery_address: string
  contact_phone: string
  payment_method: 'card' | 'mobile_money'
  weekly_subtotal: string
  weekly_delivery_fee: string
  weekly_total: string
  next_delivery_date: string | null
  card_brand: string
  card_last4: string
  items: SubscriptionItem[]
  weeks: SubscriptionWeek[]
  created_at: string
}

export interface WholesaleQuote {
  id: number
  status: string
  requested_delivery_date: string | null
  is_recurring: boolean
  customer_note: string
  quoted_subtotal: string | null
  valid_until: string | null
  items: Array<{
    id: number
    product: Product
    quantity: number
    requested_unit: string
    quoted_unit_price: string | null
    note: string
  }>
  created_at: string
  updated_at: string
}

export interface SalesRepProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  referral_code: string
  phone: string
  status: 'active' | 'suspended'
  commission_rate_registration: string
  commission_rate_first_purchase: string
  commission_rate_repeat_purchase: string
  created_at: string
}

export interface ReferredCustomer {
  id: number
  customer_name: string
  customer_email: string
  source: 'rep_form' | 'referral_link'
  status: 'registered' | 'converted'
  commission_expires_at: string
  days_remaining: number
  created_at: string
}

export interface Commission {
  id: number
  customer_name: string
  order_reference: string | null
  type: 'registration' | 'first_purchase' | 'repeat_purchase'
  amount: string
  status: 'pending' | 'approved' | 'paid'
  created_at: string
}

export interface CommissionSummary {
  commissions: Commission[]
  summary: {
    pending: string
    approved: string
    paid: string
  }
}

export interface AppNotification {
  id: number
  type: 'order_placed' | 'order_paid' | 'b2b_application' |
        'sales_rep_customer'
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

export interface NotificationResponse {
  unread_count: number
  results: AppNotification[]
}

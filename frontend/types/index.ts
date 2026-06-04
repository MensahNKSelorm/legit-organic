export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  unit: string;
  category: ProductCategory;
  images: ProductImage[];
  inStock: boolean;
  isOrganic: boolean;
  isFeatured: boolean;
  farmer?: Farmer;
  createdAt: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Farmer {
  id: number;
  name: string;
  region: string;
  bio: string;
  avatar?: string;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
  author: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
  isFeatured: boolean;
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  productId?: number;
}

export interface RecipeStep {
  order: number;
  description: string;
  image?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  category: BlogCategory;
  author: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
  publishedAt: string;
  readingTime: number;
  isFeatured: boolean;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

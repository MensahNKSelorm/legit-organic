import { WishlistProvider } from "@/lib/wishlist";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}

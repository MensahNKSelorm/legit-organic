import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Legit Organic account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="w-10 h-10 rounded-full bg-forest-green flex items-center justify-center text-ghana-gold font-bold">
              LO
            </span>
            <span className="font-display text-2xl font-bold text-forest-green">Legit Organic</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-forest-green">Welcome back</h1>
          <p className="text-charcoal/60 mt-2 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="bg-mist-white rounded-2xl p-8 border border-sand shadow-sm">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-charcoal/80">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-leaf-green hover:text-forest-green transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-charcoal/60 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-leaf-green font-semibold hover:text-forest-green transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

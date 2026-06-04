import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Legit Organic account and start accessing certified organic produce.",
};

export default function SignupPage() {
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
          <h1 className="font-display text-3xl font-bold text-forest-green">Join the community</h1>
          <p className="text-charcoal/60 mt-2 text-sm">
            Access Ghana&apos;s most trusted organic marketplace
          </p>
        </div>

        {/* Card */}
        <div className="bg-mist-white rounded-2xl p-8 border border-sand shadow-sm">
          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Kwame"
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Asante"
                  autoComplete="family-name"
                  className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                />
              </div>
            </div>
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
              <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
              />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 accent-leaf-green rounded"
              />
              <label htmlFor="terms" className="text-xs text-charcoal/60 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-leaf-green hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-leaf-green hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-charcoal/60 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-leaf-green font-semibold hover:text-forest-green transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

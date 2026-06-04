import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🌿</div>
        <h1 className="font-display text-5xl font-bold text-forest-green mb-4">404</h1>
        <p className="font-display text-xl text-forest-green mb-2">Page Not Found</p>
        <p className="text-charcoal/70 mb-8">
          Looks like this page wandered off into the fields. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-ghana-gold text-forest-green font-semibold px-6 py-3 rounded-xl hover:bg-dark-gold transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

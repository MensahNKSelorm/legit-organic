import Link from "next/link";

const footerLinks = {
  Company: [
    { label: "About Us",       href: "/about" },
    { label: "Our Farmers",    href: "/farmers" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "Contact",        href: "/contact" },
  ],
  Explore: [
    { label: "Products",    href: "/products" },
    { label: "Recipes",     href: "/recipes" },
    { label: "Blog",        href: "/blog" },
    { label: "Health Tips", href: "/blog?tag=health" },
  ],
  Account: [
    { label: "Login",       href: "/login" },
    { label: "Sign Up",     href: "/signup" },
    { label: "My Recipes",  href: "/my-recipes" },
    { label: "Profile",     href: "/profile" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#0D3B2A", color: "#FEFCF7" }}>
      <div
        className="page-container max-w-7xl mx-auto px-6 lg:px-8"
        style={{ paddingTop: "5rem", paddingBottom: "4rem" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div style={{ marginBottom: "1.25rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-darkmode.svg"
                alt="Legit Organic"
                style={{ height: "44px", width: "auto" }}
              />
            </div>

            <p className="text-light-leaf text-sm leading-relaxed mb-6">
              Rebuilding trust in Ghana&apos;s food ecosystem — connecting conscious consumers
              directly with verified organic farmers across the country.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {(["T", "I", "F"] as const).map((initial, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={["Twitter", "Instagram", "Facebook"][i]}
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "9999px",
                    border: "1px solid #2E7D32",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#81C784",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  className="hover:bg-ghana-gold hover:text-forest-green hover:border-ghana-gold"
                >
                  {initial}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3
                className="font-display font-semibold text-ghana-gold uppercase tracking-widest mb-5"
                style={{ fontSize: "0.75rem" }}
              >
                {category}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-light-leaf text-sm hover:text-mist-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(46,125,50,0.3)",
            marginTop: "3.5rem",
            paddingTop: "2rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p className="text-light-leaf" style={{ fontSize: "0.75rem" }}>
            &copy; {new Date().getFullYear()} Legit Organic Limited. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/privacy" className="text-light-leaf hover:text-mist-white transition-colors" style={{ fontSize: "0.75rem" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-light-leaf hover:text-mist-white transition-colors" style={{ fontSize: "0.75rem" }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

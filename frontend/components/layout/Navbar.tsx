"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home",     href: "/" },
  { label: "Products", href: "/products" },
  { label: "Recipes",  href: "/recipes" },
  { label: "Blog",     href: "/blog" },
  { label: "About",    href: "/about" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2"
      fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2"
      fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [darkMode,  setDarkMode]  = useState(false);

  /* ── Scroll detection + theme init ────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Load persisted theme preference */
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  /*
    onDark = true  → navbar is transparent, sitting over the dark hero image
                     → everything must be white so it's visible
    onDark = false → navbar has the light/mist-white backdrop (scrolled)
                     → everything switches to Deep Forest Green
  */
  const onDark = !scrolled;

  /* Shared token classes for the two auth buttons */
  const btnBase = "px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-mist-white/95 backdrop-blur-md shadow-sm border-b border-sand dark:bg-[#1a1a1a]/95 dark:border-[#333]"
          : "bg-transparent",
      ].join(" ")}
    >
      <nav
        className="page-container max-w-7xl mx-auto px-6 lg:px-8"
        style={{ height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}
      >
        {/* ── Logo ──────────────────────────────────────────────── */}
        <Link href="/" className="shrink-0 flex items-center" aria-label="Legit Organic — Home">
          <Image
            src={onDark ? "/images/logo-darkmode.svg" : "/images/logo-lightmode.svg"}
            alt="Legit Organic"
            width={160}
            height={44}
            priority
            style={{ width: "auto", height: "40px", objectFit: "contain" }}
          />
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={[
                  "font-medium text-sm transition-colors duration-200 whitespace-nowrap relative",
                  "after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px",
                  "after:bg-ghana-gold after:transition-all after:duration-200 hover:after:w-full",
                  onDark
                    ? "text-white hover:text-white"
                    : "text-forest-green hover:text-leaf-green",
                ].join(" ")}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Theme toggle + Auth ───────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3 shrink-0">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={[
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              onDark
                ? "text-white hover:bg-white/15"
                : "text-forest-green hover:bg-beige dark:hover:bg-[#333]",
            ].join(" ")}
          >
            {/* Sun = currently in light mode; Moon = currently in dark mode */}
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Login — outlined, scroll-aware border + text color */}
          <Link
            href="/login"
            className={[
              btnBase,
              "border-2",
              onDark
                ? "border-white text-white hover:bg-white/10"
                : "border-forest-green text-forest-green hover:bg-beige dark:hover:bg-[#333]",
            ].join(" ")}
          >
            Login
          </Link>

          {/* Sign Up — always gold filled */}
          <Link
            href="/signup"
            className={`${btnBase} bg-ghana-gold text-forest-green hover:bg-dark-gold shadow-sm`}
          >
            Sign Up
          </Link>
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────── */}
        <button
          aria-label="Toggle navigation menu"
          className="md:hidden shrink-0 flex flex-col justify-center gap-[5px] p-2 rounded-lg"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {[
            menuOpen ? "rotate-45 translate-y-[7px]" : "",
            menuOpen ? "opacity-0 scale-x-0" : "",
            menuOpen ? "-rotate-45 -translate-y-[7px]" : "",
          ].map((extra, idx) => (
            <span
              key={idx}
              className={[
                "block w-5 h-0.5 rounded-full transition-all duration-300 origin-center",
                onDark ? "bg-white" : "bg-forest-green",
                extra,
              ].join(" ")}
            />
          ))}
        </button>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      <div
        className={[
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          "bg-mist-white border-t border-sand dark:bg-[#1a1a1a] dark:border-[#333]",
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <ul className="px-6 py-5 flex flex-col gap-1" style={{ listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-forest-green dark:text-[#faf7f0] font-medium rounded-xl hover:bg-beige dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}

          {/* Mobile theme toggle */}
          <li>
            <button
              onClick={toggleTheme}
              className="w-full text-left flex items-center gap-3 py-3 px-4 text-forest-green dark:text-[#faf7f0] font-medium rounded-xl hover:bg-beige dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
          </li>

          <li className="border-t border-sand dark:border-[#333] mt-3 pt-4 flex gap-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center text-forest-green font-semibold py-2 px-4 rounded-full border-2 border-forest-green hover:bg-forest-green hover:text-mist-white transition-colors text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center bg-ghana-gold text-forest-green font-semibold py-2 px-4 rounded-full hover:bg-dark-gold transition-colors text-sm"
            >
              Sign Up
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

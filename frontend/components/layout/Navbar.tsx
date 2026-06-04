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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

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
    transparent (not scrolled) → always over dark hero image → everything white
    scrolled light mode        → white bg → forest green text
    scrolled dark mode         → dark bg  → white text
  */
  const transparent = !scrolled;

  const btnBase = "px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap";

  /* Nav link text color */
  const linkColor = transparent
    ? "text-white hover:text-white/80"
    : "text-[#0D3B2A] hover:text-[#2e7d32] dark:text-[#F9FAFB] dark:hover:text-white";

  /* Theme toggle color */
  const toggleColor = transparent
    ? "text-white hover:bg-white/15"
    : "text-[#0D3B2A] hover:bg-[#f5f0e6] dark:text-[#F9FAFB] dark:hover:bg-[#333]";

  /* Login button color */
  const loginColor = transparent
    ? "text-white hover:text-white/70"
    : "text-[#0D3B2A] hover:text-[#0D3B2A]/70 dark:text-[#F9FAFB] dark:hover:text-white/70";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-mist-white/95 backdrop-blur-md shadow-sm border-b border-sand dark:bg-[#111827]/95 dark:border-[#333]"
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
            src={(!scrolled || darkMode) ? "/images/logo-darkmode.svg" : "/images/logo-lightmode.svg"}
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
                  "after:bg-[#F4C430] after:transition-all after:duration-200 hover:after:w-full",
                  linkColor,
                ].join(" ")}
                style={transparent ? { color: "#ffffff" } : undefined}
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
              toggleColor,
            ].join(" ")}
            style={transparent ? { color: "#ffffff" } : undefined}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Login — no border, text only */}
          <Link
            href="/login"
            className={`${btnBase} ${loginColor}`}
            style={transparent ? { color: "#ffffff" } : undefined}
          >
            Login
          </Link>

          {/* Sign Up — always gold filled */}
          <Link
            href="/signup"
            className={`${btnBase} bg-[#F4C430] text-[#0D3B2A] hover:bg-[#c59f2c]`}
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
                transparent ? "bg-white" : "bg-[#0D3B2A] dark:bg-[#F9FAFB]",
                extra,
              ].join(" ")}
              style={transparent ? { backgroundColor: "#ffffff" } : undefined}
            />
          ))}
        </button>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      <div
        className={[
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          "bg-mist-white border-t border-sand dark:bg-[#111827] dark:border-[#333]",
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <ul className="px-6 py-5 flex flex-col gap-1" style={{ listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-[#0D3B2A] dark:text-[#F9FAFB] font-medium rounded-xl hover:bg-beige dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}

          {/* Mobile theme toggle */}
          <li>
            <button
              onClick={toggleTheme}
              className="w-full text-left flex items-center gap-3 py-3 px-4 text-[#0D3B2A] dark:text-[#F9FAFB] font-medium rounded-xl hover:bg-beige dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
          </li>

          <li className="border-t border-sand dark:border-[#333] mt-3 pt-4 flex gap-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center text-[#0D3B2A] dark:text-[#F9FAFB] font-semibold py-2 px-4 rounded-lg hover:opacity-70 transition-opacity text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center bg-[#F4C430] text-[#0D3B2A] font-semibold py-2 px-4 rounded-lg hover:bg-[#c59f2c] transition-colors text-sm"
            >
              Sign Up
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

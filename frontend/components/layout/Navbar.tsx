"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import CartIcon from "@/components/cart/CartIcon";
import SearchModal from "@/components/search/SearchModal";
import NotificationBell from "@/components/ui/NotificationBell";

const navLinks = [
  { label: "Market", href: "/products" },
  { label: "Plan the week", href: "/subscriptions" },
  { label: "Cook", href: "/recipes" },
  { label: "Journal", href: "/blog" },
];

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="15 6 21 6 21 12" />
    </svg>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isB2B, isSalesRep, logout } = useAuth();

  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/check-email" ||
    pathname === "/verify-email";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    Promise.resolve().then(() => setDarkMode(isDark));
    document.documentElement.classList.toggle("dark", isDark);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const lightTopRoutes =
    pathname.startsWith("/blog") ||
    pathname === "/profile" ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/b2b");
  const transparent = !scrolled && !isAuthPage && !lightTopRoutes;

  const btnBase = "px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap";

  const linkColor = transparent
    ? "text-white hover:text-white/80"
    : "text-[#0D3B2A] hover:text-[#2e7d32] dark:text-[#F9FAFB] dark:hover:text-white";

  const toggleColor = transparent
    ? "text-white hover:bg-white/15"
    : "text-[#0D3B2A] hover:bg-[#f5f0e6] dark:text-[#F9FAFB] dark:hover:bg-[#333]";

  const loginColor = transparent
    ? "text-white hover:text-white/70"
    : "text-[#0D3B2A] hover:text-[#0D3B2A]/70 dark:text-[#F9FAFB] dark:hover:text-white/70";

  const initials = user
    ? [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() ||
      user.email[0].toUpperCase()
    : "";

  return (
    <>
      <header
        className={[
          "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
          !transparent
            ? "bg-mist-white/95 border-b border-[#0D3B2A]/15 backdrop-blur-md dark:border-[#333] dark:bg-[#111827]/95"
            : "bg-transparent",
        ].join(" ")}
      >
        <nav
          className="page-container mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8"
          style={{ height: "76px", display: "flex", alignItems: "center", gap: "1.5rem" }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center md:min-w-[160px]"
            aria-label="Legit Organic home"
          >
            <Image
              src={
                transparent || darkMode ? "/images/logo-darkmode.svg" : "/images/logo-lightmode.svg"
              }
              alt="Legit Organic"
              width={160}
              height={44}
              priority
              className="h-[34px] w-auto sm:h-10"
            />
          </Link>

          {/* Desktop nav links */}
          <ul
            className="hidden flex-1 items-center justify-center gap-8 md:flex"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={[
                    "relative text-sm font-medium whitespace-nowrap transition-colors duration-200",
                    "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0",
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

          {/* Theme + Auth (desktop) */}
          <div
            className="hidden shrink-0 items-center justify-end gap-3 md:flex"
            style={{ minWidth: "160px" }}
          >
            <div
              className={[
                "flex items-center border",
                transparent ? "border-white/35" : "border-[#0D3B2A]/20 dark:border-white/25",
              ].join(" ")}
            >
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={[
                  "flex h-10 w-10 items-center justify-center transition-colors",
                  toggleColor,
                ].join(" ")}
                style={transparent ? { color: "#ffffff" } : undefined}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center border-l transition-[background-color]",
                  transparent ? "border-white/35" : "border-[#0D3B2A]/20 dark:border-white/25",
                  toggleColor,
                ].join(" ")}
                style={{ color: transparent ? "#ffffff" : undefined }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="18"
                  height="18"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>

            {/* Cart icon */}
            <CartIcon isTransparent={transparent} />

            {isAuthenticated && user ? (
              <>
                {user.is_staff && <NotificationBell isTransparent={transparent} />}
                {/* ── Authenticated: avatar + dropdown ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className={[
                      "flex h-10 items-center gap-2 border px-2 transition-colors",
                      transparent
                        ? "border-white/35 hover:border-white"
                        : "border-[#0D3B2A]/20 hover:border-[#0D3B2A] dark:border-white/25 dark:hover:border-[#F4C430]",
                    ].join(" ")}
                    aria-label="Account menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center bg-[#F4C430] font-sans text-[11px] font-bold tracking-wide text-[#0D3B2A]">
                      {initials}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={transparent ? { color: "#ffffff" } : undefined}
                    >
                      {user.first_name}
                    </span>
                    <span style={transparent ? { color: "#ffffff" } : undefined}>
                      <ChevronDown />
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-3 w-72 border border-[#0D3B2A]/20 bg-[#FAF7F0] shadow-[8px_8px_0_rgba(13,59,42,.12)] dark:border-white/20 dark:bg-[#1B211D] dark:shadow-[8px_8px_0_rgba(244,196,48,.12)]">
                      <div className="border-b border-[#0D3B2A]/15 bg-[#0D3B2A] px-5 py-5 text-white dark:border-white/15">
                        <div className="flex items-start gap-3">
                          <div className="display-organic flex h-11 w-11 shrink-0 items-center justify-center bg-[#F4C430] text-xl text-[#0D3B2A]">
                            {initials}
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="truncate text-sm font-bold">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/60">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-2">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="block border-b border-[#0D3B2A]/10 px-3 py-3 text-sm font-medium text-[#0D3B2A] transition-colors hover:bg-[#F4C430]/20 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/my-recipes"
                          onClick={() => setDropdownOpen(false)}
                          className="block border-b border-[#0D3B2A]/10 px-3 py-3 text-sm font-medium text-[#0D3B2A] transition-colors hover:bg-[#F4C430]/20 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                          My Recipes
                        </Link>
                        <Link
                          href="/subscriptions/manage"
                          onClick={() => setDropdownOpen(false)}
                          className="block border-b border-[#0D3B2A]/10 px-3 py-3 text-sm font-medium text-[#0D3B2A] transition-colors hover:bg-[#F4C430]/20 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                          Weekly Deliveries
                        </Link>
                        <Link
                          href={isB2B ? "/b2b/dashboard" : "/b2b/apply"}
                          onClick={() => setDropdownOpen(false)}
                          className="block border-b border-[#0D3B2A]/10 px-3 py-3 text-sm font-medium text-[#0D3B2A] transition-colors hover:bg-[#F4C430]/20 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                          {isB2B ? "🏢 B2B Dashboard" : "B2B Portal"}
                        </Link>
                        {isSalesRep && (
                          <Link
                            href="/sales/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 border-b border-[#0D3B2A]/10 px-3 py-3 text-sm font-medium text-[#0D3B2A] transition-colors hover:bg-[#F4C430]/20 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                          >
                            <SalesIcon />
                            Sales Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="w-full px-3 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Not authenticated: Login + Sign Up ── */
              <>
                <Link
                  href="/login"
                  className={`${btnBase} ${loginColor}`}
                  style={transparent ? { color: "#ffffff" } : undefined}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={`${btnBase} border border-[#F4C430] bg-[#F4C430] text-[#0D3B2A] hover:border-[#fefcf7] hover:bg-[#fefcf7]`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile right: search + cart + hamburger */}
          <div className="ml-auto flex shrink-0 items-center gap-1 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center transition-[background-color]",
                toggleColor,
              ].join(" ")}
              style={{ color: transparent ? "#ffffff" : undefined }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <CartIcon isTransparent={transparent} />
            {isAuthenticated && user?.is_staff && <NotificationBell isTransparent={transparent} />}
            <button
              ref={mobileMenuButtonRef}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="flex shrink-0 flex-col justify-center gap-[5px] rounded-lg p-2"
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
                    "block h-0.5 w-5 origin-center rounded-full transition-all duration-300",
                    transparent ? "bg-white" : "bg-[#0D3B2A] dark:bg-[#F9FAFB]",
                    extra,
                  ].join(" ")}
                  style={transparent ? { backgroundColor: "#ffffff" } : undefined}
                />
              ))}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        <div
          id="mobile-navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={[
            "overflow-hidden transition-all duration-300 ease-in-out md:hidden",
            "bg-mist-white border-sand border-t dark:border-[#333] dark:bg-[#111827]",
            menuOpen ? "max-h-[80vh] overflow-y-auto opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          {menuOpen && <ul className="flex flex-col gap-1 px-6 py-5 pb-6" style={{ listStyle: "none" }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="hover:bg-beige block rounded-xl px-4 py-3 font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Theme toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="hover:bg-beige flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
                {darkMode ? "Light mode" : "Dark mode"}
              </button>
            </li>

            {/* Search */}
            <li>
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setMenuOpen(false);
                }}
                className="hover:bg-beige flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="18"
                  height="18"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search products
              </button>
            </li>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <>
                <li>
                  <div className="border-sand mt-3 flex items-center gap-3 border-t px-4 py-3 pt-4 dark:border-[#333]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4C430] font-sans text-xs font-bold tracking-wide text-[#0D3B2A] ring-2 ring-[#0D3B2A] ring-offset-1">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0D3B2A] dark:text-[#F9FAFB]">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-charcoal/50 text-xs dark:text-[#9ca3af]">{user.email}</p>
                    </div>
                  </div>
                </li>
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-[#0D3B2A]/10 py-4 font-medium text-[#0D3B2A] transition-colors hover:text-[#2E7D32] dark:text-[#F9FAFB]"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-recipes"
                    onClick={() => setMenuOpen(false)}
                    className="hover:bg-beige block rounded-xl px-4 py-3 font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
                  >
                    My Recipes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscriptions/manage"
                    onClick={() => setMenuOpen(false)}
                    className="hover:bg-beige block rounded-xl px-4 py-3 font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
                  >
                    Weekly Deliveries
                  </Link>
                </li>
                <li>
                  <Link
                    href={isB2B ? "/b2b/dashboard" : "/b2b/apply"}
                    onClick={() => setMenuOpen(false)}
                    className="hover:bg-beige block rounded-xl px-4 py-3 font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
                  >
                    {isB2B ? "🏢 B2B Dashboard" : "B2B Portal"}
                  </Link>
                </li>
                {isSalesRep && (
                  <li>
                    <Link
                      href="/sales/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="hover:bg-beige flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-[#0D3B2A] transition-colors dark:text-[#F9FAFB] dark:hover:bg-[#2a2a2a]"
                    >
                      <SalesIcon />
                      Sales Dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="border-sand mt-3 flex gap-3 border-t pt-4 dark:border-[#333]">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold text-[#0D3B2A] transition-opacity hover:opacity-70 dark:text-[#F9FAFB]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 bg-[#F4C430] px-4 py-2 text-center text-sm font-semibold text-[#0D3B2A] transition-colors hover:bg-[#c59f2c]"
                >
                  Sign Up
                </Link>
              </li>
            )}
          </ul>}
        </div>
      </header>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

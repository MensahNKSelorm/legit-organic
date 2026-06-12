"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* 10 background images cycle independently at a faster cadence */
const heroImages = [
  "/images/hero/1.webp",
  "/images/hero/2.webp",
  "/images/hero/3.webp",
  "/images/hero/4.webp",
  "/images/hero/5.webp",
  "/images/hero/6.webp",
  "/images/hero/7.webp",
  "/images/hero/8.webp",
  "/images/hero/9.webp",
  "/images/hero/10.webp",
];

/* 3 text slides cycle at a slower cadence */
const slides = [
  {
    accent: "Certified Organic",
    tagline: "Rebuilding Trust in Ghana's Food Ecosystem",
    sub: "Direct from verified organic farms across Ghana — no middlemen, no compromises.",
    cta: "Shop Fresh Produce",
    ctaHref: "/products",
  },
  {
    accent: "Farm-to-Table",
    tagline: "From the Soil to Your Table",
    sub: "Every product is traceable back to the farmer who grew it. Know your food, know your farmer.",
    cta: "Meet Our Farmers",
    ctaHref: "/about",
  },
  {
    accent: "100% Natural",
    tagline: "Nourishing Ghana, One Household at a Time",
    sub: "Seasonal organic staples — rice, yam, vegetables, and spices — delivered with integrity.",
    cta: "Explore Recipes",
    ctaHref: "/recipes",
  },
];

const stats = [
  { value: "20+",  label: "Verified Farmers" },
  { value: "16",   label: "Regions Across Ghana" },
  { value: "100%", label: "Organic Certified" },
];

export default function HeroSection() {
  const [imgIdx,   setImgIdx]   = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    /* background image advances every 4 s */
    const imgTimer   = setInterval(() => setImgIdx(  (i) => (i + 1) % heroImages.length), 4000);
    /* text slide advances every 7 s */
    const slideTimer = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length),     7000);
    return () => { clearInterval(imgTimer); clearInterval(slideTimer); };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#0D3B2A",   /* fallback while images load */
      }}
    >
      {/* ── Background images ──────────────────────────────────── */}
      {heroImages.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === imgIdx ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
          }}
          aria-hidden
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover object-center"
            priority={i === 0}
            quality={80}
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── Dark overlay for text readability ──────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(13,59,42,0.82) 0%, rgba(13,59,42,0.55) 60%, rgba(13,59,42,0.30) 100%)",
        }}
        aria-hidden
      />

      {/* ── Content ────────────────────────────────────────────── */}
      <div
        className="page-container max-w-7xl mx-auto px-6 lg:px-8"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          paddingTop: "7rem",    /* clear the fixed navbar */
          paddingBottom: "5rem",
        }}
      >
        {/* Text slides — absolute stack, only active one visible */}
        <div style={{ position: "relative", minHeight: "22rem", maxWidth: "42rem", marginBottom: "3rem" }}>
          {slides.map((slide, i) => (
            <div
              key={i}
              className={i === slideIdx ? "hero-text-enter" : ""}
              style={{
                position: i === slideIdx ? "relative" : "absolute",
                inset: 0,
                opacity: i === slideIdx ? 1 : 0,
                transition: "opacity 0.7s ease-in-out",
                pointerEvents: i === slideIdx ? "auto" : "none",
              }}
              aria-hidden={i !== slideIdx}
            >
              {/* Badge */}
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(244,196,48,0.15)",
                  border: "1px solid rgba(244,196,48,0.4)",
                  color: "#F4C430",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "1.5rem",
                }}
              >
                {slide.accent}
              </span>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                  fontWeight: 700,
                  color: "#FEFCF7",
                  lineHeight: 1.1,
                  marginBottom: "1.25rem",
                }}
              >
                {slide.tagline}
              </h1>

              {/* Sub-text */}
              <p
                style={{
                  color: "#81C784",
                  fontSize: "1.125rem",
                  lineHeight: 1.7,
                  maxWidth: "36rem",
                  marginBottom: "2.5rem",
                }}
              >
                {slide.sub}
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                <Link
                  href={slide.ctaHref}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.75rem 2rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: "0.5rem",
                    minHeight: "48px",
                    backgroundColor: "#F4C430",
                    color: "#0D3B2A",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.2s",
                  }}
                >
                  {slide.cta}
                </Link>
                <Link
                  href="/about"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.75rem 2rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: "0.5rem",
                    minHeight: "48px",
                    backgroundColor: "transparent",
                    border: "2px solid white",
                    color: "white",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.2s",
                  }}
                >
                  Our Story
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Slide dots ─────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "3.5rem" }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                height: "6px",
                width: i === slideIdx ? "2rem" : "0.75rem",
                borderRadius: "9999px",
                background: i === slideIdx ? "#F4C430" : "rgba(255,255,255,0.25)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.4s ease",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem" }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ borderLeft: "2px solid #F4C430", paddingLeft: "1rem" }}>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#FEFCF7",
                  lineHeight: 1,
                  marginBottom: "0.25rem",
                }}
              >
                {stat.value}
              </p>
              <p style={{ color: "#81C784", fontSize: "0.875rem" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

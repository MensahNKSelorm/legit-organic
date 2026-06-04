import React from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: "cream" | "beige" | "forest" | "mist";
}

const bgStyles: Record<NonNullable<SectionWrapperProps["background"]>, string> = {
  cream:   "bg-cream",
  beige:   "bg-beige",
  forest:  "bg-forest-green",
  mist:    "bg-mist-white",
};

export default function SectionWrapper({
  children,
  className = "",
  id,
  background = "cream",
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`${bgStyles[background]} py-24 md:py-32 ${className}`}
    >
      {/*
        Two centering mechanisms for reliability:
        - Tailwind: max-w-7xl mx-auto px-6 lg:px-8
        - CSS class: .page-container (max-width: 80rem, margin: auto, padding: 1.5rem)
        Both achieve the same thing; belt-and-suspenders for Tailwind scanning edge cases.
      */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

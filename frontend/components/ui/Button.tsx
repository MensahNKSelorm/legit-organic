import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  as?: "button" | "a";
  href?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ghana-gold text-forest-green font-semibold hover:bg-dark-gold active:scale-95 shadow-sm",
  secondary:
    "bg-forest-green text-mist-white font-semibold hover:bg-leaf-green active:scale-95 shadow-sm",
  outline:
    "border-2 border-forest-green text-forest-green font-semibold hover:bg-forest-green hover:text-mist-white active:scale-95",
  ghost: "text-forest-green font-medium hover:bg-beige active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

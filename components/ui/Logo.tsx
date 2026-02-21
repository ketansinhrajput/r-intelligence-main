"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-base" },
    md: { icon: "h-8 w-8", text: "text-lg" },
    lg: { icon: "h-12 w-12", text: "text-2xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Animated gradient icon */}
      <div
        className={cn(
          "relative rounded-xl flex items-center justify-center overflow-hidden",
          "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700",
          "shadow-lg shadow-purple-500/25",
          "transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105",
          sizes[size].icon
        )}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />

        {/* RI letters */}
        <span className="relative font-bold text-white tracking-tight" style={{ fontSize: size === "sm" ? "0.65rem" : size === "md" ? "0.75rem" : "1rem" }}>
          RI
        </span>

        {/* Subtle sparkle effect */}
        <div className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-white/60" />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent",
              sizes[size].text
            )}
          >
            Resume Intelligence
          </span>
        </div>
      )}
    </div>
  );
}

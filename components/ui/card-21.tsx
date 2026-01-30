import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  flag: string;
  stats: string;
  href: string;
  themeColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function withHexAlpha(color: string, alphaHex: string) {
  if (typeof color !== "string") return color;
  const c = color.trim();
  if (c.startsWith("#") && c.length === 7) return `${c}${alphaHex}`;
  return c;
}

function hexToRgb(hex: string) {
  const c = hex.trim();
  if (!c.startsWith("#") || c.length !== 7) return null;
  const r = Number.parseInt(c.slice(1, 3), 16);
  const g = Number.parseInt(c.slice(3, 5), 16);
  const b = Number.parseInt(c.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rr:
        h = ((gg - bb) / delta) % 6;
        break;
      case gg:
        h = (bb - rr) / delta + 2;
        break;
      default:
        h = (rr - gg) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (0 <= hh && hh < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (1 <= hh && hh < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (2 <= hh && hh < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (3 <= hh && hh < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (4 <= hh && hh < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  const m = l - c / 2;
  const to255 = (n: number) => Math.round((n + m) * 255);
  return { r: to255(r1), g: to255(g1), b: to255(b1) };
}

function brightenHexKeepHue(hex: string, opts?: { minLightness?: number; minSaturation?: number }) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  const minLightness = opts?.minLightness ?? 0.42;
  const minSaturation = opts?.minSaturation ?? 0.55;
  const targetL = Math.min(0.56, Math.max(hsl.l + 0.14, minLightness));
  if (hsl.s < 0.08) {
    return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: targetL }));
  }
  const targetS = Math.min(1, Math.max(hsl.s, minSaturation));
  return rgbToHex(hslToRgb({ h: hsl.h, s: targetS, l: targetL }));
}

function accentForEffects(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const lum = relativeLuminance(rgb);
  if (lum < 0.22) return brightenHexKeepHue(hex);
  return hex.toUpperCase();
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  (
    {
      className,
      imageUrl,
      location,
      flag: _flag,
      stats,
      href,
      themeColor = "210 10% 12%",
      gradientFrom,
      gradientTo,
      ...props
    },
    ref
  ) => {
    const effectFrom = gradientFrom ? accentForEffects(gradientFrom) : undefined;
    const effectTo = gradientTo ? accentForEffects(gradientTo) : undefined;

    const overlayGradient = gradientFrom && gradientTo
      ? `linear-gradient(to top, ${withHexAlpha(effectFrom ?? gradientFrom, "B3")}, ${withHexAlpha(effectTo ?? gradientTo, "80")} 35%, transparent 70%)`
      : `linear-gradient(to top, hsl(${themeColor} / 0.9), hsl(${themeColor} / 0.55) 35%, transparent 70%)`;

    const innerContentGradient = gradientFrom && gradientTo
      ? `radial-gradient(140% 120% at 90% 100%, ${withHexAlpha(effectTo ?? gradientTo, "52")} 0%, ${withHexAlpha(effectFrom ?? gradientFrom, "29")} 45%, transparent 75%)`
      : `radial-gradient(140% 120% at 90% 100%, hsl(${themeColor} / 0.35) 0%, hsl(${themeColor} / 0.18) 45%, transparent 75%)`;

    const glowColor = gradientTo
      ? withHexAlpha(effectTo ?? gradientTo, "99")
      : `hsl(${themeColor} / 0.6)`;

    const buttonAccent = gradientTo
      ? withHexAlpha(effectTo ?? gradientTo, "CC")
      : `hsl(${themeColor} / 0.6)`;

    const buttonBorder = gradientTo
      ? withHexAlpha(effectTo ?? gradientTo, "40")
      : `hsl(${themeColor} / 0.25)`;

    const buttonBorderHover = gradientTo
      ? withHexAlpha(effectTo ?? gradientTo, "66")
      : `hsl(${themeColor} / 0.4)`;

    return (
      <div
        ref={ref}
        style={
          {
            ["--theme-color" as any]: themeColor,
            ["--glow-color" as any]: glowColor,
            ["--button-accent" as any]: buttonAccent,
            ["--button-border" as any]: buttonBorder,
            ["--button-border-hover" as any]: buttonBorderHover,
          } as React.CSSProperties
        }
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <a
          href={href}
          className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out 
                     group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_var(--glow-color)]"
          aria-label={`Explore details for ${location}`}
          style={{
             boxShadow: `0 0 40px -15px var(--glow-color)`
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center 
                       transition-transform duration-500 ease-in-out group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute inset-0 opacity-70 mix-blend-soft-light" style={{ background: overlayGradient }} />
          
          <div className="relative flex flex-col justify-end h-full p-6 text-white">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: innerContentGradient }}
            />
            <div className="relative">
              <h3 className="text-3xl font-bold tracking-tight">
                {location}
              </h3>

              <div
                className="mt-8 flex items-center justify-between backdrop-blur-md border border-[color:var(--button-border)]
                             rounded-lg px-4 py-3
                             transition-all duration-300
                             group-hover:border-[color:var(--button-border-hover)]
                             shadow-[0_18px_45px_-30px_var(--glow-color)] group-hover:shadow-[0_18px_45px_-24px_var(--glow-color)]"
                style={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  boxShadow: "0 0 0 1px var(--button-border), 0 18px 45px -30px var(--glow-color)",
                }}
              >
                <span className="text-sm font-semibold tracking-wide">Ver Progresso</span>
                <ArrowRight
                  className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: "#fff" }}
                />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }
);
DestinationCard.displayName = "DestinationCard";

export { DestinationCard };

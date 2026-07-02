import { Easing, interpolate } from "remotion";
import type { CSSProperties } from "react";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

const geist = loadGeist("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const SANS = geist.fontFamily;
export const MONO = mono.fontFamily;

// Shared Vercel/Geist palette — identical across both demo videos.
export const C = {
  fg: "#171717",
  fg2: "#4d4d4d",
  fg3: "#8f8f8f",
  bg: "#ffffff",
  bg2: "#fafafa",
  fill: "#f3f3f3",
  border: "rgba(23,23,23,0.10)",
  borderSoft: "rgba(23,23,23,0.06)",
  blue: "#006bff",
  blueSoft: "rgba(0,107,255,0.10)",
  red: "#ea001d",
  green: "#28a948",
  greenSoft: "rgba(40,169,72,0.12)",
};

export const SHADOW_CARD =
  "0 1px 2px rgba(0,0,0,0.05), 0 18px 44px rgba(0,0,0,0.09)";
export const SHADOW_SOFT =
  "0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.05)";

export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

// Fade + rise reveal, used everywhere for consistent motion.
export function appear(frame: number, start: number, dur = 14): CSSProperties {
  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return { opacity: t, transform: `translateY(${(1 - t) * 12}px)` };
}

export function ramp(
  frame: number,
  a: number,
  b: number,
  from: number,
  to: number,
): number {
  return interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
}

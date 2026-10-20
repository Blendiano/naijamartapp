/**
 * Maps a product colour name (free text from the catalogue) to a small
 * presentational swatch.
 *
 * These hex values represent garment colours only. They are NOT UI/theme
 * colours and must never be used for layout or brand styling — the design
 * system tokens remain the single source of truth for the interface itself.
 */

export interface ColorSwatch {
  /** Representative colour, or `null` when no single colour is appropriate. */
  hex: string | null;
  /** True for multi-colour / printed / patterned options. */
  isMulti: boolean;
}

const COLOR_HEX: Record<string, string> = {
  black: "#1A1A1A",
  charcoal: "#36454F",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  silver: "#C0C0C0",
  white: "#FFFFFF",
  ivory: "#FFFFF0",
  cream: "#F5F0E1",
  beige: "#D9C7A7",
  sand: "#E3D5B8",
  tan: "#D2B48C",
  camel: "#C19A6B",
  brown: "#6B4F3A",
  chocolate: "#4E342E",
  gold: "#C8A878",
  mustard: "#D4A017",
  yellow: "#EAB308",
  orange: "#F97316",
  peach: "#FFCBA4",
  coral: "#FF7F50",
  red: "#DC2626",
  burgundy: "#6D071A",
  maroon: "#7B1E2B",
  wine: "#722F37",
  pink: "#EC4899",
  rose: "#E8719A",
  purple: "#7E22CE",
  lavender: "#B497BD",
  violet: "#6D28D9",
  indigo: "#4338CA",
  "royal blue": "#1E40AF",
  navy: "#1E3A5F",
  "sky blue": "#7DD3FC",
  blue: "#2563EB",
  teal: "#0D9488",
  turquoise: "#40E0D0",
  green: "#16A34A",
  olive: "#6B7C3A",
  emerald: "#059669",
  mint: "#A7F3D0",
};

const PATTERN_KEYWORDS = [
  "multi",
  "print",
  "pattern",
  "floral",
  "tie-dye",
  "tie dye",
  "stripe",
  "check",
  "plaid",
  "leopard",
  "zebra",
  "animal",
  "abstract",
  "colourful",
  "colorful",
];

// Longest keys first so "royal blue"/"sky blue" win over "blue".
const SORTED_COLOR_KEYS = Object.keys(COLOR_HEX).sort(
  (a, b) => b.length - a.length
);

export function getColorSwatch(
  color: string | null | undefined
): ColorSwatch {
  if (typeof color !== "string") return { hex: null, isMulti: false };

  const normalized = color.trim().toLowerCase();
  if (normalized.length === 0) return { hex: null, isMulti: false };

  if (PATTERN_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return { hex: null, isMulti: true };
  }

  const match = SORTED_COLOR_KEYS.find(
    (key) => normalized === key || normalized.includes(key)
  );

  return { hex: match ? COLOR_HEX[match] : null, isMulti: false };
}

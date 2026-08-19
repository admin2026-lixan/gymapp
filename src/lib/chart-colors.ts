// Paletas validadas con el skill dataviz (scripts/validate_palette.js) para
// modo oscuro y modo claro. Se seleccionan según el tema activo (next-themes)
// porque Recharts necesita colores concretos, no puede leer CSS vars en SVG
// de forma confiable en todos los navegadores.

export const CHART_COLORS = {
  dark: {
    surface: "#1a1a19",
    textPrimary: "#ffffff",
    textSecondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
    blue: "#3987e5",
    orange: "#d95926",
    aqua: "#199e70",
  },
  light: {
    surface: "#ffffff",
    textPrimary: "#0b0b0b",
    textSecondary: "#52514e",
    muted: "#78766f",
    grid: "#e5e4de",
    baseline: "#c9c8c1",
    blue: "#2a78d6",
    orange: "#eb6834",
    aqua: "#1baf7a",
  },
} as const;

export function chartColors(theme: string | undefined) {
  return theme === "light" ? CHART_COLORS.light : CHART_COLORS.dark;
}

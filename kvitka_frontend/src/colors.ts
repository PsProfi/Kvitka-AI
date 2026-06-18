export const COLORS = {
  red: "#E31E24",
  redDark: "#C01519",
  navy: "#1A2B4A",
  navyLight: "#243460",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  gray100: "#F0F0F0",
  gray200: "#E0E0E0",
  gray400: "#9E9E9E",
  gray600: "#616161",
  gray800: "#212121",
} as const;

export type ColorKey = keyof typeof COLORS;

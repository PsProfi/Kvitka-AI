import { COLORS } from "./colors";

export interface LogoProps {
  size?: number;
  light?: boolean;
}

export function Logo({ size = 36, light = false }: LogoProps) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "baseline",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontStyle: "italic",
      fontWeight: 900,
      userSelect: "none",
      transform: "skewX(-10deg)",
    }}>
      <span style={{
        fontSize: size,
        color: light ? "#FFFFFF" : COLORS.red,
        lineHeight: 1,
        letterSpacing: "-0.05em",
        marginRight: size * 0.08,
      }}>
        K
      </span>
      <span style={{
        fontSize: size * 0.38,
        background: light ? "#FFFFFF" : COLORS.red,
        color: light ? "#801229" : "#FFFFFF",
        padding: `${size * 0.05}px ${size * 0.12}px`,
        borderRadius: size * 0.08,
        fontWeight: 800,
        letterSpacing: "0.05em",
      }}>
        AI
      </span>
    </div>
  );
}


import { COLORS } from "./colors";

export function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 18, height: 18,
      border: `2px solid ${COLORS.gray200}`,
      borderTop: `2px solid ${COLORS.red}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

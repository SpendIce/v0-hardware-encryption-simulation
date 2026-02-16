"use client";

/**
 * Seven Segment Display
 *
 * Segment layout:
 *  aaaa
 * f    b
 *  gggg
 * e    c
 *  dddd
 */

const CHAR_SEGMENTS: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 1, 1, 0],
  "1": [0, 1, 1, 0, 0, 0, 0],
  "2": [1, 1, 0, 1, 1, 0, 1],
  "3": [1, 1, 1, 1, 0, 0, 1],
  "4": [0, 1, 1, 0, 0, 1, 1],
  "5": [1, 0, 1, 1, 0, 1, 1],
  "6": [1, 0, 1, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 0, 0],
  "8": [1, 1, 1, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1],
  A: [1, 1, 1, 0, 1, 1, 1],
  B: [0, 0, 1, 1, 1, 1, 1],
  C: [1, 0, 0, 1, 1, 1, 0],
  D: [0, 1, 1, 1, 1, 0, 1],
  E: [1, 0, 0, 1, 1, 1, 1],
  F: [1, 0, 0, 0, 1, 1, 1],
  G: [1, 0, 1, 1, 1, 1, 0],
  H: [0, 1, 1, 0, 1, 1, 1],
  I: [0, 0, 0, 0, 1, 1, 0],
  J: [0, 1, 1, 1, 0, 0, 0],
  K: [0, 1, 1, 0, 1, 1, 1],
  L: [0, 0, 0, 1, 1, 1, 0],
  M: [1, 1, 1, 0, 1, 1, 0],
  N: [0, 0, 1, 0, 1, 0, 1],
  O: [1, 1, 1, 1, 1, 1, 0],
  P: [1, 1, 0, 0, 1, 1, 1],
  Q: [1, 1, 1, 0, 0, 1, 1],
  R: [0, 0, 0, 0, 1, 0, 1],
  S: [1, 0, 1, 1, 0, 1, 1],
  T: [0, 0, 0, 1, 1, 1, 1],
  U: [0, 1, 1, 1, 1, 1, 0],
  V: [0, 1, 1, 1, 1, 1, 0],
  W: [0, 1, 1, 1, 1, 1, 0],
  X: [0, 1, 1, 0, 1, 1, 1],
  Y: [0, 1, 1, 1, 0, 1, 1],
  Z: [1, 1, 0, 1, 1, 0, 1],
  " ": [0, 0, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 0, 0, 0, 1],
  "?": [1, 1, 0, 0, 1, 0, 1],
};

function getSegments(value: number): number[] {
  const ch = String.fromCharCode(value).toUpperCase();
  if (CHAR_SEGMENTS[ch]) return CHAR_SEGMENTS[ch];
  return [
    (value >> 0) & 1,
    (value >> 1) & 1,
    (value >> 2) & 1,
    (value >> 3) & 1,
    (value >> 4) & 1,
    (value >> 5) & 1,
    (value >> 6) & 1,
  ];
}

interface SevenSegmentDisplayProps {
  value: number;
  label?: string;
  color?: "blue" | "red" | "green";
}

const COLOR_MAP = {
  blue: {
    on: "hsl(210, 60%, 55%)",
    off: "hsl(222, 15%, 18%)",
  },
  red: {
    on: "hsl(0, 65%, 55%)",
    off: "hsl(222, 15%, 18%)",
  },
  green: {
    on: "hsl(160, 45%, 45%)",
    off: "hsl(222, 15%, 18%)",
  },
};

export default function SevenSegmentDisplay({
  value,
  label,
  color = "blue",
}: SevenSegmentDisplayProps) {
  const segments = getSegments(value);
  const c = COLOR_MAP[color];

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-bold text-foreground">{label}</span>
      )}
      <div className="rounded-lg border border-border bg-card flex flex-col items-center p-3">
        <svg
          width={70}
          height={100}
          viewBox="0 0 80 120"
          aria-label={`Display: ${
            value >= 32 && value <= 126
              ? String.fromCharCode(value)
              : `0x${value.toString(16).toUpperCase().padStart(2, "0")}`
          }`}
        >
          <rect x="0" y="0" width="80" height="120" rx="4" fill="hsl(222, 25%, 11%)" />

          {/* Segment A (top) */}
          <polygon
            points="18,8 62,8 58,16 22,16"
            fill={segments[0] ? c.on : c.off}
          />
          {/* Segment B (top-right) */}
          <polygon
            points="64,10 64,54 56,50 56,18"
            fill={segments[1] ? c.on : c.off}
          />
          {/* Segment C (bottom-right) */}
          <polygon
            points="64,66 64,110 56,102 56,70"
            fill={segments[2] ? c.on : c.off}
          />
          {/* Segment D (bottom) */}
          <polygon
            points="18,112 62,112 58,104 22,104"
            fill={segments[3] ? c.on : c.off}
          />
          {/* Segment E (bottom-left) */}
          <polygon
            points="16,66 16,110 24,102 24,70"
            fill={segments[4] ? c.on : c.off}
          />
          {/* Segment F (top-left) */}
          <polygon
            points="16,10 16,54 24,50 24,18"
            fill={segments[5] ? c.on : c.off}
          />
          {/* Segment G (middle) */}
          <polygon
            points="20,57 24,53 56,53 60,57 56,61 24,61"
            fill={segments[6] ? c.on : c.off}
          />
        </svg>

        <div className="flex flex-col items-center mt-1 gap-0.5">
          <span className="text-sm font-mono font-bold text-foreground">
            {value >= 32 && value <= 126
              ? `'${String.fromCharCode(value)}'`
              : "---"}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            0x{value.toString(16).toUpperCase().padStart(2, "0")} |{" "}
            {value.toString(2).padStart(8, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

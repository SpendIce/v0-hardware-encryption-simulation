"use client";

/**
 * Seven Segment Display
 *
 * Virtual 7-segment display component that renders an 8-bit value.
 * Displays the ASCII character representation and binary/hex values.
 * Segment mapping follows standard a-g segments.
 *
 *  aaaa
 * f    b
 * f    b
 *  gggg
 * e    c
 * e    c
 *  dddd
 */

// Map ASCII characters to segments [a,b,c,d,e,f,g]
// 1 = segment ON, 0 = segment OFF
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
  K: [0, 1, 1, 0, 1, 1, 1], // approximation
  L: [0, 0, 0, 1, 1, 1, 0],
  M: [1, 1, 1, 0, 1, 1, 0], // approximation
  N: [0, 0, 1, 0, 1, 0, 1],
  O: [1, 1, 1, 1, 1, 1, 0],
  P: [1, 1, 0, 0, 1, 1, 1],
  Q: [1, 1, 1, 0, 0, 1, 1],
  R: [0, 0, 0, 0, 1, 0, 1],
  S: [1, 0, 1, 1, 0, 1, 1],
  T: [0, 0, 0, 1, 1, 1, 1],
  U: [0, 1, 1, 1, 1, 1, 0],
  V: [0, 1, 1, 1, 1, 1, 0], // same as U
  W: [0, 1, 1, 1, 1, 1, 0], // approximation
  X: [0, 1, 1, 0, 1, 1, 1], // same as H
  Y: [0, 1, 1, 1, 0, 1, 1],
  Z: [1, 1, 0, 1, 1, 0, 1], // same as 2
  " ": [0, 0, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 0, 0, 0, 1],
  "?": [1, 1, 0, 0, 1, 0, 1],
};

function getSegments(value: number): number[] {
  // If valid printable ASCII, look up segments
  const ch = String.fromCharCode(value).toUpperCase();
  if (CHAR_SEGMENTS[ch]) return CHAR_SEGMENTS[ch];
  // If not found, show all segments as "random" pattern from the value
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
  value: number; // 0-255 (8-bit)
  label?: string;
  color?: "green" | "cyan" | "amber" | "red";
  size?: "sm" | "md";
}

const COLOR_MAP = {
  green: {
    on: "hsl(160, 100%, 50%)",
    glow: "hsl(160, 100%, 50%)",
    off: "hsl(220, 30%, 14%)",
    text: "text-neon-green",
    border: "border-neon-green/30",
    glowClass: "glow-green",
  },
  cyan: {
    on: "hsl(180, 100%, 50%)",
    glow: "hsl(180, 100%, 50%)",
    off: "hsl(220, 30%, 14%)",
    text: "text-neon-cyan",
    border: "border-neon-cyan/30",
    glowClass: "glow-cyan",
  },
  amber: {
    on: "hsl(45, 100%, 55%)",
    glow: "hsl(45, 100%, 55%)",
    off: "hsl(220, 30%, 14%)",
    text: "text-neon-amber",
    border: "border-neon-amber/30",
    glowClass: "glow-amber",
  },
  red: {
    on: "hsl(0, 80%, 55%)",
    glow: "hsl(0, 80%, 55%)",
    off: "hsl(220, 30%, 14%)",
    text: "text-neon-red",
    border: "border-neon-red/30",
    glowClass: "glow-red",
  },
};

export default function SevenSegmentDisplay({
  value,
  label,
  color = "green",
  size = "md",
}: SevenSegmentDisplayProps) {
  const segments = getSegments(value);
  const c = COLOR_MAP[color];
  const w = size === "sm" ? 60 : 80;
  const h = size === "sm" ? 90 : 120;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className={`text-xs font-bold ${c.text}`}>{label}</span>
      )}
      <div
        className={`chip-card ${c.border} ${c.glowClass} flex flex-col items-center p-3`}
      >
        <svg
          width={w}
          height={h}
          viewBox="0 0 80 120"
          className="drop-shadow-lg"
          aria-label={`Display showing ${String.fromCharCode(value) || value}`}
        >
          {/* Background */}
          <rect x="0" y="0" width="80" height="120" rx="4" fill="hsl(220, 40%, 8%)" />

          {/* Segment A (top horizontal) */}
          <polygon
            points="18,8 62,8 58,16 22,16"
            fill={segments[0] ? c.on : c.off}
            style={segments[0] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment B (top-right vertical) */}
          <polygon
            points="64,10 64,54 56,50 56,18"
            fill={segments[1] ? c.on : c.off}
            style={segments[1] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment C (bottom-right vertical) */}
          <polygon
            points="64,66 64,110 56,102 56,70"
            fill={segments[2] ? c.on : c.off}
            style={segments[2] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment D (bottom horizontal) */}
          <polygon
            points="18,112 62,112 58,104 22,104"
            fill={segments[3] ? c.on : c.off}
            style={segments[3] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment E (bottom-left vertical) */}
          <polygon
            points="16,66 16,110 24,102 24,70"
            fill={segments[4] ? c.on : c.off}
            style={segments[4] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment F (top-left vertical) */}
          <polygon
            points="16,10 16,54 24,50 24,18"
            fill={segments[5] ? c.on : c.off}
            style={segments[5] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
          {/* Segment G (middle horizontal) */}
          <polygon
            points="20,57 24,53 56,53 60,57 56,61 24,61"
            fill={segments[6] ? c.on : c.off}
            style={segments[6] ? { filter: `drop-shadow(0 0 4px ${c.glow})` } : {}}
          />
        </svg>

        {/* Value display */}
        <div className="flex flex-col items-center mt-2 gap-0.5">
          <span className={`text-xs font-mono ${c.text}`}>
            {value >= 32 && value <= 126
              ? `'${String.fromCharCode(value)}'`
              : "N/A"}
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

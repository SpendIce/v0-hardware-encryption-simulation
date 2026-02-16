"use client";

/**
 * Seven-Segment Display -- Direct bit mapping, no converter.
 *
 * Each bit of the input byte directly controls a segment:
 *   bit 7 = segment a (top)
 *   bit 6 = segment b (top-right)
 *   bit 5 = segment c (bottom-right)
 *   bit 4 = segment d (bottom)
 *   bit 3 = segment e (bottom-left)
 *   bit 2 = segment f (top-left)
 *   bit 1 = segment g (middle)
 *   bit 0 = DP (decimal point)
 *
 * Segment layout:
 *   aaaa
 *  f    b
 *   gggg
 *  e    c
 *   dddd   .DP
 */

interface SevenSegmentDisplayProps {
  value: number;
  label?: string;
  color?: "blue" | "red" | "green";
  /** How many bits have been received so far (0-8). Dims unreceived segments. */
  bitsReceived?: number;
}

const COLOR_MAP = {
  blue: {
    on: "hsl(210, 65%, 58%)",
    off: "hsl(220, 12%, 16%)",
  },
  red: {
    on: "hsl(0, 60%, 55%)",
    off: "hsl(220, 12%, 16%)",
  },
  green: {
    on: "hsl(150, 50%, 48%)",
    off: "hsl(220, 12%, 16%)",
  },
};

/**
 * Extract segment states directly from the byte value.
 * Returns [a, b, c, d, e, f, g, dp]
 */
function getSegments(value: number): number[] {
  return [
    (value >> 7) & 1, // a
    (value >> 6) & 1, // b
    (value >> 5) & 1, // c
    (value >> 4) & 1, // d
    (value >> 3) & 1, // e
    (value >> 2) & 1, // f
    (value >> 1) & 1, // g
    (value >> 0) & 1, // DP
  ];
}

/** Segment bit index mapping (which bit position controls which segment) */
const SEGMENT_BIT_MAP = [7, 6, 5, 4, 3, 2, 1, 0]; // a=bit7, b=bit6 ... dp=bit0

export default function SevenSegmentDisplay({
  value,
  label,
  color = "blue",
  bitsReceived = 8,
}: SevenSegmentDisplayProps) {
  const segments = getSegments(value);
  const c = COLOR_MAP[color];

  /** Check if a segment's controlling bit has been received */
  const isReceived = (segIndex: number) => {
    const bitPos = SEGMENT_BIT_MAP[segIndex];
    // Bits are sent MSB first: bit 7 first (pulse 0), bit 0 last (pulse 7)
    const pulseNeeded = 7 - bitPos; // pulse index that sets this bit
    return pulseNeeded < bitsReceived;
  };

  const segFill = (segIndex: number) => {
    if (!isReceived(segIndex)) return "hsl(220, 10%, 12%)"; // not yet received
    return segments[segIndex] ? c.on : c.off;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-sm font-bold text-foreground">{label}</span>
      )}
      <div className="rounded-lg border border-border bg-card flex flex-col items-center p-4">
        <svg
          width={90}
          height={130}
          viewBox="0 0 80 120"
          aria-label={`Display: 0x${value.toString(16).toUpperCase().padStart(2, "0")}`}
        >
          <rect x="0" y="0" width="80" height="120" rx="4" fill="hsl(220, 18%, 9%)" />

          {/* Segment A (top) */}
          <polygon
            points="18,8 62,8 58,16 22,16"
            fill={segFill(0)}
          />
          {/* Segment B (top-right) */}
          <polygon
            points="64,10 64,54 56,50 56,18"
            fill={segFill(1)}
          />
          {/* Segment C (bottom-right) */}
          <polygon
            points="64,66 64,110 56,102 56,70"
            fill={segFill(2)}
          />
          {/* Segment D (bottom) */}
          <polygon
            points="18,112 62,112 58,104 22,104"
            fill={segFill(3)}
          />
          {/* Segment E (bottom-left) */}
          <polygon
            points="16,66 16,110 24,102 24,70"
            fill={segFill(4)}
          />
          {/* Segment F (top-left) */}
          <polygon
            points="16,10 16,54 24,50 24,18"
            fill={segFill(5)}
          />
          {/* Segment G (middle) */}
          <polygon
            points="20,57 24,53 56,53 60,57 56,61 24,61"
            fill={segFill(6)}
          />
          {/* DP (decimal point) */}
          <circle
            cx="72"
            cy="110"
            r="4"
            fill={segFill(7)}
          />
        </svg>

        <span className="text-sm text-muted-foreground font-mono mt-2">
          {value.toString(2).padStart(8, "0")}
        </span>
      </div>
    </div>
  );
}

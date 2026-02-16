"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * LFSR (Linear Feedback Shift Register) Hook
 *
 * Implements the polynomial: x^31 + x^6 + x^5 + x^1 + 1
 * Tap positions (0-indexed): bits 1, 5, 6, 31
 *
 * Data enters at bit 0 and exits at bit 31.
 * On each clock cycle:
 *   1. The output bit is bit 31 (shifted out to the left)
 *   2. Read taps at positions 1, 5, 6, and 31
 *   3. XOR them together to get the feedback bit
 *   4. Shift the entire register LEFT by 1
 *   5. Place the feedback bit at position 0
 */

export const LFSR_TAPS = [1, 5, 6, 31] as const;
export const LFSR_SIZE = 32;

/** Convert a number to a 32-element bit array (index 0 = LSB) */
export function toBitArray(value: number): number[] {
  const bits: number[] = [];
  for (let i = 0; i < LFSR_SIZE; i++) {
    bits.push((value >>> i) & 1);
  }
  return bits;
}

/**
 * Perform one LFSR step:
 *   - Output bit = bit 31 (MSB, exits left)
 *   - Feedback = XOR of taps
 *   - Shift left by 1
 *   - Feedback enters at bit 0
 */
export function lfsrStep(state: number): {
  newState: number;
  outputBit: number;
  feedbackBit: number;
} {
  // Read tap bits and XOR them
  const tapValues = LFSR_TAPS.map((pos) => (state >>> pos) & 1);
  const feedbackBit = tapValues.reduce((a, b) => a ^ b, 0);

  // Output bit is bit 31 (the one shifted out to the left)
  const outputBit = (state >>> 31) & 1;

  // Shift left by 1
  let newState = state << 1;

  // Place feedback at position 0
  if (feedbackBit) {
    newState |= 1;
  } else {
    newState &= ~1;
  }

  // Force unsigned interpretation
  newState = newState >>> 0;

  return { newState, outputBit, feedbackBit };
}

/** Default seed (nonzero to avoid stuck state) */
const DEFAULT_SEED = 0b10110011100011110000111110000011;

export function useLfsr(initialSeed?: number) {
  const seed = initialSeed ?? DEFAULT_SEED;
  const [state, setState] = useState<number>(seed >>> 0);
  const [stepCount, setStepCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<number | null>(null);
  const [lastOutput, setLastOutput] = useState<number | null>(null);
  const [outputStream, setOutputStream] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = useCallback(() => {
    setState((prev) => {
      const { newState, outputBit, feedbackBit } = lfsrStep(prev);
      setLastFeedback(feedbackBit);
      setLastOutput(outputBit);
      setStepCount((c) => c + 1);
      setOutputStream((s) => {
        const next = [...s, outputBit];
        if (next.length > 64) next.shift();
        return next;
      });
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setState(seed >>> 0);
    setStepCount(0);
    setLastFeedback(null);
    setLastOutput(null);
    setOutputStream([]);
    setIsRunning(false);
  }, [seed]);

  const toggleAutoRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(step, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speed, step]);

  return {
    state,
    bits: toBitArray(state),
    stepCount,
    lastFeedback,
    lastOutput,
    outputStream,
    isRunning,
    speed,
    step,
    reset,
    toggleAutoRun,
    setSpeed,
    setState,
    setStepCount,
  };
}

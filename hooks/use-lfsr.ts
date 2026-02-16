"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * LFSR (Linear Feedback Shift Register) Hook
 *
 * Implements the polynomial: x^31 + x^6 + x^5 + x^1 + 1
 * Tap positions (0-indexed): bits 31, 6, 5, 1
 * The XOR of taps feeds back into position 0 after shifting right.
 *
 * The register is 32 bits wide. On each clock cycle:
 *   1. Read taps at positions 1, 5, 6, and 31
 *   2. XOR them together to get the feedback bit
 *   3. Shift the entire register right by 1 (output = bit 0)
 *   4. Place the feedback bit at position 31
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

/** Perform one LFSR step and return { newState, outputBit, feedbackBit } */
export function lfsrStep(state: number): {
  newState: number;
  outputBit: number;
  feedbackBit: number;
} {
  // Read tap bits and XOR them
  const tapValues = LFSR_TAPS.map((pos) => (state >>> pos) & 1);
  const feedbackBit = tapValues.reduce((a, b) => a ^ b, 0);

  // Output bit is bit 0 (the one shifted out)
  const outputBit = state & 1;

  // Shift right by 1
  let newState = state >>> 1;

  // Place feedback at position 31
  if (feedbackBit) {
    newState |= 1 << 31;
  } else {
    newState &= ~(1 << 31);
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
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500); // ms between steps
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = useCallback(() => {
    setState((prev) => {
      const { newState, outputBit, feedbackBit } = lfsrStep(prev);
      setLastFeedback(feedbackBit);
      setLastOutput(outputBit);
      setStepCount((c) => c + 1);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setState(seed >>> 0);
    setStepCount(0);
    setLastFeedback(null);
    setLastOutput(null);
    setIsRunning(false);
  }, [seed]);

  const toggleAutoRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Auto-run interval
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

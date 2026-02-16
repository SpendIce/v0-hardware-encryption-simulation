"use client";

import { useCallback, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight, Zap } from "lucide-react";
import { useLfsr, LFSR_TAPS, LFSR_SIZE, toBitArray } from "@/hooks/use-lfsr";

/**
 * LFSR Visualizer
 *
 * Shows the 32-bit register as individual cells, highlights tap positions,
 * animates the shift operation, and displays the XOR feedback logic.
 */
export default function LfsrVisualizer() {
  const lfsr = useLfsr();
  const [animKey, setAnimKey] = useState(0);

  const handleStep = useCallback(() => {
    lfsr.step();
    setAnimKey((k) => k + 1);
  }, [lfsr]);

  const bits = lfsr.bits;
  const tapBitValues = LFSR_TAPS.map((pos) => bits[pos]);
  const xorResult = tapBitValues.reduce((a, b) => a ^ b, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="chip-card glow-green">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-5 w-5 text-neon-green" />
          <h2 className="text-lg font-bold text-neon-green text-glow-green">
            LFSR Engine - 32-bit Register
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {"Polinomio: x\u00B3\u00B9 + x\u2076 + x\u2075 + x\u00B9 + 1 | Taps en posiciones: 1, 5, 6, 31"}
        </p>
      </div>

      {/* Register visualization */}
      <div className="chip-card overflow-x-auto">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-muted-foreground mr-2">MSB</span>
          <div className="flex gap-0.5">
            {/* Display bits from MSB (31) to LSB (0) */}
            {Array.from({ length: LFSR_SIZE })
              .map((_, i) => LFSR_SIZE - 1 - i)
              .map((bitIndex) => {
                const isTap = LFSR_TAPS.includes(bitIndex as 1 | 5 | 6 | 31);
                const bitVal = bits[bitIndex];
                return (
                  <div key={bitIndex} className="flex flex-col items-center gap-1">
                    {/* Tap indicator */}
                    <div
                      className={`h-1.5 w-8 rounded-full transition-colors ${
                        isTap ? "bg-neon-amber" : "bg-transparent"
                      }`}
                    />
                    {/* Bit cell */}
                    <div
                      key={`${bitIndex}-${animKey}`}
                      className={`
                        flex h-8 w-8 items-center justify-center rounded text-xs font-bold 
                        transition-all duration-200 border
                        ${
                          isTap
                            ? bitVal
                              ? "border-neon-amber bg-neon-amber/20 text-neon-amber glow-amber"
                              : "border-neon-amber/50 bg-secondary text-neon-amber/60"
                            : bitVal
                            ? "border-neon-green bg-neon-green/20 text-neon-green glow-green"
                            : "border-border bg-secondary text-muted-foreground"
                        }
                        ${bitVal ? "bit-pulse" : ""}
                      `}
                    >
                      {bitVal}
                    </div>
                    {/* Position label */}
                    <span
                      className={`text-[10px] ${
                        isTap ? "text-neon-amber font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {bitIndex}
                    </span>
                  </div>
                );
              })}
          </div>
          <span className="text-xs text-muted-foreground ml-2">LSB</span>
        </div>
      </div>

      {/* XOR Feedback visualization */}
      <div className="chip-card glow-cyan">
        <h3 className="text-sm font-bold text-neon-cyan text-glow-cyan mb-3">
          XOR Feedback Logic
        </h3>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          {LFSR_TAPS.map((tap, i) => (
            <span key={tap} className="flex items-center gap-2">
              <span className="flex flex-col items-center">
                <span className="text-[10px] text-neon-amber">bit[{tap}]</span>
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center rounded border font-bold
                    ${
                      tapBitValues[i]
                        ? "border-neon-amber bg-neon-amber/20 text-neon-amber"
                        : "border-border bg-secondary text-muted-foreground"
                    }
                  `}
                >
                  {tapBitValues[i]}
                </span>
              </span>
              {i < LFSR_TAPS.length - 1 && (
                <span className="text-neon-cyan font-bold text-lg">{"^"}</span>
              )}
            </span>
          ))}
          <span className="text-neon-green font-bold text-lg mx-2">{"="}</span>
          <span className="flex flex-col items-center">
            <span className="text-[10px] text-neon-green">feedback</span>
            <span
              className={`
                flex h-8 w-8 items-center justify-center rounded border font-bold
                ${
                  xorResult
                    ? "border-neon-green bg-neon-green/20 text-neon-green glow-green"
                    : "border-border bg-secondary text-muted-foreground"
                }
              `}
            >
              {xorResult}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-neon-green mx-1" />
          <span className="text-xs text-neon-green">{"-> bit[31]"}</span>
        </div>
      </div>

      {/* Status panel */}
      <div className="flex flex-wrap gap-4">
        <div className="chip-card flex-1 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Ciclos de reloj</span>
          <p className="text-2xl font-bold text-neon-green text-glow-green">
            {lfsr.stepCount}
          </p>
        </div>
        <div className="chip-card flex-1 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Ultimo bit de salida</span>
          <p className="text-2xl font-bold text-neon-cyan text-glow-cyan">
            {lfsr.lastOutput !== null ? lfsr.lastOutput : "---"}
          </p>
        </div>
        <div className="chip-card flex-1 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Bit de retroalimentacion</span>
          <p className="text-2xl font-bold text-neon-amber text-glow-amber">
            {lfsr.lastFeedback !== null ? lfsr.lastFeedback : "---"}
          </p>
        </div>
        <div className="chip-card flex-1 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Hex del registro</span>
          <p className="text-lg font-bold text-neon-green text-glow-green break-all">
            0x{(lfsr.state >>> 0).toString(16).toUpperCase().padStart(8, "0")}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleStep}
          disabled={lfsr.isRunning}
          className="flex items-center gap-2 rounded-lg border border-neon-green bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-40 disabled:cursor-not-allowed glow-green"
        >
          <ChevronRight className="h-4 w-4" />
          Step
        </button>
        <button
          onClick={lfsr.toggleAutoRun}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${
            lfsr.isRunning
              ? "border-neon-red bg-neon-red/10 text-neon-red hover:bg-neon-red/20 glow-red"
              : "border-neon-cyan bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 glow-cyan"
          }`}
        >
          {lfsr.isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {lfsr.isRunning ? "Detener" : "Auto Run"}
        </button>
        <button
          onClick={lfsr.reset}
          className="flex items-center gap-2 rounded-lg border border-muted-foreground bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        {/* Speed slider */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Velocidad:</span>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={1050 - lfsr.speed}
            onChange={(e) => lfsr.setSpeed(1050 - Number(e.target.value))}
            className="w-24 accent-neon-green"
          />
          <span className="text-xs text-neon-green w-14 text-right">
            {lfsr.speed}ms
          </span>
        </div>
      </div>

      {/* Output bit stream (last 32 output bits) */}
      <OutputBitStream lfsr={lfsr} animKey={animKey} />
    </div>
  );
}

/** Shows the last N output bits as a running stream */
function OutputBitStream({
  lfsr,
  animKey,
}: {
  lfsr: ReturnType<typeof useLfsr>;
  animKey: number;
}) {
  // We track the output stream by re-running the LFSR from seed
  // But that's expensive. Instead let's track with a simple ref approach via state.
  // We'll use a simple accumulator that captures lastOutput each step.
  const [stream, setStream] = useState<number[]>([]);

  // Subscribe to step changes via animKey
  const prevAnimKey = useStreamTracker(animKey, lfsr.lastOutput, stream, setStream);

  return (
    <div className="chip-card">
      <h3 className="text-sm font-bold text-neon-cyan text-glow-cyan mb-2">
        Secuencia de salida (ultimos 64 bits)
      </h3>
      <div className="flex flex-wrap gap-0.5 font-mono text-xs">
        {stream.length === 0 ? (
          <span className="text-muted-foreground">
            Presiona Step o Auto Run para generar bits...
          </span>
        ) : (
          stream.map((bit, i) => (
            <span
              key={`${i}-${bit}`}
              className={`
                inline-flex h-5 w-5 items-center justify-center rounded-sm
                ${
                  bit
                    ? "bg-neon-green/20 text-neon-green"
                    : "bg-secondary text-muted-foreground"
                }
                ${i === stream.length - 1 ? "ring-1 ring-neon-green" : ""}
              `}
            >
              {bit}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/** Track output stream */
function useStreamTracker(
  animKey: number,
  lastOutput: number | null,
  stream: number[],
  setStream: React.Dispatch<React.SetStateAction<number[]>>
) {
  const [prevKey, setPrevKey] = useState(animKey);

  if (animKey !== prevKey) {
    setPrevKey(animKey);
    if (lastOutput !== null) {
      const newStream = [...stream, lastOutput];
      if (newStream.length > 64) newStream.shift();
      setStream(newStream);
    }
  }

  return prevKey;
}

"use client";

import { useCallback, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { useLfsr, LFSR_TAPS, LFSR_SIZE } from "@/hooks/use-lfsr";

/**
 * LFSR Visualizer -- minimal view
 *
 * 32-bit register shown as 4x 74HC164N (8 bits each), serial propagation.
 * Entrada en bit 0 (izquierda), salida en bit 31 (derecha).
 * Feedback XOR -> bit 0.
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

  /** Group bits into 4 ICs of 8 bits each */
  const ics = [
    { label: "IC1 (bits 0-7)", start: 0 },
    { label: "IC2 (bits 8-15)", start: 8 },
    { label: "IC3 (bits 16-23)", start: 16 },
    { label: "IC4 (bits 24-31)", start: 24 },
  ];

  return (
    <section className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          LFSR de 32 bits
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          {"4 \u00D7 74HC164N en serie | Polinomio: x\u00B3\u00B9 + x\u2076 + x\u2075 + x\u00B9 + 1 | Taps: 1, 5, 6, 31"}
        </p>
      </div>

      {/* Register: 4 ICs */}
      <div className="rounded-lg border border-border bg-card p-5 overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* Entrada label */}
          <span className="text-base font-bold text-foreground shrink-0">
            {"Entrada \u2192"}
          </span>

          <div className="flex gap-3">
            {ics.map((ic) => (
              <div key={ic.label} className="flex flex-col items-center gap-1.5">
                {/* IC label */}
                <span className="text-xs text-muted-foreground">{ic.label}</span>
                {/* 8 bit cells */}
                <div className="flex gap-px border border-border rounded p-1 bg-background">
                  {Array.from({ length: 8 }).map((_, j) => {
                    const bitIndex = ic.start + j;
                    const isTap = (LFSR_TAPS as readonly number[]).includes(bitIndex);
                    const bitVal = bits[bitIndex];
                    return (
                      <div key={bitIndex} className="flex flex-col items-center">
                        <div
                          key={`${bitIndex}-${animKey}`}
                          className={`
                            flex h-9 w-9 items-center justify-center text-base font-bold
                            border transition-colors
                            ${
                              isTap
                                ? bitVal
                                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                                  : "border-amber-500/40 bg-background text-amber-500/50"
                                : bitVal
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-border bg-background text-muted-foreground"
                            }
                            ${bitVal ? "bit-pulse" : ""}
                          `}
                        >
                          {bitVal}
                        </div>
                        <span
                          className={`text-[10px] mt-0.5 ${
                            isTap ? "text-amber-500 font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {bitIndex}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Salida label */}
          <span className="text-base font-bold text-foreground shrink-0">
            {"\u2192 Salida"}
          </span>
        </div>
      </div>

      {/* Feedback XOR */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-bold text-foreground mb-3">
          Retroalimentacion XOR {"\u2192"} bit[0]
        </h3>
        <div className="flex flex-wrap items-center gap-3 font-mono text-base">
          {LFSR_TAPS.map((tap, i) => (
            <span key={tap} className="flex items-center gap-3">
              <span className="flex flex-col items-center">
                <span className="text-xs text-amber-500">bit[{tap}]</span>
                <span
                  className={`
                    flex h-9 w-9 items-center justify-center rounded border font-bold
                    ${
                      tapBitValues[i]
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-border bg-background text-muted-foreground"
                    }
                  `}
                >
                  {tapBitValues[i]}
                </span>
              </span>
              {i < LFSR_TAPS.length - 1 && (
                <span className="text-primary font-bold text-lg">{"^"}</span>
              )}
            </span>
          ))}
          <span className="text-foreground font-bold text-lg mx-2">{"="}</span>
          <span className="flex flex-col items-center">
            <span className="text-xs text-primary">feedback</span>
            <span
              className={`
                flex h-9 w-9 items-center justify-center rounded border font-bold
                ${
                  xorResult
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }
              `}
            >
              {xorResult}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted-foreground mx-1" />
          <span className="text-base text-primary font-bold">bit[0]</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleStep}
          disabled={lfsr.isRunning}
          className="flex items-center gap-2 rounded-md border border-primary bg-primary/15 px-5 py-2.5 text-base font-bold text-primary transition-colors hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
          Paso
        </button>
        <button
          onClick={lfsr.toggleAutoRun}
          className={`flex items-center gap-2 rounded-md border px-5 py-2.5 text-base font-bold transition-colors ${
            lfsr.isRunning
              ? "border-destructive bg-destructive/15 text-destructive hover:bg-destructive/25"
              : "border-primary bg-primary/15 text-primary hover:bg-primary/25"
          }`}
        >
          {lfsr.isRunning ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {lfsr.isRunning ? "Detener" : "Auto"}
        </button>
        <button
          onClick={lfsr.reset}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-base font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Velocidad:</span>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={1050 - lfsr.speed}
            onChange={(e) => lfsr.setSpeed(1050 - Number(e.target.value))}
            className="w-28 accent-primary"
            aria-label="Velocidad de simulacion"
          />
          <span className="text-sm text-muted-foreground w-16 text-right">
            {lfsr.speed}ms
          </span>
        </div>
      </div>

      {/* Compact info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>Ciclos: <strong className="text-foreground">{lfsr.stepCount}</strong></span>
        <span>Bit salida: <strong className="text-foreground">{lfsr.lastOutput ?? "-"}</strong></span>
        <span>Feedback: <strong className="text-foreground">{lfsr.lastFeedback ?? "-"}</strong></span>
      </div>
    </section>
  );
}

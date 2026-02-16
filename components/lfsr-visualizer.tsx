"use client";

import { useCallback, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { useLfsr, LFSR_TAPS, LFSR_SIZE } from "@/hooks/use-lfsr";

/**
 * LFSR Visualizer
 *
 * Shows the 32-bit register as individual cells.
 * Data enters at bit 0 (right), exits at bit 31 (left).
 * Feedback from XOR of taps goes back to bit 0.
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
    <section className="flex flex-col gap-5">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          LFSR - Registro de Desplazamiento con Retroalimentacion Lineal
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {"Polinomio: x\u00B3\u00B9 + x\u2076 + x\u2075 + x\u00B9 + 1  |  Taps: 1, 5, 6, 31  |  Entrada: bit 0  |  Salida: bit 31"}
        </p>
      </div>

      {/* Register visualization */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground font-bold mr-1 w-20 text-right shrink-0">
            {"Entrada ->"}
          </span>
          <div className="flex gap-px">
            {/* Display bits from LSB (0) to MSB (31) -- left to right = bit 0 up to bit 31 */}
            {Array.from({ length: LFSR_SIZE })
              .map((_, i) => i)
              .map((bitIndex) => {
                const isTap = (LFSR_TAPS as readonly number[]).includes(bitIndex);
                const bitVal = bits[bitIndex];
                return (
                  <div key={bitIndex} className="flex flex-col items-center">
                    {/* Tap marker */}
                    <div
                      className={`h-1 w-7 rounded-full mb-0.5 ${
                        isTap ? "bg-orange-400" : "bg-transparent"
                      }`}
                    />
                    {/* Bit cell */}
                    <div
                      key={`${bitIndex}-${animKey}`}
                      className={`
                        flex h-7 w-7 items-center justify-center text-xs font-bold 
                        border transition-colors
                        ${
                          isTap
                            ? bitVal
                              ? "border-orange-400 bg-orange-400/15 text-orange-300"
                              : "border-orange-400/40 bg-background text-orange-400/60"
                            : bitVal
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-background text-muted-foreground"
                        }
                        ${bitVal ? "bit-pulse" : ""}
                      `}
                    >
                      {bitVal}
                    </div>
                    {/* Position label */}
                    <span
                      className={`text-[9px] mt-0.5 ${
                        isTap ? "text-orange-500 font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {bitIndex}
                    </span>
                  </div>
                );
              })}
          </div>
          <span className="text-xs text-muted-foreground font-bold ml-1 w-16 shrink-0">
            {"-> Salida"}
          </span>
        </div>
      </div>

      {/* Feedback XOR */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">
          Retroalimentacion XOR {"-> bit[0]"}
        </h3>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          {LFSR_TAPS.map((tap, i) => (
            <span key={tap} className="flex items-center gap-2">
              <span className="flex flex-col items-center">
                <span className="text-[10px] text-orange-500">bit[{tap}]</span>
                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded border font-bold text-xs
                    ${
                      tapBitValues[i]
                        ? "border-orange-400 bg-orange-400/15 text-orange-300"
                        : "border-border bg-background text-muted-foreground"
                    }
                  `}
                >
                  {tapBitValues[i]}
                </span>
              </span>
              {i < LFSR_TAPS.length - 1 && (
                <span className="text-primary font-bold">{"^"}</span>
              )}
            </span>
          ))}
          <span className="text-foreground font-bold mx-1">{"="}</span>
          <span className="flex flex-col items-center">
            <span className="text-[10px] text-primary">feedback</span>
            <span
              className={`
                flex h-7 w-7 items-center justify-center rounded border font-bold text-xs
                ${
                  xorResult
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }
              `}
            >
              {xorResult}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
          <span className="text-xs text-primary font-bold">{"bit[0]"}</span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-2 flex-1 min-w-[120px]">
          <span className="text-[10px] text-muted-foreground block">Ciclos</span>
          <p className="text-xl font-bold text-foreground">{lfsr.stepCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 flex-1 min-w-[120px]">
          <span className="text-[10px] text-muted-foreground block">Bit salida (bit 31)</span>
          <p className="text-xl font-bold text-foreground">
            {lfsr.lastOutput !== null ? lfsr.lastOutput : "---"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 flex-1 min-w-[120px]">
          <span className="text-[10px] text-muted-foreground block">Feedback (bit 0)</span>
          <p className="text-xl font-bold text-foreground">
            {lfsr.lastFeedback !== null ? lfsr.lastFeedback : "---"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 flex-1 min-w-[120px]">
          <span className="text-[10px] text-muted-foreground block">Registro (hex)</span>
          <p className="text-base font-bold text-foreground">
            0x{(lfsr.state >>> 0).toString(16).toUpperCase().padStart(8, "0")}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleStep}
          disabled={lfsr.isRunning}
          className="flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
          Step
        </button>
        <button
          onClick={lfsr.toggleAutoRun}
          className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition-colors ${
            lfsr.isRunning
              ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {lfsr.isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {lfsr.isRunning ? "Detener" : "Auto"}
        </button>
        <button
          onClick={lfsr.reset}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
            className="w-24 accent-primary"
            aria-label="Velocidad de simulacion"
          />
          <span className="text-xs text-muted-foreground w-14 text-right">
            {lfsr.speed}ms
          </span>
        </div>
      </div>

      {/* Output bit stream */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">
          Secuencia de salida (ultimos 64 bits)
        </h3>
        <div className="flex flex-wrap gap-px font-mono text-xs">
          {lfsr.outputStream.length === 0 ? (
            <span className="text-muted-foreground">
              Presiona Step o Auto para generar bits...
            </span>
          ) : (
            lfsr.outputStream.map((bit, i) => (
              <span
                key={`${i}-${bit}`}
                className={`
                  inline-flex h-5 w-5 items-center justify-center rounded-sm text-[10px]
                  ${
                    bit
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-secondary text-muted-foreground"
                  }
                  ${i === lfsr.outputStream.length - 1 ? "ring-1 ring-primary" : ""}
                `}
              >
                {bit}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

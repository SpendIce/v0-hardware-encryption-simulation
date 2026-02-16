"use client";

import { useCallback, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight, Settings2 } from "lucide-react";
import { useLfsr, LFSR_TAPS, LFSR_SIZE } from "@/hooks/use-lfsr";

/**
 * Minimal LFSR 32-bit visualizer.
 *
 * - 4 x 74HC164N (8 bits each) in a single horizontal row that fits the screen.
 * - XOR feedback -> bit[0].
 * - "Semilla" button opens a small inline panel to set the 32-bit initial value.
 */
export default function LfsrVisualizer() {
  const lfsr = useLfsr();
  const [animKey, setAnimKey] = useState(0);
  const [showSeed, setShowSeed] = useState(false);
  const [seedHex, setSeedHex] = useState("00000000");

  const handleStep = useCallback(() => {
    lfsr.step();
    setAnimKey((k) => k + 1);
  }, [lfsr]);

  const applySeed = useCallback(() => {
    const parsed = parseInt(seedHex, 16);
    if (!isNaN(parsed)) {
      lfsr.setSeed(parsed);
      setShowSeed(false);
    }
  }, [seedHex, lfsr]);

  const bits = lfsr.bits;
  const tapBitValues = LFSR_TAPS.map((pos) => bits[pos]);
  const xorResult = tapBitValues.reduce((a, b) => a ^ b, 0);

  const ics = [
    { label: "IC1", start: 0 },
    { label: "IC2", start: 8 },
    { label: "IC3", start: 16 },
    { label: "IC4", start: 24 },
  ];

  return (
    <section className="flex flex-col gap-5">
      {/* Register */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">
            LFSR 32 bits
          </h2>
          <span className="text-sm text-muted-foreground">
            {"x\u00B3\u00B9 + x\u2076 + x\u2075 + x\u00B9 + 1"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-foreground shrink-0 mr-1">
            {"IN \u2192"}
          </span>

          {ics.map((ic, icIdx) => (
            <div key={ic.label} className="flex items-center">
              {icIdx > 0 && (
                <div className="w-px h-7 bg-border mx-1" />
              )}
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-muted-foreground mb-0.5">{ic.label}</span>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 8 }).map((_, j) => {
                    const bitIndex = ic.start + j;
                    const isTap = (LFSR_TAPS as readonly number[]).includes(bitIndex);
                    const bitVal = bits[bitIndex];
                    return (
                      <div
                        key={`${bitIndex}-${animKey}`}
                        className={`
                          flex h-7 w-7 items-center justify-center text-sm font-bold
                          border transition-colors
                          ${
                            isTap
                              ? bitVal
                                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                                : "border-amber-500/30 bg-card text-amber-500/40"
                              : bitVal
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-card text-muted-foreground/50"
                          }
                          ${bitVal ? "bit-pulse" : ""}
                        `}
                        title={`bit[${bitIndex}]${isTap ? " (tap)" : ""}`}
                      >
                        {bitVal}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <span className="text-sm font-bold text-foreground shrink-0 ml-1">
            {"\u2192 OUT"}
          </span>
        </div>

        {/* Tap indices underneath */}
        <p className="text-sm text-muted-foreground mt-3">
          Taps (resaltados): {LFSR_TAPS.join(", ")}
        </p>
      </div>

      {/* XOR Feedback -- compact */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">
          XOR {"\u2192"} bit[0]
        </h3>
        <div className="flex items-center gap-2 font-mono text-sm flex-wrap">
          {LFSR_TAPS.map((tap, i) => (
            <span key={tap} className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="text-[11px] text-amber-400">[{tap}]</span>
                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded border font-bold text-sm
                    ${
                      tapBitValues[i]
                        ? "border-amber-400 bg-amber-400/20 text-amber-300"
                        : "border-border bg-card text-muted-foreground/50"
                    }
                  `}
                >
                  {tapBitValues[i]}
                </span>
              </span>
              {i < LFSR_TAPS.length - 1 && (
                <span className="text-primary font-bold">^</span>
              )}
            </span>
          ))}
          <span className="text-foreground font-bold mx-1">=</span>
          <span
            className={`
              flex h-7 w-7 items-center justify-center rounded border font-bold text-sm
              ${
                xorResult
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground/50"
              }
            `}
          >
            {xorResult}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleStep}
          disabled={lfsr.isRunning}
          className="flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
          Paso
        </button>
        <button
          onClick={lfsr.toggleAutoRun}
          className={`flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-bold transition-colors ${
            lfsr.isRunning
              ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {lfsr.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {lfsr.isRunning ? "Detener" : "Auto"}
        </button>
        <button
          onClick={lfsr.reset}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          onClick={() => setShowSeed(!showSeed)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
          Semilla
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Vel:</span>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={1050 - lfsr.speed}
            onChange={(e) => lfsr.setSpeed(1050 - Number(e.target.value))}
            className="w-20 accent-primary"
            aria-label="Velocidad"
          />
          <span className="text-xs text-muted-foreground w-12 text-right">
            {lfsr.speed}ms
          </span>
        </div>
      </div>

      {/* Seed panel */}
      {showSeed && (
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-foreground">
            Establecer semilla (hex, 32 bits)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">0x</span>
            <input
              type="text"
              value={seedHex}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 8);
                setSeedHex(v);
              }}
              maxLength={8}
              className="rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="FFFFFFFF"
            />
            <button
              onClick={applySeed}
              className="rounded-md border border-primary bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary/20"
            >
              Aplicar
            </button>
            <button
              onClick={() => setShowSeed(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ingrese un valor hexadecimal de hasta 8 caracteres. Ej: B3C3E1F3
          </p>
        </div>
      )}

      {/* Compact status line */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Ciclos: <strong className="text-foreground">{lfsr.stepCount}</strong></span>
        <span>Salida: <strong className="text-foreground">{lfsr.lastOutput ?? "-"}</strong></span>
        <span>Feedback: <strong className="text-foreground">{lfsr.lastFeedback ?? "-"}</strong></span>
      </div>
    </section>
  );
}

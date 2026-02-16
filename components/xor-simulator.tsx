"use client";

import { useState } from "react";
import { ToggleLeft, ToggleRight, Lightbulb } from "lucide-react";

/**
 * XOR Simulator
 *
 * Interactive demonstration of the XOR (exclusive OR) gate.
 * Two toggle switches for inputs A and B, a visual XOR gate,
 * an LED output, and a dynamic truth table.
 */

const TRUTH_TABLE: [number, number, number][] = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
];

export default function XorSimulator() {
  const [bitA, setBitA] = useState(0);
  const [bitB, setBitB] = useState(0);
  const result = bitA ^ bitB;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="chip-card glow-cyan">
        <h2 className="text-lg font-bold text-neon-cyan text-glow-cyan mb-1">
          Compuerta XOR - Suma Modulo 2
        </h2>
        <p className="text-sm text-muted-foreground">
          La base de la encriptacion por flujo: cada bit del mensaje se combina
          con un bit de la clave usando XOR.
        </p>
      </div>

      {/* Interactive gate area */}
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-center lg:gap-12">
        {/* Input switches */}
        <div className="flex gap-8">
          <BitSwitch label="Bit A" value={bitA} onChange={setBitA} color="green" />
          <BitSwitch label="Bit B" value={bitB} onChange={setBitB} color="amber" />
        </div>

        {/* XOR Gate visual */}
        <XorGate a={bitA} b={bitB} />

        {/* LED output */}
        <LedOutput value={result} />
      </div>

      {/* Equation display */}
      <div className="chip-card text-center">
        <p className="font-mono text-lg">
          <span className={bitA ? "text-neon-green" : "text-muted-foreground"}>
            {bitA}
          </span>
          <span className="text-neon-cyan mx-3">{"XOR"}</span>
          <span className={bitB ? "text-neon-amber" : "text-muted-foreground"}>
            {bitB}
          </span>
          <span className="text-foreground mx-3">{"="}</span>
          <span
            className={`font-bold text-xl ${
              result ? "text-neon-green text-glow-green" : "text-muted-foreground"
            }`}
          >
            {result}
          </span>
        </p>
      </div>

      {/* Truth Table */}
      <div className="chip-card glow-green">
        <h3 className="text-sm font-bold text-neon-green text-glow-green mb-3">
          Tabla de Verdad XOR
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-4 text-neon-green">A</th>
                <th className="py-2 px-4 text-neon-cyan">{"XOR"}</th>
                <th className="py-2 px-4 text-neon-amber">B</th>
                <th className="py-2 px-4 text-foreground">=</th>
                <th className="py-2 px-4 text-neon-green">Salida</th>
              </tr>
            </thead>
            <tbody>
              {TRUTH_TABLE.map(([a, b, out]) => {
                const isActive = a === bitA && b === bitB;
                return (
                  <tr
                    key={`${a}-${b}`}
                    className={`border-b border-border/50 transition-all duration-300 ${
                      isActive
                        ? "bg-neon-green/10 ring-1 ring-neon-green/30"
                        : ""
                    }`}
                  >
                    <td className={`py-2 px-4 ${isActive ? "text-neon-green font-bold" : "text-muted-foreground"}`}>
                      {a}
                    </td>
                    <td className={`py-2 px-4 ${isActive ? "text-neon-cyan font-bold" : "text-muted-foreground"}`}>
                      {"^"}
                    </td>
                    <td className={`py-2 px-4 ${isActive ? "text-neon-amber font-bold" : "text-muted-foreground"}`}>
                      {b}
                    </td>
                    <td className={`py-2 px-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      =
                    </td>
                    <td
                      className={`py-2 px-4 font-bold ${
                        isActive
                          ? out
                            ? "text-neon-green text-glow-green"
                            : "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {out}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="chip-card border-neon-cyan/30">
        <h3 className="text-sm font-bold text-neon-cyan mb-2">
          Por que XOR para encriptar?
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            {"1. Reversible: Si C = A XOR K, entonces A = C XOR K"}
          </li>
          <li>
            {"2. Balanceada: Cada salida (0 o 1) tiene igual probabilidad"}
          </li>
          <li>
            {"3. Eficiente: Implementable con una sola compuerta logica en hardware"}
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Toggle switch for a single bit */
function BitSwitch({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: "green" | "amber";
}) {
  const colorClasses = {
    green: {
      on: "bg-neon-green/20 border-neon-green text-neon-green glow-green",
      off: "bg-secondary border-border text-muted-foreground",
      label: "text-neon-green",
    },
    amber: {
      on: "bg-neon-amber/20 border-neon-amber text-neon-amber glow-amber",
      off: "bg-secondary border-border text-muted-foreground",
      label: "text-neon-amber",
    },
  };

  const c = colorClasses[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-xs font-bold ${c.label}`}>{label}</span>
      <button
        onClick={() => onChange(value ? 0 : 1)}
        className={`
          flex items-center gap-2 rounded-lg border px-4 py-3 
          transition-all duration-200 font-bold text-2xl
          ${value ? c.on : c.off}
        `}
        aria-label={`Toggle ${label}`}
      >
        {value ? (
          <ToggleRight className="h-6 w-6" />
        ) : (
          <ToggleLeft className="h-6 w-6" />
        )}
        {value}
      </button>
    </div>
  );
}

/** Visual XOR gate representation */
function XorGate({ a, b }: { a: number; b: number }) {
  const result = a ^ b;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">Compuerta XOR</span>
      <div
        className={`
          relative flex h-20 w-24 items-center justify-center rounded-xl border-2 
          transition-all duration-300
          ${
            result
              ? "border-neon-cyan bg-neon-cyan/10 glow-cyan"
              : "border-border bg-secondary"
          }
        `}
      >
        {/* Gate symbol */}
        <svg viewBox="0 0 60 40" className="h-12 w-16" aria-hidden="true">
          {/* XOR gate shape */}
          <path
            d="M10,5 Q25,20 10,35"
            fill="none"
            stroke={result ? "hsl(180,100%,50%)" : "hsl(215,20%,35%)"}
            strokeWidth="2"
          />
          <path
            d="M15,5 Q30,5 45,20 Q30,35 15,35 Q30,20 15,5"
            fill={result ? "hsla(180,100%,50%,0.1)" : "hsla(215,20%,35%,0.05)"}
            stroke={result ? "hsl(180,100%,50%)" : "hsl(215,20%,35%)"}
            strokeWidth="2"
          />
          {/* Input lines */}
          <line x1="0" y1="12" x2="18" y2="12" stroke={a ? "hsl(160,100%,50%)" : "hsl(215,20%,35%)"} strokeWidth="2" />
          <line x1="0" y1="28" x2="18" y2="28" stroke={b ? "hsl(45,100%,55%)" : "hsl(215,20%,35%)"} strokeWidth="2" />
          {/* Output line */}
          <line x1="45" y1="20" x2="60" y2="20" stroke={result ? "hsl(180,100%,50%)" : "hsl(215,20%,35%)"} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

/** LED output indicator */
function LedOutput({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground">Salida</span>
      <div
        className={`
          flex h-16 w-16 items-center justify-center rounded-full border-2
          transition-all duration-300
          ${
            value
              ? "border-neon-green bg-neon-green/30 glow-green"
              : "border-border bg-secondary"
          }
        `}
      >
        <Lightbulb
          className={`h-8 w-8 transition-all duration-300 ${
            value ? "text-neon-green" : "text-muted-foreground"
          }`}
        />
      </div>
      <span
        className={`text-2xl font-bold transition-all ${
          value ? "text-neon-green text-glow-green" : "text-muted-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

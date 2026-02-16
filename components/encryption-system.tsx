"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  ShieldOff,
  RotateCcw,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import SevenSegmentDisplay from "./seven-segment-display";
import { lfsrStep, toBitArray } from "@/hooks/use-lfsr";

/**
 * Full Encryption / Decryption System
 *
 * Simulates a complete stream cipher:
 *   TX: message_bit XOR lfsr1_bit = encrypted_bit
 *   Channel: encrypted bits "travel" through an insecure channel
 *   RX: encrypted_bit XOR lfsr2_bit = decrypted_bit
 *
 * Both LFSRs must start with the same seed (synchronized).
 * A "Desincronizar" button breaks the receiver LFSR to show
 * that without synchronization, decryption fails.
 */

const DEFAULT_SEED = 0b10110011100011110000111110000011;

interface SimulationStep {
  bitIndex: number;
  messageBit: number;
  lfsrTxBit: number;
  encryptedBit: number;
  lfsrRxBit: number;
  decryptedBit: number;
}

export default function EncryptionSystem() {
  // 8 DIP switches for the message byte
  const [switches, setSwitches] = useState<number[]>([0, 1, 0, 0, 0, 0, 0, 1]); // 'A' = 0x41

  // LFSR states for TX and RX
  const [lfsrTx, setLfsrTx] = useState(DEFAULT_SEED >>> 0);
  const [lfsrRx, setLfsrRx] = useState(DEFAULT_SEED >>> 0);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [encryptedByte, setEncryptedByte] = useState(0);
  const [decryptedByte, setDecryptedByte] = useState(0);
  const [isSynced, setIsSynced] = useState(true);
  const [desyncWarning, setDesyncWarning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get message byte from switches
  const messageByte = switches.reduce(
    (acc, bit, i) => acc | (bit << (7 - i)),
    0
  );

  const toggleSwitch = (index: number) => {
    if (isSimulating) return;
    setSwitches((prev) => {
      const next = [...prev];
      next[index] = next[index] ? 0 : 1;
      return next;
    });
  };

  /** Simulate encryption bit-by-bit */
  const handleSend = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSteps([]);
    setCurrentStep(-1);
    setEncryptedByte(0);
    setDecryptedByte(0);

    // Pre-compute all 8 steps
    let txState = lfsrTx;
    let rxState = lfsrRx;
    const allSteps: SimulationStep[] = [];

    for (let i = 0; i < 8; i++) {
      const messageBit = switches[i]; // MSB first

      // TX side: get LFSR output bit and step
      const txResult = lfsrStep(txState);
      const lfsrTxBit = txResult.outputBit;
      txState = txResult.newState;

      // Encrypt
      const encryptedBit = messageBit ^ lfsrTxBit;

      // RX side: get LFSR output bit and step
      const rxResult = lfsrStep(rxState);
      const lfsrRxBit = rxResult.outputBit;
      rxState = rxResult.newState;

      // Decrypt
      const decryptedBit = encryptedBit ^ lfsrRxBit;

      allSteps.push({
        bitIndex: i,
        messageBit,
        lfsrTxBit,
        encryptedBit,
        lfsrRxBit,
        decryptedBit,
      });
    }

    // Update LFSR states after full encryption
    setLfsrTx(txState);
    setLfsrRx(rxState);

    // Animate step by step
    let stepIdx = 0;
    setSteps(allSteps);

    intervalRef.current = setInterval(() => {
      if (stepIdx < 8) {
        setCurrentStep(stepIdx);

        // Build encrypted byte progressively
        setEncryptedByte((prev) => prev | (allSteps[stepIdx].encryptedBit << (7 - stepIdx)));
        setDecryptedByte((prev) => prev | (allSteps[stepIdx].decryptedBit << (7 - stepIdx)));

        stepIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsSimulating(false);
      }
    }, 400);
  }, [isSimulating, lfsrTx, lfsrRx, switches]);

  /** Desynchronize the RX LFSR */
  const handleDesync = useCallback(() => {
    if (isSimulating) return;
    // Shift RX LFSR by a random number of steps (3-10) to desync
    let rxState = lfsrRx;
    const extraSteps = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < extraSteps; i++) {
      rxState = lfsrStep(rxState).newState;
    }
    setLfsrRx(rxState);
    setIsSynced(false);
    setDesyncWarning(true);
  }, [isSimulating, lfsrRx]);

  /** Reset everything */
  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLfsrTx(DEFAULT_SEED >>> 0);
    setLfsrRx(DEFAULT_SEED >>> 0);
    setSteps([]);
    setCurrentStep(-1);
    setEncryptedByte(0);
    setDecryptedByte(0);
    setIsSimulating(false);
    setIsSynced(true);
    setDesyncWarning(false);
    setSwitches([0, 1, 0, 0, 0, 0, 0, 1]);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Desync warning banner */}
      {desyncWarning && (
        <div className="chip-card border-neon-red glow-red flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-neon-red flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-neon-red">
              LFSR Receptor Desincronizado
            </p>
            <p className="text-xs text-muted-foreground">
              El LFSR del receptor ya no esta sincronizado con el transmisor.
              Los mensajes no se recuperaran correctamente.
            </p>
          </div>
        </div>
      )}

      {/* DIP Switch Input Panel */}
      <div className="chip-card glow-amber">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-neon-amber" />
          <h3 className="text-sm font-bold text-neon-amber text-glow-amber">
            Entrada - DIP Switch (8 bits)
          </h3>
        </div>

        <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
          {/* DIP Switches */}
          <div className="flex gap-1.5">
            {switches.map((bit, i) => (
              <button
                key={i}
                onClick={() => toggleSwitch(i)}
                disabled={isSimulating}
                className={`
                  flex flex-col items-center gap-1 rounded-md border px-2 py-2
                  transition-all duration-200 cursor-pointer
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    bit
                      ? "border-neon-amber bg-neon-amber/20 text-neon-amber"
                      : "border-border bg-secondary text-muted-foreground"
                  }
                `}
                aria-label={`Switch bit ${7 - i}: ${bit}`}
              >
                <div
                  className={`w-4 h-6 rounded-sm flex items-end justify-center transition-all ${
                    bit ? "bg-neon-amber" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-sm transition-all ${
                      bit
                        ? "bg-background mb-auto mt-0.5"
                        : "bg-muted-foreground mt-auto mb-0.5"
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono">{bit}</span>
                <span className="text-[8px] text-muted-foreground">
                  b{7 - i}
                </span>
              </button>
            ))}
          </div>

          {/* Seven segment display for input */}
          <SevenSegmentDisplay
            value={messageByte}
            label="Mensaje"
            color="amber"
            size="sm"
          />
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-center lg:text-left">
          Byte: 0x{messageByte.toString(16).toUpperCase().padStart(2, "0")} |{" "}
          {messageByte.toString(2).padStart(8, "0")} |{" "}
          {messageByte >= 32 && messageByte <= 126
            ? `Caracter: '${String.fromCharCode(messageByte)}'`
            : "No imprimible"}
        </div>
      </div>

      {/* Encryption Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TX Side */}
        <div className="chip-card glow-green">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-neon-green" />
            <h3 className="text-sm font-bold text-neon-green text-glow-green">
              TX - Encriptacion
            </h3>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">MSG bit</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.messageBit
                      ? "border-neon-amber bg-neon-amber/20 text-neon-amber"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.messageBit : "-"}
              </span>
            </div>
            <span className="text-neon-cyan font-bold">XOR</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">LFSR1</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.lfsrTxBit
                      ? "border-neon-green bg-neon-green/20 text-neon-green"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.lfsrTxBit : "-"}
              </span>
            </div>
            <span className="text-foreground font-bold">=</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-neon-red">Cifrado</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.encryptedBit
                      ? "border-neon-red bg-neon-red/20 text-neon-red"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.encryptedBit : "-"}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">
            LFSR1: 0x
            {(lfsrTx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
          </div>
        </div>

        {/* Insecure Channel */}
        <div className="chip-card border-neon-red/30 glow-red flex flex-col items-center justify-center gap-3">
          <h3 className="text-sm font-bold text-neon-red">
            Canal Inseguro
          </h3>
          <SevenSegmentDisplay
            value={encryptedByte}
            label="Datos cifrados"
            color="red"
            size="sm"
          />
          <div className="w-full h-1 rounded-full bg-neon-red/20 overflow-hidden">
            <div
              className={`h-full bg-neon-red transition-all duration-300 ${
                isSimulating ? "animate-data-flow" : ""
              }`}
              style={{
                width: isSimulating
                  ? `${((currentStep + 1) / 8) * 100}%`
                  : steps.length > 0
                  ? "100%"
                  : "0%",
              }}
            />
          </div>
          <p className="text-[10px] text-neon-red/60">
            Un atacante solo ve datos sin sentido
          </p>
        </div>

        {/* RX Side */}
        <div
          className={`chip-card ${
            isSynced ? "glow-cyan" : "glow-red border-neon-red/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Unlock className="h-4 w-4 text-neon-cyan" />
            <h3
              className={`text-sm font-bold ${
                isSynced
                  ? "text-neon-cyan text-glow-cyan"
                  : "text-neon-red"
              }`}
            >
              RX - Desencriptacion
              {!isSynced && " [DESINCRONIZADO]"}
            </h3>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-neon-red">Cifrado</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.encryptedBit
                      ? "border-neon-red bg-neon-red/20 text-neon-red"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.encryptedBit : "-"}
              </span>
            </div>
            <span className="text-neon-cyan font-bold">XOR</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">LFSR2</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.lfsrRxBit
                      ? "border-neon-cyan bg-neon-cyan/20 text-neon-cyan"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.lfsrRxBit : "-"}
              </span>
            </div>
            <span className="text-foreground font-bold">=</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-neon-green">Descifrado</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded border font-bold text-sm ${
                  currentStep >= 0
                    ? steps[currentStep]?.decryptedBit
                      ? "border-neon-green bg-neon-green/20 text-neon-green"
                      : "border-border bg-secondary text-muted-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep >= 0 ? steps[currentStep]?.decryptedBit : "-"}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">
            LFSR2: 0x
            {(lfsrRx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
            {!isSynced && (
              <span className="text-neon-red ml-2">[DIFERENTE]</span>
            )}
          </div>
        </div>
      </div>

      {/* Output Displays */}
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-8">
        <SevenSegmentDisplay
          value={messageByte}
          label="Original"
          color="amber"
        />
        <div className="flex flex-col items-center gap-1">
          <Lock className="h-5 w-5 text-neon-green" />
          <div className="w-12 h-0.5 bg-neon-green/30" />
        </div>
        <SevenSegmentDisplay
          value={encryptedByte}
          label="Cifrado"
          color="red"
        />
        <div className="flex flex-col items-center gap-1">
          <Unlock className="h-5 w-5 text-neon-cyan" />
          <div className="w-12 h-0.5 bg-neon-cyan/30" />
        </div>
        <SevenSegmentDisplay
          value={decryptedByte}
          label="Descifrado"
          color={isSynced ? "green" : "red"}
        />
      </div>

      {/* Bit-by-bit progress table */}
      {steps.length > 0 && (
        <div className="chip-card overflow-x-auto">
          <h3 className="text-sm font-bold text-neon-green text-glow-green mb-3">
            Progreso bit a bit
          </h3>
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 px-2 text-muted-foreground">Bit #</th>
                <th className="py-1 px-2 text-neon-amber">MSG</th>
                <th className="py-1 px-2 text-neon-green">LFSR1</th>
                <th className="py-1 px-2 text-neon-red">Cifrado</th>
                <th className="py-1 px-2 text-neon-cyan">LFSR2</th>
                <th className="py-1 px-2 text-neon-green">Descifrado</th>
                <th className="py-1 px-2 text-muted-foreground">OK?</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/30 transition-all ${
                    i <= currentStep ? "opacity-100" : "opacity-20"
                  } ${i === currentStep ? "bg-neon-green/5" : ""}`}
                >
                  <td className="py-1 px-2 text-muted-foreground">
                    b{7 - i}
                  </td>
                  <td className="py-1 px-2 text-neon-amber">{s.messageBit}</td>
                  <td className="py-1 px-2 text-neon-green">{s.lfsrTxBit}</td>
                  <td className="py-1 px-2 text-neon-red">{s.encryptedBit}</td>
                  <td className="py-1 px-2 text-neon-cyan">{s.lfsrRxBit}</td>
                  <td className="py-1 px-2 text-neon-green">
                    {s.decryptedBit}
                  </td>
                  <td className="py-1 px-2">
                    {s.messageBit === s.decryptedBit ? (
                      <span className="text-neon-green">OK</span>
                    ) : (
                      <span className="text-neon-red">ERR</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSend}
          disabled={isSimulating}
          className="flex items-center gap-2 rounded-lg border border-neon-green bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-40 disabled:cursor-not-allowed glow-green"
        >
          <Send className="h-4 w-4" />
          Enviar Caracter
        </button>
        <button
          onClick={handleDesync}
          disabled={isSimulating || !isSynced}
          className="flex items-center gap-2 rounded-lg border border-neon-red bg-neon-red/10 px-4 py-2 text-sm font-bold text-neon-red transition-all hover:bg-neon-red/20 disabled:opacity-40 disabled:cursor-not-allowed glow-red"
        >
          <ShieldOff className="h-4 w-4" />
          Desincronizar
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-muted-foreground bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </div>
  );
}

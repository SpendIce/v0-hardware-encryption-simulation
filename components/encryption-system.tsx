"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  ShieldOff,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import SevenSegmentDisplay from "./seven-segment-display";
import { lfsrStep } from "@/hooks/use-lfsr";

/**
 * Encryption / Decryption System (inline, no tabs)
 *
 * TX: message_bit XOR lfsr_output = encrypted_bit
 * RX: encrypted_bit XOR lfsr_output = decrypted_bit
 *
 * The LFSR output bit that feeds the XOR also drives each clock.
 * All three displays (original, encrypted, decrypted) update simultaneously.
 */

const DEFAULT_SEED = 0b10110011100011110000111110000011;

interface SimulationStep {
  bitIndex: number;
  messageBit: number;
  lfsrBit: number;
  encryptedBit: number;
  lfsrRxBit: number;
  decryptedBit: number;
}

export default function EncryptionSystem() {
  const [switches, setSwitches] = useState<number[]>([0, 1, 0, 0, 0, 0, 0, 1]); // 'A' = 0x41
  const [lfsrTx, setLfsrTx] = useState(DEFAULT_SEED >>> 0);
  const [lfsrRx, setLfsrRx] = useState(DEFAULT_SEED >>> 0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [encryptedByte, setEncryptedByte] = useState(0);
  const [decryptedByte, setDecryptedByte] = useState(0);
  const [isSynced, setIsSynced] = useState(true);
  const [desyncWarning, setDesyncWarning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleSend = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSteps([]);
    setCurrentStep(-1);
    setEncryptedByte(0);
    setDecryptedByte(0);

    let txState = lfsrTx;
    let rxState = lfsrRx;
    const allSteps: SimulationStep[] = [];

    for (let i = 0; i < 8; i++) {
      const messageBit = switches[i];
      const txResult = lfsrStep(txState);
      const lfsrBit = txResult.outputBit;
      txState = txResult.newState;

      const encryptedBit = messageBit ^ lfsrBit;

      const rxResult = lfsrStep(rxState);
      const lfsrRxBit = rxResult.outputBit;
      rxState = rxResult.newState;

      const decryptedBit = encryptedBit ^ lfsrRxBit;

      allSteps.push({
        bitIndex: i,
        messageBit,
        lfsrBit,
        encryptedBit,
        lfsrRxBit,
        decryptedBit,
      });
    }

    setLfsrTx(txState);
    setLfsrRx(rxState);

    let stepIdx = 0;
    setSteps(allSteps);

    intervalRef.current = setInterval(() => {
      if (stepIdx < 8) {
        setCurrentStep(stepIdx);
        setEncryptedByte(
          (prev) => prev | (allSteps[stepIdx].encryptedBit << (7 - stepIdx))
        );
        setDecryptedByte(
          (prev) => prev | (allSteps[stepIdx].decryptedBit << (7 - stepIdx))
        );
        stepIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsSimulating(false);
      }
    }, 400);
  }, [isSimulating, lfsrTx, lfsrRx, switches]);

  const handleDesync = useCallback(() => {
    if (isSimulating) return;
    let rxState = lfsrRx;
    const extraSteps = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < extraSteps; i++) {
      rxState = lfsrStep(rxState).newState;
    }
    setLfsrRx(rxState);
    setIsSynced(false);
    setDesyncWarning(true);
  }, [isSimulating, lfsrRx]);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section className="flex flex-col gap-5">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Sistema de Cifrado por Flujo (Stream Cipher)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          El bit de salida del LFSR se suma XOR con el mensaje. El resultado
          cifrado viaja por el canal inseguro. El receptor, con un LFSR
          sincronizado, recupera el mensaje original.
        </p>
      </div>

      {/* Desync warning */}
      {desyncWarning && (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-bold text-destructive">
              LFSR Receptor Desincronizado
            </p>
            <p className="text-xs text-muted-foreground">
              El LFSR del receptor ya no coincide con el transmisor. Los
              mensajes no se recuperaran correctamente.
            </p>
          </div>
        </div>
      )}

      {/* DIP Switch Input */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">
          Entrada - DIP Switch (8 bits)
        </h3>
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
          <div className="flex gap-1.5">
            {switches.map((bit, i) => (
              <button
                key={i}
                onClick={() => toggleSwitch(i)}
                disabled={isSimulating}
                className={`
                  flex flex-col items-center gap-1 rounded border px-2 py-2
                  transition-colors cursor-pointer
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    bit
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }
                `}
                aria-label={`Switch bit ${7 - i}: ${bit}`}
              >
                <div
                  className={`w-4 h-6 rounded-sm flex items-end justify-center transition-colors ${
                    bit ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-sm transition-all ${
                      bit
                        ? "bg-primary-foreground mb-auto mt-0.5"
                        : "bg-muted-foreground mt-auto mb-0.5"
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold">{bit}</span>
                <span className="text-[8px] text-muted-foreground">b{7 - i}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center lg:text-right">
            <div>
              Byte: 0x{messageByte.toString(16).toUpperCase().padStart(2, "0")} |{" "}
              {messageByte.toString(2).padStart(8, "0")}
            </div>
            <div>
              {messageByte >= 32 && messageByte <= 126
                ? `Caracter: '${String.fromCharCode(messageByte)}'`
                : "No imprimible"}
            </div>
          </div>
        </div>
      </div>

      {/* Three displays side by side */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
        <SevenSegmentDisplay
          value={messageByte}
          label="Original"
          color="blue"
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">XOR LFSR</span>
          <div className="w-8 h-px bg-border sm:w-px sm:h-8" />
        </div>
        <SevenSegmentDisplay
          value={encryptedByte}
          label="Cifrado (canal)"
          color="red"
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">XOR LFSR</span>
          <div className="w-8 h-px bg-border sm:w-px sm:h-8" />
        </div>
        <SevenSegmentDisplay
          value={decryptedByte}
          label="Descifrado"
          color={isSynced ? "green" : "red"}
        />
      </div>

      {/* Bit-by-bit progress table */}
      {steps.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Progreso bit a bit
          </h3>
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1.5 px-2 text-muted-foreground">Bit</th>
                <th className="py-1.5 px-2 text-foreground">MSG</th>
                <th className="py-1.5 px-2 text-primary">LFSR TX</th>
                <th className="py-1.5 px-2 text-destructive">Cifrado</th>
                <th className="py-1.5 px-2 text-primary">LFSR RX</th>
                <th className="py-1.5 px-2 text-foreground">Descifrado</th>
                <th className="py-1.5 px-2 text-muted-foreground">OK?</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 transition-opacity ${
                    i <= currentStep ? "opacity-100" : "opacity-20"
                  } ${i === currentStep ? "bg-primary/5" : ""}`}
                >
                  <td className="py-1 px-2 text-muted-foreground">b{7 - i}</td>
                  <td className="py-1 px-2">{s.messageBit}</td>
                  <td className="py-1 px-2 text-primary">{s.lfsrBit}</td>
                  <td className="py-1 px-2 text-destructive">{s.encryptedBit}</td>
                  <td className="py-1 px-2 text-primary">{s.lfsrRxBit}</td>
                  <td className="py-1 px-2">{s.decryptedBit}</td>
                  <td className="py-1 px-2">
                    {s.messageBit === s.decryptedBit ? (
                      <span className="text-green-600">OK</span>
                    ) : (
                      <span className="text-destructive">ERR</span>
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
          className="flex items-center gap-2 rounded-md border border-primary bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          Enviar Caracter
        </button>
        <button
          onClick={handleDesync}
          disabled={isSimulating || !isSynced}
          className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/5 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldOff className="h-4 w-4" />
          Desincronizar
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* LFSR state info */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          LFSR TX: 0x{(lfsrTx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
        </span>
        <span>
          LFSR RX: 0x{(lfsrRx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
          {!isSynced && (
            <span className="text-destructive ml-1">[DESINCRONIZADO]</span>
          )}
        </span>
      </div>
    </section>
  );
}

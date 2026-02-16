"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ShieldOff, RotateCcw, AlertTriangle } from "lucide-react";
import SevenSegmentDisplay from "./seven-segment-display";
import { lfsrStep } from "@/hooks/use-lfsr";

/**
 * Encryption System -- pulse by pulse
 *
 * The user sets 8 DIP switches (each switch = one segment of the display).
 * Each press of "Enviar Pulso" sends ONE bit:
 *   TX: message_bit XOR lfsr_tx_output = encrypted_bit
 *   RX: encrypted_bit XOR lfsr_rx_output = decrypted_bit
 *
 * The three 7-segment displays update in real-time as each bit arrives.
 * No ASCII or number-to-7-segment converter -- bits map directly to segments.
 *
 *   bit 7 = seg a | bit 6 = seg b | bit 5 = seg c | bit 4 = seg d
 *   bit 3 = seg e | bit 2 = seg f | bit 1 = seg g | bit 0 = DP
 */

const DEFAULT_SEED = 0b10110011100011110000111110000011;
const SEGMENT_NAMES = ["a", "b", "c", "d", "e", "f", "g", "DP"];

interface PulseRecord {
  bitIndex: number;
  messageBit: number;
  lfsrBit: number;
  encryptedBit: number;
  decryptedBit: number;
  match: boolean;
}

export default function EncryptionSystem() {
  // 8 DIP switches: index 0 = bit 7 (segment a), index 7 = bit 0 (DP)
  const [switches, setSwitches] = useState<number[]>([1, 1, 1, 1, 1, 1, 0, 0]);

  // LFSR states
  const [lfsrTx, setLfsrTx] = useState(DEFAULT_SEED >>> 0);
  const [lfsrRx, setLfsrRx] = useState(DEFAULT_SEED >>> 0);

  // Pulse state
  const [bitCursor, setBitCursor] = useState(0); // 0..7
  const [originalByte, setOriginalByte] = useState(0);
  const [encryptedByte, setEncryptedByte] = useState(0);
  const [decryptedByte, setDecryptedByte] = useState(0);
  const [pulses, setPulses] = useState<PulseRecord[]>([]);

  // Sync state
  const [isSynced, setIsSynced] = useState(true);
  const [desyncWarning, setDesyncWarning] = useState(false);

  const byteComplete = bitCursor >= 8;

  // The full byte from switches (for reference)
  const messageByte = switches.reduce(
    (acc, bit, i) => acc | (bit << (7 - i)),
    0
  );

  const toggleSwitch = (index: number) => {
    if (byteComplete) return;
    setSwitches((prev) => {
      const next = [...prev];
      next[index] = next[index] ? 0 : 1;
      return next;
    });
  };

  /** Send one pulse = one bit */
  const handlePulse = useCallback(() => {
    if (bitCursor >= 8) return;

    const messageBit = switches[bitCursor]; // MSB first

    // TX
    const txResult = lfsrStep(lfsrTx);
    const lfsrBit = txResult.outputBit;
    const encryptedBit = messageBit ^ lfsrBit;
    setLfsrTx(txResult.newState);

    // RX
    const rxResult = lfsrStep(lfsrRx);
    const lfsrRxBit = rxResult.outputBit;
    const decryptedBit = encryptedBit ^ lfsrRxBit;
    setLfsrRx(rxResult.newState);

    const shift = 7 - bitCursor;
    setOriginalByte((prev) => prev | (messageBit << shift));
    setEncryptedByte((prev) => prev | (encryptedBit << shift));
    setDecryptedByte((prev) => prev | (decryptedBit << shift));

    setPulses((prev) => [
      ...prev,
      {
        bitIndex: bitCursor,
        messageBit,
        lfsrBit,
        encryptedBit,
        decryptedBit,
        match: messageBit === decryptedBit,
      },
    ]);

    setBitCursor((prev) => prev + 1);
  }, [bitCursor, switches, lfsrTx, lfsrRx]);

  /** Next byte (keep LFSR state) */
  const handleNextByte = useCallback(() => {
    setBitCursor(0);
    setOriginalByte(0);
    setEncryptedByte(0);
    setDecryptedByte(0);
    setPulses([]);
  }, []);

  /** Full reset */
  const handleReset = useCallback(() => {
    setLfsrTx(DEFAULT_SEED >>> 0);
    setLfsrRx(DEFAULT_SEED >>> 0);
    setBitCursor(0);
    setOriginalByte(0);
    setEncryptedByte(0);
    setDecryptedByte(0);
    setPulses([]);
    setIsSynced(true);
    setDesyncWarning(false);
    setSwitches([1, 1, 1, 1, 1, 1, 0, 0]);
  }, []);

  /** Desync RX */
  const handleDesync = useCallback(() => {
    let rxState = lfsrRx;
    const extra = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < extra; i++) {
      rxState = lfsrStep(rxState).newState;
    }
    setLfsrRx(rxState);
    setIsSynced(false);
    setDesyncWarning(true);
  }, [lfsrRx]);

  return (
    <section className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Cifrado por Flujo (Stream Cipher)
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          Cada pulso envia un bit. El bit de salida del LFSR se suma XOR con
          el bit del mensaje.
        </p>
      </div>

      {/* Desync warning */}
      {desyncWarning && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/15 p-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
          <p className="text-base font-bold text-destructive">
            LFSR Receptor Desincronizado
          </p>
        </div>
      )}

      {/* DIP Switches */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-bold text-foreground mb-4">
          DIP Switch (8 bits {"\u2192"} 7 segmentos + DP)
        </h3>
        <div className="flex gap-2 justify-center">
          {switches.map((bit, i) => {
            const isSent = i < bitCursor;
            const isCurrent = i === bitCursor && !byteComplete;
            return (
              <button
                key={i}
                onClick={() => toggleSwitch(i)}
                disabled={bitCursor > 0}
                className={`
                  flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3
                  transition-colors cursor-pointer min-w-[50px]
                  disabled:cursor-not-allowed
                  ${
                    isSent
                      ? "border-primary/30 bg-primary/5 opacity-40"
                      : isCurrent
                      ? "border-primary bg-primary/15 ring-2 ring-primary/30"
                      : bit
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }
                `}
                aria-label={`Switch segmento ${SEGMENT_NAMES[i]}: ${bit}`}
              >
                {/* Toggle indicator */}
                <div
                  className={`w-5 h-8 rounded flex items-end justify-center transition-colors ${
                    bit ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-sm transition-all ${
                      bit
                        ? "bg-primary-foreground mb-auto mt-0.5"
                        : "bg-muted-foreground/30 mt-auto mb-0.5"
                    }`}
                  />
                </div>
                <span className="text-lg font-bold">{bit}</span>
                <span className="text-xs text-muted-foreground">
                  {SEGMENT_NAMES[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Three displays */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
        <SevenSegmentDisplay
          value={originalByte}
          label="Original (TX)"
          color="blue"
          bitsReceived={bitCursor}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground font-bold">
            XOR
          </span>
          <div className="w-10 h-px bg-border sm:w-px sm:h-10" />
        </div>
        <SevenSegmentDisplay
          value={encryptedByte}
          label="Cifrado (canal)"
          color="red"
          bitsReceived={bitCursor}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground font-bold">
            XOR
          </span>
          <div className="w-10 h-px bg-border sm:w-px sm:h-10" />
        </div>
        <SevenSegmentDisplay
          value={decryptedByte}
          label="Descifrado (RX)"
          color={isSynced ? "green" : "red"}
          bitsReceived={bitCursor}
        />
      </div>

      {/* Pulse progress */}
      {pulses.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 overflow-x-auto">
          <h3 className="text-base font-bold text-foreground mb-3">
            Pulsos enviados: {bitCursor} / 8
          </h3>
          <table className="w-full text-center font-mono text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-muted-foreground">Pulso</th>
                <th className="py-2 px-3 text-muted-foreground">Seg</th>
                <th className="py-2 px-3 text-foreground">MSG</th>
                <th className="py-2 px-3 text-primary">LFSR</th>
                <th className="py-2 px-3 text-destructive">Cifrado</th>
                <th className="py-2 px-3 text-foreground">Descifrado</th>
                <th className="py-2 px-3 text-muted-foreground">OK</th>
              </tr>
            </thead>
            <tbody>
              {pulses.map((p, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/40 ${
                    i === pulses.length - 1 ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{SEGMENT_NAMES[p.bitIndex]}</td>
                  <td className="py-1.5 px-3 text-foreground font-bold">{p.messageBit}</td>
                  <td className="py-1.5 px-3 text-primary">{p.lfsrBit}</td>
                  <td className="py-1.5 px-3 text-destructive font-bold">{p.encryptedBit}</td>
                  <td className="py-1.5 px-3 text-foreground font-bold">{p.decryptedBit}</td>
                  <td className="py-1.5 px-3">
                    {p.match ? (
                      <span className="text-green-400">Si</span>
                    ) : (
                      <span className="text-destructive">No</span>
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
          onClick={handlePulse}
          disabled={byteComplete}
          className="flex items-center gap-2 rounded-md border border-primary bg-primary/15 px-5 py-2.5 text-base font-bold text-primary transition-colors hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
          Enviar Pulso ({bitCursor}/8)
        </button>
        {byteComplete && (
          <button
            onClick={handleNextByte}
            className="flex items-center gap-2 rounded-md border border-primary bg-primary/15 px-5 py-2.5 text-base font-bold text-primary transition-colors hover:bg-primary/25"
          >
            Siguiente Byte
          </button>
        )}
        <button
          onClick={handleDesync}
          disabled={!isSynced}
          className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/15 px-5 py-2.5 text-base font-bold text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldOff className="h-5 w-5" />
          Desincronizar
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-base font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </button>
      </div>
    </section>
  );
}

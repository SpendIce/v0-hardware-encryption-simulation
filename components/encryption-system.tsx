"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight,
  ShieldOff,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import SevenSegmentDisplay from "./seven-segment-display";
import { lfsrStep } from "@/hooks/use-lfsr";

/**
 * Encryption / Decryption System -- pulse-by-pulse
 *
 * The user configures 8 DIP switches (the byte to send).
 * Each press of "Enviar Pulso" sends exactly ONE bit:
 *   TX side: message_bit XOR lfsr_tx_output = encrypted_bit
 *   RX side: encrypted_bit XOR lfsr_rx_output = decrypted_bit
 *
 * The three 7-segment displays update simultaneously as bits arrive.
 * After 8 pulses a full byte has been sent and the displays show the result.
 */

const DEFAULT_SEED = 0b10110011100011110000111110000011;

interface PulseRecord {
  bitIndex: number;
  messageBit: number;
  lfsrTxBit: number;
  encryptedBit: number;
  lfsrRxBit: number;
  decryptedBit: number;
}

export default function EncryptionSystem() {
  // DIP switch input
  const [switches, setSwitches] = useState<number[]>([0, 1, 0, 0, 0, 0, 0, 1]); // 'A'

  // LFSR states
  const [lfsrTx, setLfsrTx] = useState(DEFAULT_SEED >>> 0);
  const [lfsrRx, setLfsrRx] = useState(DEFAULT_SEED >>> 0);

  // Current byte being built up pulse by pulse
  const [bitCursor, setBitCursor] = useState(0); // 0..7 which bit we send next
  const [originalByte, setOriginalByte] = useState(0);
  const [encryptedByte, setEncryptedByte] = useState(0);
  const [decryptedByte, setDecryptedByte] = useState(0);

  // History
  const [pulses, setPulses] = useState<PulseRecord[]>([]);

  // Sync state
  const [isSynced, setIsSynced] = useState(true);
  const [desyncWarning, setDesyncWarning] = useState(false);

  // Derived: the full byte from switches (for display)
  const messageByte = switches.reduce(
    (acc, bit, i) => acc | (bit << (7 - i)),
    0
  );

  const byteComplete = bitCursor >= 8;

  const toggleSwitch = (index: number) => {
    if (byteComplete) return;
    setSwitches((prev) => {
      const next = [...prev];
      next[index] = next[index] ? 0 : 1;
      return next;
    });
  };

  /** Send one pulse = one bit through the cipher */
  const handlePulse = useCallback(() => {
    if (bitCursor >= 8) return;

    const messageBit = switches[bitCursor];

    // TX side
    const txResult = lfsrStep(lfsrTx);
    const lfsrTxBit = txResult.outputBit;
    const encryptedBit = messageBit ^ lfsrTxBit;
    setLfsrTx(txResult.newState);

    // RX side
    const rxResult = lfsrStep(lfsrRx);
    const lfsrRxBit = rxResult.outputBit;
    const decryptedBit = encryptedBit ^ lfsrRxBit;
    setLfsrRx(rxResult.newState);

    // Build up bytes bit by bit (MSB first: bit 0 of switches = bit 7 of byte)
    const shift = 7 - bitCursor;
    setOriginalByte((prev) => prev | (messageBit << shift));
    setEncryptedByte((prev) => prev | (encryptedBit << shift));
    setDecryptedByte((prev) => prev | (decryptedBit << shift));

    setPulses((prev) => [
      ...prev,
      {
        bitIndex: bitCursor,
        messageBit,
        lfsrTxBit,
        encryptedBit,
        lfsrRxBit,
        decryptedBit,
      },
    ]);

    setBitCursor((prev) => prev + 1);
  }, [bitCursor, switches, lfsrTx, lfsrRx]);

  /** Reset the current byte (keeps LFSR state for next byte) */
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
    setSwitches([0, 1, 0, 0, 0, 0, 0, 1]);
  }, []);

  /** Desync the RX LFSR */
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
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Sistema de Cifrado por Flujo (Stream Cipher)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cada pulso envia un bit. El bit de salida del LFSR se suma XOR con el
          bit del mensaje. El receptor, con un LFSR sincronizado, recupera el
          mensaje original.
        </p>
      </div>

      {/* Desync warning */}
      {desyncWarning && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-bold text-destructive">
              LFSR Receptor Desincronizado
            </p>
            <p className="text-xs text-muted-foreground">
              El LFSR del receptor ya no coincide con el del transmisor.
            </p>
          </div>
        </div>
      )}

      {/* DIP Switch Input */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">
          Entrada - DIP Switch (8 bits)
          {bitCursor > 0 && !byteComplete && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (bloqueado - byte en curso, bit {bitCursor}/8)
            </span>
          )}
        </h3>
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
          <div className="flex gap-1.5">
            {switches.map((bit, i) => {
              const isSent = i < bitCursor;
              const isCurrent = i === bitCursor && !byteComplete;
              return (
                <button
                  key={i}
                  onClick={() => toggleSwitch(i)}
                  disabled={bitCursor > 0}
                  className={`
                    flex flex-col items-center gap-1 rounded border px-2 py-2
                    transition-colors cursor-pointer
                    disabled:cursor-not-allowed
                    ${
                      isSent
                        ? "border-primary/30 bg-primary/5 opacity-50"
                        : isCurrent
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                        : bit
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
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
                          : "bg-muted-foreground/40 mt-auto mb-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-foreground">{bit}</span>
                  <span className="text-[8px] text-muted-foreground">
                    b{7 - i}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground text-center lg:text-right">
            <div>
              Byte: 0x
              {messageByte.toString(16).toUpperCase().padStart(2, "0")} |{" "}
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
          value={originalByte}
          label="Original (TX)"
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
          label="Descifrado (RX)"
          color={isSynced ? "green" : "red"}
        />
      </div>

      {/* Bit-by-bit progress table */}
      {pulses.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Progreso bit a bit ({bitCursor}/8)
          </h3>
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1.5 px-2 text-muted-foreground">Pulso</th>
                <th className="py-1.5 px-2 text-foreground">MSG</th>
                <th className="py-1.5 px-2 text-primary">LFSR TX</th>
                <th className="py-1.5 px-2 text-destructive">Cifrado</th>
                <th className="py-1.5 px-2 text-primary">LFSR RX</th>
                <th className="py-1.5 px-2 text-foreground">Descifrado</th>
                <th className="py-1.5 px-2 text-muted-foreground">OK?</th>
              </tr>
            </thead>
            <tbody>
              {pulses.map((p, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 ${
                    i === pulses.length - 1 ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-1 px-2 text-muted-foreground">
                    b{7 - p.bitIndex}
                  </td>
                  <td className="py-1 px-2 text-foreground">{p.messageBit}</td>
                  <td className="py-1 px-2 text-primary">{p.lfsrTxBit}</td>
                  <td className="py-1 px-2 text-destructive">
                    {p.encryptedBit}
                  </td>
                  <td className="py-1 px-2 text-primary">{p.lfsrRxBit}</td>
                  <td className="py-1 px-2 text-foreground">
                    {p.decryptedBit}
                  </td>
                  <td className="py-1 px-2">
                    {p.messageBit === p.decryptedBit ? (
                      <span className="text-green-400">OK</span>
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
          onClick={handlePulse}
          disabled={byteComplete}
          className="flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
          Enviar Pulso ({bitCursor}/8)
        </button>
        {byteComplete && (
          <button
            onClick={handleNextByte}
            className="flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
          >
            Siguiente Byte
          </button>
        )}
        <button
          onClick={handleDesync}
          disabled={!isSynced}
          className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldOff className="h-4 w-4" />
          Desincronizar
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* LFSR state info */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          LFSR TX: 0x
          {(lfsrTx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
        </span>
        <span>
          LFSR RX: 0x
          {(lfsrRx >>> 0).toString(16).toUpperCase().padStart(8, "0")}
          {!isSynced && (
            <span className="text-destructive ml-1">[DESINCRONIZADO]</span>
          )}
        </span>
      </div>
    </section>
  );
}

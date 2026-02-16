"use client";

import LfsrVisualizer from "@/components/lfsr-visualizer";
import EncryptionSystem from "@/components/encryption-system";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Simulador de Cifrado Grain-128AED
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Simulador interactivo de encriptacion por hardware | LFSR + Stream
            Cipher
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-12">
        {/* Section 1: LFSR */}
        <LfsrVisualizer />

        {/* Divider */}
        <hr className="border-border" />

        {/* Section 2: Encryption */}
        <EncryptionSystem />
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          Simulador educativo basado en Grain-128AED simplificado |{" "}
          {"Polinomio LFSR: x\u00B3\u00B9 + x\u2076 + x\u2075 + x\u00B9 + 1"}
        </div>
      </footer>
    </main>
  );
}

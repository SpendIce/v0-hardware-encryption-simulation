"use client";

import LfsrVisualizer from "@/components/lfsr-visualizer";
import EncryptionSystem from "@/components/encryption-system";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <h1 className="text-2xl font-bold text-foreground">
            Simulador de Cifrado Grain-128AED
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            LFSR de 32 bits + Cifrado por flujo
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-14">
        {/* Section 1: LFSR */}
        <LfsrVisualizer />

        {/* Divider */}
        <hr className="border-border" />

        {/* Section 2: Encryption */}
        <EncryptionSystem />
      </div>
    </main>
  );
}

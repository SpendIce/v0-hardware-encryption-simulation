"use client";

import { Cpu, CircuitBoard, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LfsrVisualizer from "@/components/lfsr-visualizer";
import XorSimulator from "@/components/xor-simulator";
import EncryptionSystem from "@/components/encryption-system";

/**
 * Grain-128AED Simplified Hardware Encryption Simulator
 *
 * An interactive educational tool with 3 sections:
 * 1. LFSR Engine - Visualize the pseudo-random sequence generator
 * 2. XOR Logic - Understand modulo-2 addition
 * 3. Full System - See the complete encryption/decryption flow
 */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <CircuitBoard className="h-6 w-6 text-neon-green" />
              <h1 className="text-xl font-bold text-neon-green text-glow-green">
                Grain-128AED Encryption Simulator
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Simulador interactivo de encriptacion por hardware | LFSR +
              Stream Cipher
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="lfsr" className="w-full">
          <TabsList className="w-full bg-secondary border border-border rounded-lg p-1 flex">
            <TabsTrigger
              value="lfsr"
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all data-[state=active]:bg-neon-green/10 data-[state=active]:text-neon-green data-[state=active]:border data-[state=active]:border-neon-green/30 data-[state=active]:shadow-none text-muted-foreground"
            >
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">1. El Motor:</span> LFSR
            </TabsTrigger>
            <TabsTrigger
              value="xor"
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all data-[state=active]:bg-neon-cyan/10 data-[state=active]:text-neon-cyan data-[state=active]:border data-[state=active]:border-neon-cyan/30 data-[state=active]:shadow-none text-muted-foreground"
            >
              <CircuitBoard className="h-4 w-4" />
              <span className="hidden sm:inline">2. La Logica:</span> XOR
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all data-[state=active]:bg-neon-amber/10 data-[state=active]:text-neon-amber data-[state=active]:border data-[state=active]:border-neon-amber/30 data-[state=active]:shadow-none text-muted-foreground"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">3. Sistema:</span> Cifrado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lfsr" className="mt-6">
            <LfsrVisualizer />
          </TabsContent>

          <TabsContent value="xor" className="mt-6">
            <XorSimulator />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <EncryptionSystem />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 mt-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          Simulador educativo basado en Grain-128AED simplificado |
          Polinomio LFSR: x{"\u00B3\u00B9"} + x{"\u2076"} + x{"\u2075"} + x
          {"\u00B9"} + 1
        </div>
      </footer>
    </main>
  );
}

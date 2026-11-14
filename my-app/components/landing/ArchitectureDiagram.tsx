"use client";

import React from "react";

export function ArchitectureDiagram() {
  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0c11] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-white/[0.07] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
              System Topology
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight mt-1 font-sans">
            Distributed CRDT &amp; Synchronization Architecture
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Decoupled tier design: sub-10ms peer sync with horizontally scaled clustering.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 self-start sm:self-auto bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg">
          <span className="text-emerald-400">● 4 Nodes Healthy</span>
          <span className="text-zinc-600">|</span>
          <span>Mesh Active</span>
        </div>
      </div>

      {/* 4-Tier Architecture Pipeline */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5">
        {/* Tier 1: Client Edge */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4 flex flex-col justify-between hover:border-white/[0.14] transition-colors relative group">
          <div className="absolute -top-2.5 left-4 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400 font-semibold uppercase">
            01 // Edge Client
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold text-white">Monaco Editor</div>
            <div className="text-[11px] text-zinc-400 mt-1">In-Tree Y-Monaco Binding</div>
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
              Maintains local <code className="text-zinc-200 font-mono text-[10px]">Y.Doc</code> CRDT state. Executes keystrokes with <strong className="text-zinc-200">0ms optimistic latency</strong>.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[10px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Local Lag:</span>
              <span className="text-emerald-400 font-medium">&lt; 1ms</span>
            </div>
            <div className="flex justify-between">
              <span>Awareness:</span>
              <span className="text-zinc-300">Line &amp; Column</span>
            </div>
            <div className="flex justify-between">
              <span>Typing Status:</span>
              <span className="text-zinc-300">Live Broadcast</span>
            </div>
          </div>
        </div>

        {/* Tier 2: WebSocket Gateway Cluster */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4 flex flex-col justify-between hover:border-white/[0.14] transition-colors relative group">
          <div className="absolute -top-2.5 left-4 rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-mono text-sky-400 font-semibold uppercase">
            02 // Sync Gateway
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold text-white">WebSocket Cluster</div>
            <div className="text-[11px] text-zinc-400 mt-1">Standalone Node.js Server</div>
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
              Multiplexes client sessions, manages in-memory <code className="text-zinc-200 font-mono text-[10px]">RoomManager</code>, and encodes updates using lib0 binary protocols.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[10px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Port:</span>
              <span className="text-zinc-300">4000 (ws://)</span>
            </div>
            <div className="flex justify-between">
              <span>Wire Protocol:</span>
              <span className="text-sky-400">Binary lib0</span>
            </div>
            <div className="flex justify-between">
              <span>Debounce Save:</span>
              <span className="text-zinc-300">2,000ms</span>
            </div>
          </div>
        </div>

        {/* Tier 3: Horizontal Redis Mesh */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4 flex flex-col justify-between hover:border-white/[0.14] transition-colors relative group">
          <div className="absolute -top-2.5 left-4 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-mono text-amber-400 font-semibold uppercase">
            03 // Scale Mesh
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold text-white">Redis Pub/Sub</div>
            <div className="text-[11px] text-zinc-400 mt-1">Horizontal Interconnect</div>
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
              Distributes CRDT deltas across multiple server instances with strict <strong className="text-zinc-200">originInstanceId</strong> loopback echo suppression.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[10px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Channel:</span>
              <span className="text-zinc-300">room:&#123;id&#125;</span>
            </div>
            <div className="flex justify-between">
              <span>Echo Defense:</span>
              <span className="text-amber-400">Suppressed</span>
            </div>
            <div className="flex justify-between">
              <span>Broadcast Latency:</span>
              <span className="text-emerald-400">&lt; 3ms</span>
            </div>
          </div>
        </div>

        {/* Tier 4: Neon DB & Compaction Worker */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4 flex flex-col justify-between hover:border-white/[0.14] transition-colors relative group">
          <div className="absolute -top-2.5 left-4 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400 font-semibold uppercase">
            04 // Storage &amp; Purge
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold text-white">Neon DB &amp; BullMQ</div>
            <div className="text-[11px] text-zinc-400 mt-1">Bytea Snapshots &amp; Cron</div>
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
              Persists binary CRDT snapshots to PostgreSQL. BullMQ compaction workers atomically purge ephemeral workspaces at <strong className="text-zinc-200">00:00 IST</strong>.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[10px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="text-zinc-300">PostgreSQL bytea</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Reset:</span>
              <span className="text-emerald-400">00:00 IST (Cron)</span>
            </div>
            <div className="flex justify-between">
              <span>Compaction:</span>
              <span className="text-zinc-300">100 Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directional Flow Connectors (Bottom Legend) */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-emerald-400 font-bold">&larr;&rarr;</span>
          <span>Bidirectional Binary Stream: Client &harr; WebSocket Cluster &harr; Redis &harr; Neon DB</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>End-to-End Latency: &lt; 10ms</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>CRDT Convergence: 100% Deterministic</span>
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  status: "typing" | "idle" | "viewing";
  file: string;
  cursorLine: number;
}

const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: "usr_priya",
    name: "Priya K.",
    color: "#10b981", // emerald
    avatar: "PK",
    status: "typing",
    file: "index.js",
    cursorLine: 7,
  },
  {
    id: "usr_alex",
    name: "Alex M.",
    color: "#f59e0b", // amber
    avatar: "AM",
    status: "idle",
    file: "calculator.js",
    cursorLine: 4,
  },
  {
    id: "usr_you",
    name: "You",
    color: "#38bdf8", // sky
    avatar: "SS",
    status: "idle",
    file: "index.js",
    cursorLine: 11,
  },
];

const CODE_FILES: Record<string, string[]> = {
  "index.js": [
    "// Collaborative Room: room-gbub50",
    "// Ephemeral workspace • Synchronized via Yjs CRDTs",
    "import { calculateTotal } from './calculator.js';",
    "",
    "export function checkoutCart(items, user) {",
    "  const subtotal = calculateTotal(items);",
    "  const taxRate = 0.08;",
    "  const finalAmount = subtotal * (1 + taxRate);",
    "",
    "  return {",
    "    userId: user.id,",
    "    amount: Math.round(finalAmount * 100) / 100,",
    "    timestamp: Date.now(),",
    "  };",
    "}",
  ],
  "calculator.js": [
    "// Real-time utility module",
    "export function calculateTotal(items = []) {",
    "  return items.reduce((accumulator, item) => {",
    "    const price = Number(item.price) || 0;",
    "    const quantity = Number(item.qty) || 1;",
    "    return accumulator + (price * quantity);",
    "  }, 0);",
    "}",
  ],
  "config.js": [
    "// Room runtime configuration",
    "export const roomConfig = {",
    "  syncIntervalMs: 8,",
    "  crdtEngine: 'Yjs-v13',",
    "  dailyResetIST: '00:00',",
    "  ephemeral: true,",
    "};",
  ],
};

export function MultiplayerHeroPreview() {
  const [activeFile, setActiveFile] = useState<string>("index.js");
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [isTypingSimulated, setIsTypingSimulated] = useState<boolean>(true);
  const [typedChars, setTypedChars] = useState<number>(0);

  // Simulated peer typing effect for Priya
  useEffect(() => {
    if (!isTypingSimulated) return;

    const interval = setInterval(() => {
      setTypedChars((prev) => (prev + 1) % 18);
    }, 280);

    return () => clearInterval(interval);
  }, [isTypingSimulated]);

  const activeLines = CODE_FILES[activeFile] || CODE_FILES["index.js"];

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Chrome Window Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 flex items-center justify-between select-none">
        {/* Left: Window Controls + Room ID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[11px] font-sans text-zinc-500">Room:</span>
            <span className="text-zinc-200 font-mono text-xs font-semibold">room-preview</span>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 rounded">
              copy
            </span>
          </div>
        </div>

        {/* Center: Live Sync Status */}
        <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-[11px]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-medium">Connected</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-500">6ms sync latency</span>
        </div>

        {/* Right: Presence Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950"
                style={{ backgroundColor: c.color }}
                title={`${c.name} (${c.status})`}
              >
                {c.avatar}
                {c.status === "typing" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-zinc-950" />
                )}
              </div>
            ))}
          </div>

          <span className="text-[11px] font-sans text-zinc-400 hidden md:inline ml-1">
            3 collaborating
          </span>
        </div>
      </div>

      {/* Editor Body: Sidebar + Code Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-zinc-950">
        {/* Left Sidebar: File Tree */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/30 p-3 select-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold font-sans">
                Room Files
              </span>
              <span className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer">
                + New .js
              </span>
            </div>

            <div className="space-y-1">
              {Object.keys(CODE_FILES).map((file) => {
                const isActive = activeFile === file;
                const peerInFile = collaborators.find((c) => c.file === file);

                return (
                  <button
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors text-xs ${
                      isActive
                        ? "bg-zinc-800/90 text-white font-medium"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-[11px] font-bold">JS</span>
                      <span>{file}</span>
                    </div>

                    {peerInFile && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: peerInFile.color }}
                        title={`${peerInFile.name} is in this file`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer: Ephemeral Info */}
          <div className="pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-sans leading-tight">
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Resets 00:00 IST</span>
            </div>
            <p className="mt-1">Zero-auth ephemeral playground</p>
          </div>
        </div>

        {/* Right Editor Area */}
        <div className="md:col-span-9 p-4 relative overflow-x-auto bg-zinc-950">
          {/* Active File Tab Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60 select-none">
            <div className="flex items-center gap-2 text-zinc-300 text-xs">
              <span className="font-semibold text-white">{activeFile}</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-500">JavaScript</span>
            </div>

            {/* Live Typing Status Banner */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTypingSimulated(!isTypingSimulated)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded transition-colors"
              >
                {isTypingSimulated ? "Pause Simulated Peer" : "Simulate Peer Typing"}
              </button>
            </div>
          </div>

          {/* Code Lines with Multiplayer Cursors */}
          <div className="relative font-mono text-[13px] leading-relaxed text-zinc-300">
            {activeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const hasPriya = activeFile === "index.js" && lineNum === 7;
              const hasAlex = activeFile === "calculator.js" && lineNum === 3;
              const hasYou = activeFile === "index.js" && lineNum === 11;

              return (
                <div key={idx} className="relative flex items-start group">
                  {/* Line Number */}
                  <span className="w-8 shrink-0 text-right pr-4 text-zinc-600 select-none text-xs">
                    {lineNum}
                  </span>

                  {/* Line Content */}
                  <div className="flex-1 whitespace-pre relative">
                    {/* Render line with simulated edits or standard code */}
                    {hasPriya ? (
                      <span>
                        <span className="text-zinc-300">  const taxRate = 0.08;</span>
                        <span className="text-emerald-400 ml-2">
                          {"// [Priya synced live]".slice(0, typedChars)}
                        </span>
                      </span>
                    ) : (
                      <span>{line}</span>
                    )}

                    {/* Multiplayer Cursor: Priya (Emerald) with Live Typing Badge */}
                    {hasPriya && (
                      <div className="inline-flex items-center ml-1 relative">
                        {/* Cursor Head Line */}
                        <span className="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse" />

                        {/* Liveblocks-Style Cursor Tag */}
                        <div className="absolute -top-6 left-0.5 z-20 flex items-center gap-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-md whitespace-nowrap">
                          <span>Priya K.</span>
                          <span className="opacity-90 font-mono text-[9px]">typing... ✎</span>
                        </div>
                      </div>
                    )}

                    {/* Multiplayer Cursor: Alex (Amber) */}
                    {hasAlex && (
                      <div className="inline-flex items-center ml-2 relative">
                        <span className="inline-block w-0.5 h-4 bg-amber-500" />
                        <div className="absolute -top-5 left-0.5 z-20 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-md">
                          Alex M.
                        </div>
                      </div>
                    )}

                    {/* Multiplayer Cursor: You (Sky) */}
                    {hasYou && (
                      <div className="inline-flex items-center ml-1 relative">
                        <span className="inline-block w-0.5 h-4 bg-sky-500" />
                        <div className="absolute -top-5 left-0.5 z-20 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-md">
                          You
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor Footer / Telemetry Bar */}
      <div className="border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-500 select-none">
        <div className="flex items-center gap-3">
          <span>CRDT Engine: Yjs v13</span>
          <span className="text-zinc-700">&bull;</span>
          <span>Binary lib0 encoding</span>
          <span className="text-zinc-700">&bull;</span>
          <span>WebSocket Sync: Port 4000</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span>UTF-8</span>
          <span className="text-zinc-700">&bull;</span>
          <span>JavaScript</span>
        </div>
      </div>
    </div>
  );
}

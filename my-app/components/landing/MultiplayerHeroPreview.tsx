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

interface CodeLineToken {
  type: "keyword" | "function" | "string" | "number" | "comment" | "plain" | "operator";
  text: string;
}

const FILE_TOKENS: Record<string, CodeLineToken[][]> = {
  "index.js": [
    [{ type: "comment", text: "// Collaborative Room: room-gbub50" }],
    [{ type: "comment", text: "// Ephemeral workspace • Synchronized via Yjs CRDTs" }],
    [
      { type: "keyword", text: "import" },
      { type: "plain", text: " { " },
      { type: "function", text: "calculateTotal" },
      { type: "plain", text: " } " },
      { type: "keyword", text: "from" },
      { type: "plain", text: " " },
      { type: "string", text: "'./calculator.js'" },
      { type: "plain", text: ";" },
    ],
    [{ type: "plain", text: "" }],
    [
      { type: "keyword", text: "export function" },
      { type: "plain", text: " " },
      { type: "function", text: "checkoutCart" },
      { type: "plain", text: "(items, user) {" },
    ],
    [
      { type: "plain", text: "  " },
      { type: "keyword", text: "const" },
      { type: "plain", text: " subtotal = " },
      { type: "function", text: "calculateTotal" },
      { type: "plain", text: "(items);" },
    ],
    [
      { type: "plain", text: "  " },
      { type: "keyword", text: "const" },
      { type: "plain", text: " taxRate = " },
      { type: "number", text: "0.08" },
      { type: "plain", text: ";" },
    ],
    [
      { type: "plain", text: "  " },
      { type: "keyword", text: "const" },
      { type: "plain", text: " finalAmount = subtotal * (" },
      { type: "number", text: "1" },
      { type: "plain", text: " + taxRate);" },
    ],
    [{ type: "plain", text: "" }],
    [
      { type: "plain", text: "  " },
      { type: "keyword", text: "return" },
      { type: "plain", text: " {" },
    ],
    [
      { type: "plain", text: "    userId: user." },
      { type: "function", text: "id" },
      { type: "plain", text: "," },
    ],
    [
      { type: "plain", text: "    amount: Math." },
      { type: "function", text: "round" },
      { type: "plain", text: "(finalAmount * " },
      { type: "number", text: "100" },
      { type: "plain", text: ") / " },
      { type: "number", text: "100" },
      { type: "plain", text: "," },
    ],
    [
      { type: "plain", text: "    timestamp: Date." },
      { type: "function", text: "now" },
      { type: "plain", text: "()," },
    ],
    [{ type: "plain", text: "  };" }],
    [{ type: "plain", text: "}" }],
  ],
  "calculator.js": [
    [{ type: "comment", text: "// Real-time calculation utility module" }],
    [
      { type: "keyword", text: "export function" },
      { type: "plain", text: " " },
      { type: "function", text: "calculateTotal" },
      { type: "plain", text: "(items = []) {" },
    ],
    [
      { type: "plain", text: "  " },
      { type: "keyword", text: "return" },
      { type: "plain", text: " items." },
      { type: "function", text: "reduce" },
      { type: "plain", text: "((accumulator, item) => {" },
    ],
    [
      { type: "plain", text: "    " },
      { type: "keyword", text: "const" },
      { type: "plain", text: " price = " },
      { type: "function", text: "Number" },
      { type: "plain", text: "(item.price) || " },
      { type: "number", text: "0" },
      { type: "plain", text: ";" },
    ],
    [
      { type: "plain", text: "    " },
      { type: "keyword", text: "const" },
      { type: "plain", text: " quantity = " },
      { type: "function", text: "Number" },
      { type: "plain", text: "(item.qty) || " },
      { type: "number", text: "1" },
      { type: "plain", text: ";" },
    ],
    [
      { type: "plain", text: "    " },
      { type: "keyword", text: "return" },
      { type: "plain", text: " accumulator + (price * quantity);" },
    ],
    [{ type: "plain", text: "  }, 0);" }],
    [{ type: "plain", text: "}" }],
  ],
  "config.js": [
    [{ type: "comment", text: "// Ephemeral room runtime settings" }],
    [
      { type: "keyword", text: "export const" },
      { type: "plain", text: " roomConfig = {" },
    ],
    [
      { type: "plain", text: "  syncEngine: " },
      { type: "string", text: "'Yjs-v13'" },
      { type: "plain", text: "," },
    ],
    [
      { type: "plain", text: "  transport: " },
      { type: "string", text: "'WebSocket-lib0'" },
      { type: "plain", text: "," },
    ],
    [
      { type: "plain", text: "  dailyResetIST: " },
      { type: "string", text: "'00:00 Asia/Kolkata'" },
      { type: "plain", text: "," },
    ],
    [
      { type: "plain", text: "  zeroAuth: " },
      { type: "keyword", text: "true" },
      { type: "plain", text: "," },
    ],
    [{ type: "plain", text: "};" }],
  ],
};

export function MultiplayerHeroPreview() {
  const [activeFile, setActiveFile] = useState<string>("index.js");
  const [collaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [isTypingSimulated, setIsTypingSimulated] = useState<boolean>(true);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Simulated peer typing effect for Priya
  useEffect(() => {
    if (!isTypingSimulated) return;

    const interval = setInterval(() => {
      setTypedChars((prev) => (prev + 1) % 24);
    }, 240);

    return () => clearInterval(interval);
  }, [isTypingSimulated]);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = FILE_TOKENS[activeFile] || FILE_TOKENS["index.js"];

  const renderToken = (token: CodeLineToken, i: number) => {
    switch (token.type) {
      case "keyword":
        return <span key={i} className="text-purple-400 font-medium">{token.text}</span>;
      case "function":
        return <span key={i} className="text-sky-300">{token.text}</span>;
      case "string":
        return <span key={i} className="text-emerald-300">{token.text}</span>;
      case "number":
        return <span key={i} className="text-amber-300">{token.text}</span>;
      case "comment":
        return <span key={i} className="text-zinc-500 italic">{token.text}</span>;
      default:
        return <span key={i} className="text-zinc-300">{token.text}</span>;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.1] bg-[#0c0c11] shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_50px_rgba(16,185,129,0.05)] overflow-hidden font-mono text-xs transition-all">
      {/* 1. Refined macOS Window Chrome Header */}
      <div className="border-b border-white/[0.08] bg-[#121218] px-4 py-3 flex items-center justify-between select-none">
        {/* Left: Window Controls + Room ID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>

          <div className="h-3.5 w-px bg-white/[0.1]" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-zinc-400">Room:</span>
            <span className="text-white font-mono text-xs font-semibold">room-preview</span>
            <button
              onClick={handleCopyLink}
              className="text-[10px] text-zinc-400 hover:text-white border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 rounded transition-colors"
            >
              {copied ? "Copied! ✓" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Center: Live Sync Telemetry Badge */}
        <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-[11px] bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">Connected</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-400">6ms round-trip</span>
        </div>

        {/* Right: Collaborator Presence Stack */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center -space-x-1.5">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-zinc-950 shadow-md ring-2 ring-[#121218]"
                style={{ backgroundColor: c.color }}
                title={`${c.name} (${c.status})`}
              >
                {c.avatar}
                {c.status === "typing" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-[#121218] animate-ping" />
                )}
              </div>
            ))}
          </div>

          <span className="text-[11px] font-sans text-zinc-400 hidden md:inline">
            3 collaborating
          </span>
        </div>
      </div>

      {/* 2. Main Work Area: Sidebar + Editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] bg-[#0c0c11]">
        {/* Left Sidebar: File Tree */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-white/[0.07] bg-[#0f0f15]/80 p-3.5 select-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold font-sans">
                Explorer
              </span>
              <span className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-sans">
                + New .js
              </span>
            </div>

            <div className="space-y-1">
              {Object.keys(FILE_TOKENS).map((file) => {
                const isActive = activeFile === file;
                const peersInFile = collaborators.filter((c) => c.file === file);

                return (
                  <button
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all text-xs ${
                      isActive
                        ? "bg-white/[0.08] text-white font-medium border border-white/[0.08]"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-[11px] font-bold">JS</span>
                      <span>{file}</span>
                    </div>

                    {peersInFile.length > 0 && (
                      <div className="flex items-center -space-x-1">
                        {peersInFile.map((p) => (
                          <span
                            key={p.id}
                            className="h-2 w-2 rounded-full ring-1 ring-zinc-950 inline-block"
                            style={{ backgroundColor: p.color }}
                            title={`${p.name} active here`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ephemeral Reset Notice in Sidebar */}
          <div className="pt-3 border-t border-white/[0.06] text-[10px] text-zinc-400 font-sans leading-relaxed">
            <div className="flex items-center gap-1.5 text-zinc-300 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Resets 00:00 IST</span>
            </div>
            <p className="mt-1 text-zinc-400">Ephemeral workspace with zero-auth login</p>
          </div>
        </div>

        {/* Right Editor Area */}
        <div className="md:col-span-9 p-4 lg:p-5 relative overflow-x-auto bg-[#0a0a0f]">
          {/* Active File Tab Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06] select-none">
            <div className="flex items-center gap-2 text-zinc-300 text-xs">
              <span className="font-semibold text-white font-sans">{activeFile}</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-400 text-[11px]">JavaScript (ES2024)</span>
            </div>

            {/* Simulated Peer Typing Controller */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTypingSimulated(!isTypingSimulated)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1 rounded transition-colors"
              >
                {isTypingSimulated ? "Pause Simulated Peer" : "Simulate Peer Typing"}
              </button>
            </div>
          </div>

          {/* Code Canvas with Live Multiplayer Cursors */}
          <div className="relative font-mono text-[13px] leading-relaxed text-zinc-300">
            {lines.map((tokenRow, idx) => {
              const lineNum = idx + 1;
              const hasPriya = activeFile === "index.js" && lineNum === 7;
              const hasAlex = activeFile === "calculator.js" && lineNum === 3;
              const hasYou = activeFile === "index.js" && lineNum === 11;

              return (
                <div key={idx} className="relative flex items-start group min-h-[22px]">
                  {/* Line Number */}
                  <span className="w-8 shrink-0 text-right pr-4 text-zinc-600 select-none text-xs font-mono">
                    {lineNum}
                  </span>

                  {/* Line Content */}
                  <div className="flex-1 whitespace-pre relative">
                    {tokenRow.map((token, tIdx) => renderToken(token, tIdx))}

                    {/* Dynamic Real-Time Keystroke Insertion Simulation for Priya */}
                    {hasPriya && (
                      <span className="text-emerald-400 font-semibold ml-2">
                        {" // [synced via CRDT]".slice(0, typedChars)}
                      </span>
                    )}

                    {/* Multiplayer Cursor 1: Priya K. (Emerald) with Live Typing Tag */}
                    {hasPriya && (
                      <div className="inline-flex items-center ml-1 relative">
                        {/* Cursor Head Line */}
                        <span className="inline-block w-0.5 h-4 bg-emerald-400 animate-pulse" />

                        {/* Liveblocks-Style Cursor Tag */}
                        <div className="absolute -top-7 left-0.5 z-20 flex items-center gap-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-lg whitespace-nowrap">
                          <span>Priya K.</span>
                          <span className="opacity-90 font-mono text-[9px] bg-emerald-600/40 px-1 rounded">
                            typing... ✎
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Multiplayer Cursor 2: Alex M. (Amber) with Active Selection Highlight */}
                    {hasAlex && (
                      <div className="inline-flex items-center ml-2 relative">
                        <span className="inline-block w-0.5 h-4 bg-amber-400" />
                        <div className="absolute -top-6 left-0.5 z-20 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-md">
                          Alex M.
                        </div>
                      </div>
                    )}

                    {/* Multiplayer Cursor 3: You (Sky) */}
                    {hasYou && (
                      <div className="inline-flex items-center ml-1 relative">
                        <span className="inline-block w-0.5 h-4 bg-sky-400" />
                        <div className="absolute -top-6 left-0.5 z-20 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-950 shadow-md">
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

      {/* 3. Editor Telemetry Status Footer */}
      <div className="border-t border-white/[0.08] bg-[#121218] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 select-none gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>CRDT: Yjs v13.6</span>
          </span>
          <span className="text-zinc-600">&bull;</span>
          <span>Binary lib0 Encoded</span>
          <span className="text-zinc-600">&bull;</span>
          <span>Port 4000 Active</span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          <span>Ln 7, Col 32</span>
          <span className="text-zinc-600">&bull;</span>
          <span>UTF-8</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-emerald-400">Synced</span>
        </div>
      </div>
    </div>
  );
}

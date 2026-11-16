"use client";

import React, { useState } from "react";

export function CrdtMergeDemo() {
  const [step, setStep] = useState<number>(0);

  const baselineCode = [
    "function handleSession(request) {",
    "  const session = verifyToken(request);",
    "  return session.user;",
    "}",
  ];

  return (
    <div className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c11] p-5 lg:p-6 font-mono text-xs shadow-xl select-none">
      {/* Top Header & Stepper Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Mathematical CRDT Verification
            </span>
          </div>
          <div className="text-sm font-semibold text-white font-sans mt-0.5">
            Concurrent Keystroke Convergence Engine
          </div>
        </div>

        {/* Interactive Step Switcher */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-lg border border-white/[0.07] self-start sm:self-auto">
          <button
            onClick={() => setStep(0)}
            className={`px-2.5 py-1 rounded text-[11px] transition-all font-sans font-medium ${
              step === 0
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            1. Concurrent Edits
          </button>
          <button
            onClick={() => setStep(1)}
            className={`px-2.5 py-1 rounded text-[11px] transition-all font-sans font-medium ${
              step === 1
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            2. Binary Exchange
          </button>
          <button
            onClick={() => setStep(2)}
            className={`px-2.5 py-1 rounded text-[11px] transition-all font-sans font-medium ${
              step === 2
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            3. Converged State
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peer A Column */}
        <div className="rounded-lg border border-white/[0.06] bg-[#111116] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-white font-medium font-sans text-xs">Peer A (Priya)</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                Clock: {step === 0 ? "[A: 1, B: 0]" : "[A: 1, B: 1]"}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 mb-2">
              Action: {step === 0 ? (
                <span className="text-emerald-400 font-semibold">Prepend imports at index 0</span>
              ) : (
                <span className="text-zinc-300">Synchronized via lib0 update</span>
              )}
            </div>

            <div className="bg-[#08080b] rounded p-3 text-[12px] leading-relaxed text-zinc-300 font-mono overflow-x-auto border border-white/[0.04]">
              {step >= 0 && (
                <div className="text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.5 rounded -mx-1 mb-1">
                  + import &#123; verifyToken &#125; from &apos;./auth.js&apos;;
                </div>
              )}
              {baselineCode.map((line, i) => (
                <div key={i} className="text-zinc-400">{line}</div>
              ))}
              {step === 2 && (
                <div className="text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.5 rounded -mx-1 mt-1">
                  + export default handleSession;
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500">
            <span>Local Execution: 0ms</span>
            <span className="text-emerald-400">Lock-Free</span>
          </div>
        </div>

        {/* Peer B Column */}
        <div className="rounded-lg border border-white/[0.06] bg-[#111116] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-white font-medium font-sans text-xs">Peer B (Alex)</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                Clock: {step === 0 ? "[A: 0, B: 1]" : "[A: 1, B: 1]"}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 mb-2">
              Action: {step === 0 ? (
                <span className="text-amber-400 font-semibold">Append export at end of file</span>
              ) : (
                <span className="text-zinc-300">Synchronized via lib0 update</span>
              )}
            </div>

            <div className="bg-[#08080b] rounded p-3 text-[12px] leading-relaxed text-zinc-300 font-mono overflow-x-auto border border-white/[0.04]">
              {step === 2 && (
                <div className="text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.5 rounded -mx-1 mb-1">
                  + import &#123; verifyToken &#125; from &apos;./auth.js&apos;;
                </div>
              )}
              {baselineCode.map((line, i) => (
                <div key={i} className="text-zinc-400">{line}</div>
              ))}
              {step >= 0 && (
                <div className="text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.5 rounded -mx-1 mt-1">
                  + export default handleSession;
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500">
            <span>Local Execution: 0ms</span>
            <span className="text-emerald-400">Lock-Free</span>
          </div>
        </div>
      </div>

      {/* Convergence Banner */}
      <div className="mt-4 rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-zinc-300 font-medium">
            {step === 2
              ? "Convergence Complete: Both peers share identical byte-for-byte CRDT document trees."
              : step === 1
              ? "Exchanging state vector delta: lib0 encoding packs differential updates into compact binary packets."
              : "Concurrent modifications without server locks: both peers apply edits instantly."}
          </span>
        </div>

        <button
          onClick={() => setStep((prev) => (prev + 1) % 3)}
          className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold text-right"
        >
          {step === 2 ? "Restart Demo ↺" : "Next Step →"}
        </button>
      </div>
    </div>
  );
}


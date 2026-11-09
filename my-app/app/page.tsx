"use client";

import dynamic from "next/dynamic";

/**
 * Main Page Entrypoint
 *
 * Dynamically imports CodeEditor with SSR disabled.
 * This guarantees Monaco Editor and browser DOM dependencies are strictly loaded
 * on the client side, avoiding any Next.js 16 hydration mismatches.
 */
const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#1e1e1e] text-gray-400 font-mono text-sm">
      Loading Collaborative Editor...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <CodeEditor />
    </main>
  );
}

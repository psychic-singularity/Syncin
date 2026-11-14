import Link from "next/link";
import { MultiplayerHeroPreview } from "@/components/landing/MultiplayerHeroPreview";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Liveblocks-Style Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-mono text-emerald-400 font-bold text-base group-hover:text-emerald-300 transition-colors">
              &lt;/&gt;
            </span>
            <span className="font-semibold text-sm tracking-tight text-white font-sans">
              CodeRoom
            </span>
            <span className="hidden sm:inline-flex rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              Yjs + Monaco
            </span>
          </Link>

          {/* Quick Anchor Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs text-zinc-400 font-medium">
            <a href="#features" className="hover:text-zinc-200 transition-colors">
              Features
            </a>
            <a href="#multiplayer" className="hover:text-zinc-200 transition-colors">
              Multiplayer Preview
            </a>
            <a href="#architecture" className="hover:text-zinc-200 transition-colors">
              Architecture
            </a>
            <a href="#schedule" className="hover:text-zinc-200 transition-colors">
              Daily Reset (IST)
            </a>
          </nav>
        </div>

        {/* Top-Right "Use the website" Button (Explicit User Requirement) */}
        <div className="flex items-center gap-3">
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center rounded bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-sm"
          >
            Use the website &rarr;
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative px-6 pt-16 pb-12 max-w-6xl w-full mx-auto flex flex-col items-center text-center">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1 text-xs font-mono text-zinc-400 mb-8 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300">Live Collaborative CRDT Engine</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-500">Auto-Purge 00:00 IST</span>
          </div>

          {/* Hero Typography */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-[1.12]">
            Real-time collaborative code editing.
          </h1>
          <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Create or join ephemeral JavaScript workspaces powered by Yjs CRDTs and Monaco. Track live peer cursors, broadcast typing badges, and manage multiple files with zero logins, zero accounts, and automated daily midnight resets.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-sm"
            >
              Use the website &rarr;
            </Link>
            <a
              href="#multiplayer"
              className="inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Multiplayer Demo &darr;
            </a>
          </div>

          {/* Technical Specs Ticker */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-500">
            <span>&bull; Sub-10ms CRDT Sync</span>
            <span>&bull; In-Tree Monaco Binding</span>
            <span>&bull; Horizontal Redis Pub/Sub</span>
            <span>&bull; Neon PostgreSQL Persistence</span>
          </div>

          {/* Interactive Live Hero Canvas (Signature Liveblocks Showcase) */}
          <div id="multiplayer" className="mt-14 w-full scroll-mt-24">
            <MultiplayerHeroPreview />
          </div>
        </section>

        {/* 3. Liveblocks-Style Bento Grid (Features & Technical Capabilities) */}
        <section id="features" className="border-t border-zinc-800/80 bg-zinc-900/20 px-6 py-20 scroll-mt-20">
          <div className="max-w-6xl w-full mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Multiplayer Primitives
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Engineered for instantaneous collaboration.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Every component is built for deterministic convergence, real-time presence awareness, and frictionless zero-auth workflows.
              </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Conflict-Free CRDTs (Span 2 cols on medium+) */}
              <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>01 // CONFLICT-FREE REPLICATION</span>
                    <span className="text-zinc-500">lib0 binary sync</span>
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-semibold text-white">
                    Deterministic Keystroke Convergence
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Powered by Yjs mathematical CRDTs. Keystrokes execute locally with 0ms optimistic latency, while differential state vectors synchronize deterministically across peers. No merge conflicts, no lockups, and no lost work.
                  </p>
                </div>

                {/* Visual CRDT Demonstration Box */}
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 select-none">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3 text-[11px] text-zinc-500">
                    <span>CONCURRENT EDIT MERGE</span>
                    <span className="text-emerald-400">STATE: CONVERGED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[12px]">
                    <div className="border-r border-zinc-800/80 pr-3">
                      <span className="text-emerald-400 font-medium">Peer A (Priya):</span>
                      <p className="text-zinc-400 mt-1 font-mono">insert(&apos;export const app = &apos;)</p>
                      <span className="inline-block mt-2 text-[10px] text-zinc-500">Vector clock: [0, 4]</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-medium">Peer B (Alex):</span>
                      <p className="text-zinc-400 mt-1 font-mono">insert(&apos;createApp();&apos;)</p>
                      <span className="inline-block mt-2 text-[10px] text-zinc-500">Vector clock: [1, 2]</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>Result: <code className="text-white font-mono bg-zinc-900 px-1 py-0.5 rounded">&apos;export const app = createApp();&apos;</code></span>
                    <span className="text-emerald-400 text-[10px]">Deterministic across all clients</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Live Typing & Cursor Presence */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>02 // PRESENCE ENGINE</span>
                    <span className="text-zinc-500">Y.Awareness</span>
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-semibold text-white">
                    Live Typing Cursors
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Collaborators see exact cursor positions, line numbers, and custom display names. When typing, dynamic badges display <code className="text-emerald-400">[Name is typing... ✎]</code> directly at the cursor head.
                  </p>
                </div>

                {/* Visual Cursor Preview */}
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono select-none">
                  <div className="text-[11px] text-zinc-500 mb-2">AWARENESS BROADCAST</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-zinc-200">Priya K.</span>
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-[10px]">
                        typing... ✎
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-zinc-200">Alex M.</span>
                      <span className="text-zinc-500 text-[10px]">active in calculator.js</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Multi-File JS Playgrounds */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>03 // WORKSPACES</span>
                    <span className="text-zinc-500">Shared Map</span>
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-semibold text-white">
                    Multi-File Projects
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Create, rename, and manage multiple JavaScript modules per room. All files are synchronized inside a single authoritative CRDT document tree.
                  </p>
                </div>

                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 space-y-1.5 select-none">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-white">
                      <span className="text-amber-400 font-bold">JS</span> index.js
                    </span>
                    <span className="text-[10px] text-emerald-400">2 peers</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="text-amber-400 font-bold">JS</span> calculator.js
                    </span>
                    <span className="text-[10px] text-amber-400">1 peer</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="text-amber-400 font-bold">JS</span> config.js
                    </span>
                    <span className="text-[10px] text-zinc-600">idle</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Daily Midnight Reset (Span 2 cols on medium+) */}
              <div id="schedule" className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors scroll-mt-24">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>04 // EPHEMERAL PURGE</span>
                    <span className="text-zinc-500">00:00 Asia/Kolkata</span>
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-semibold text-white">
                    Automated Daily Reset at Midnight IST
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Zero authentication friction: users pick their display name and start editing instantly. To maintain clean ephemeral state and high performance, BullMQ cron workers purge room updates and documents every day at 00:00 IST.
                  </p>
                </div>

                {/* Visual Reset Schedule Banner */}
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                  <div>
                    <div className="text-[11px] text-zinc-500">CRON PATTERN</div>
                    <div className="text-sm font-semibold text-white mt-0.5">0 0 * * * (Asia/Kolkata)</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Atomic transaction purge via Prisma &amp; Neon DB</div>
                  </div>

                  <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 rounded px-3 py-1.5 text-emerald-400 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Purge Worker Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Architecture Deep Dive (Liveblocks-Style Specification) */}
        <section id="architecture" className="border-t border-zinc-800/80 px-6 py-20 scroll-mt-20">
          <div className="max-w-6xl w-full mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Under the Hood
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Enterprise real-time infrastructure.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                A decoupled, horizontally scalable architecture engineered for high-concurrency code editing.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 mb-12 font-mono text-xs">
              <div className="text-zinc-500 text-[11px] mb-4 uppercase tracking-wider">
                Multiplayer Data Flow
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded">
                  <div className="text-emerald-400 font-semibold">Monaco Client</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Y.Doc + MonacoBinding</div>
                  <div className="text-[9px] text-zinc-600 mt-1">0ms local keystroke</div>
                </div>

                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded">
                  <div className="text-emerald-400 font-semibold">WebSocket Nodes</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Standalone Port 4000</div>
                  <div className="text-[9px] text-zinc-600 mt-1">Binary lib0 encoding</div>
                </div>

                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded">
                  <div className="text-emerald-400 font-semibold">Redis Pub/Sub</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Horizontal Cluster</div>
                  <div className="text-[9px] text-zinc-600 mt-1">Loopback suppression</div>
                </div>

                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded">
                  <div className="text-emerald-400 font-semibold">Neon PostgreSQL</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Binary Bytea Snapshots</div>
                  <div className="text-[9px] text-zinc-600 mt-1">BullMQ compaction</div>
                </div>
              </div>
            </div>

            {/* Architecture Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[11px]">
                  <tr>
                    <th className="p-3.5 pl-5 font-medium">DIMENSION</th>
                    <th className="p-3.5 font-medium text-emerald-400">CODEROOM (YJS CRDT)</th>
                    <th className="p-3.5 font-medium text-zinc-500">TRADITIONAL WS / REST</th>
                    <th className="p-3.5 font-medium text-zinc-500 pr-5">OPERATIONAL TRANSFORM (OT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300 text-[11px]">
                  <tr>
                    <td className="p-3.5 pl-5 font-semibold text-white font-sans">Conflict Resolution</td>
                    <td className="p-3.5 text-emerald-400">Deterministic mathematical merge</td>
                    <td className="p-3.5 text-zinc-500">Last-write-wins (data loss)</td>
                    <td className="p-3.5 text-zinc-400 pr-5">Complex centralized transform</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-semibold text-white font-sans">Local Keystroke Latency</td>
                    <td className="p-3.5 text-emerald-400">&lt; 1ms (Optimistic execution)</td>
                    <td className="p-3.5 text-zinc-500">Round-trip bound (50-200ms)</td>
                    <td className="p-3.5 text-zinc-400 pr-5">Server ACK queue required</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-semibold text-white font-sans">Offline Resiliency</td>
                    <td className="p-3.5 text-emerald-400">Buffers updates, auto-converges</td>
                    <td className="p-3.5 text-zinc-500">Connection drop = lost edits</td>
                    <td className="p-3.5 text-zinc-400 pr-5">Buffer limits, merge friction</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-semibold text-white font-sans">Horizontal Scaling</td>
                    <td className="p-3.5 text-emerald-400">Stateless nodes + Redis Pub/Sub</td>
                    <td className="p-3.5 text-zinc-500">Sticky sessions / single node</td>
                    <td className="p-3.5 text-zinc-400 pr-5">Single coordinator bottleneck</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. Bottom "Use the website" CTA Section (Explicit User Requirement) */}
        <section className="border-t border-zinc-800 bg-zinc-900/30 px-6 py-20">
          <div className="max-w-4xl w-full mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-8 sm:p-12 text-center flex flex-col items-center">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Instant Collaboration
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Start collaborating now.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
              No account creation. No password hurdles. Pick your display name, create a room or join existing colleagues, and start coding in seconds.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center rounded bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-sm"
              >
                Use the website &rarr;
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
              <span>&bull; Ephemeral JavaScript rooms</span>
              <span>&bull; Resets daily at 00:00 IST</span>
              <span>&bull; Zero auth friction</span>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Clean Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 px-6 py-8">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">&lt;/&gt;</span>
            <span className="text-zinc-300 font-semibold font-sans">CodeRoom</span>
            <span>&bull; Real-time multiplayer CRDT workspace</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/rooms" className="hover:text-zinc-300 transition-colors">
              Rooms Portal
            </Link>
            <a href="#features" className="hover:text-zinc-300 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-zinc-300 transition-colors">
              Architecture
            </a>
            <span className="text-emerald-400">&bull; Port 4000 Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { MultiplayerHeroPreview } from "@/components/landing/MultiplayerHeroPreview";
import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";
import { CrdtMergeDemo } from "@/components/landing/CrdtMergeDemo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-x-hidden">
      {/* Ambient Top Lighting Gradient (Linear/Raycast style) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] hero-glow pointer-events-none -z-10" />

      {/* 1. Refined Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#09090b]/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-8">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15 transition-all shadow-sm">
              <span className="font-mono text-xs font-bold">&lt;/&gt;</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white font-sans">
              CodeRoom
            </span>
            <span className="hidden sm:inline-flex rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              Yjs + Monaco
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#interactive-preview" className="hover:text-white transition-colors">
              Interactive Preview
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Comparison
            </a>
            <a href="#schedule" className="hover:text-white transition-colors">
              Daily Reset (IST)
            </a>
          </nav>
        </div>

        {/* Top-Right CTA (Explicit User Requirement) */}
        <div className="flex items-center gap-3">
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 active:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Use the website &rarr;
          </Link>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 pt-16 pb-12 max-w-6xl w-full mx-auto flex flex-col items-center text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-mono text-zinc-400 mb-6 shadow-sm hover:border-white/[0.14] transition-colors">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-200">Ephemeral Collaborative Workspaces</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400">Auto-Purge 00:00 IST</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-[1.12]">
            The real-time code editor engineered for teams.
          </h1>

          {/* Value Proposition */}
          <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Spin up instant multi-file JavaScript rooms powered by Yjs CRDTs and Monaco. Track live peer cursors, see typing status in real time, and collaborate with zero logins, zero accounts, and automated daily midnight resets.
          </p>

          {/* Dual Call-to-Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 active:bg-emerald-600 transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)]"
            >
              Use the website &rarr;
            </Link>
            <a
              href="#interactive-preview"
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              Explore Interactive Demo &darr;
            </a>
          </div>

          {/* Technical Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-400">
            <span>&bull; Sub-10ms Keystroke Latency</span>
            <span>&bull; Deterministic CRDT Convergence</span>
            <span>&bull; Zero-Auth Ephemeral Rooms</span>
            <span>&bull; Neon DB + Redis Backplane</span>
          </div>

          {/* Interactive Hero Product Preview (Centerpiece) */}
          <div id="interactive-preview" className="mt-12 w-full scroll-mt-24">
            <MultiplayerHeroPreview />
          </div>
        </section>

        {/* 3. Features Section (Asymmetrical Bento Grid) */}
        <section id="features" className="border-t border-white/[0.07] bg-[#0c0c11]/60 px-6 py-20 scroll-mt-20 relative">
          <div className="max-w-6xl w-full mx-auto">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Multiplayer Primitives
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
                Engineered for instantaneous collaboration.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Every component is built for deterministic convergence, real-time presence awareness, and frictionless zero-auth workflows.
              </p>
            </div>

            {/* Asymmetrical Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Conflict-Free CRDTs (Span 2 cols on medium+) */}
              <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 lg:p-7 flex flex-col justify-between hover:border-white/[0.14] transition-colors relative overflow-hidden shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>01 // CONFLICT-FREE REPLICATION</span>
                    <span className="text-zinc-500 font-normal">lib0 binary sync</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white font-sans">
                    Deterministic Keystroke Convergence
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Powered by Yjs mathematical CRDTs. Keystrokes execute locally with 0ms optimistic latency, while differential state vectors synchronize deterministically across peers. No merge conflicts, no centralized lockups, and no lost work.
                  </p>
                </div>

                {/* Interactive CRDT Convergence Demonstration */}
                <div className="mt-6">
                  <CrdtMergeDemo />
                </div>
              </div>

              {/* Card 2: Live Typing & Cursor Presence (1 col) */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 lg:p-7 flex flex-col justify-between hover:border-white/[0.14] transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>02 // PRESENCE ENGINE</span>
                    <span className="text-zinc-500 font-normal">Y.Awareness</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white font-sans">
                    Live Typing Cursors
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Collaborators see exact cursor positions, line numbers, and custom display names. When typing, dynamic badges display <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-mono text-[11px]">[Name is typing... ✎]</code> directly at the cursor head.
                  </p>
                </div>

                {/* Visual Cursor Simulation */}
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#08080c] p-4 font-mono select-none">
                  <div className="text-[10px] text-zinc-500 mb-3 uppercase tracking-wider">
                    Awareness Telemetry
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-white font-sans font-medium">Priya K.</span>
                      </div>
                      <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono">
                        typing... ✎
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-xs text-white font-sans font-medium">Alex M.</span>
                      </div>
                      <span className="text-zinc-400 text-[10px] font-mono">
                        Line 4, Col 12
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Multi-File JS Playgrounds (1 col) */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 lg:p-7 flex flex-col justify-between hover:border-white/[0.14] transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>03 // WORKSPACES</span>
                    <span className="text-zinc-500 font-normal">Shared Y.Map</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white font-sans">
                    Multi-File Projects
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Create, rename, and manage multiple JavaScript modules per room. All files are synchronized inside a single authoritative CRDT document tree.
                  </p>
                </div>

                {/* Visual File Tree */}
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#08080c] p-3.5 font-mono text-xs text-zinc-300 space-y-2 select-none">
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-amber-400 font-bold text-[11px]">JS</span>
                      <span>index.js</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-sans">2 active peers</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="text-amber-400 font-bold text-[11px]">JS</span>
                      <span>calculator.js</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-sans">1 peer</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="text-amber-400 font-bold text-[11px]">JS</span>
                      <span>config.js</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-sans">idle</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Daily Midnight Reset (Span 2 cols on medium+) */}
              <div id="schedule" className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 lg:p-7 flex flex-col justify-between hover:border-white/[0.14] transition-colors scroll-mt-24 shadow-lg">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                    <span>04 // EPHEMERAL PURGE</span>
                    <span className="text-zinc-500 font-normal">00:00 Asia/Kolkata</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white font-sans">
                    Automated Daily Reset at Midnight IST
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Zero authentication friction: users pick their display name and start editing instantly. To maintain clean ephemeral state and high performance, BullMQ cron workers purge room updates and documents every day at 00:00 IST.
                  </p>
                </div>

                {/* Reset Schedule Banner */}
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#08080c] p-4 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Cron Schedule</div>
                    <div className="text-sm font-semibold text-white mt-0.5">0 0 * * * (Asia/Kolkata)</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Atomic transaction purge via Prisma &amp; Neon DB</div>
                  </div>

                  <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 rounded-lg px-3 py-1.5 text-emerald-400 text-xs self-start sm:self-auto font-sans font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Scheduled Worker Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Architecture Section */}
        <section id="architecture" className="border-t border-white/[0.07] px-6 py-20 scroll-mt-20">
          <div className="max-w-6xl w-full mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                System Topology
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
                Enterprise real-time infrastructure.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                A decoupled, horizontally scalable architecture engineered for high-concurrency code editing.
              </p>
            </div>

            {/* Architecture Diagram Component */}
            <ArchitectureDiagram />
          </div>
        </section>

        {/* 5. Architectural Comparison Section */}
        <section id="comparison" className="border-t border-white/[0.07] bg-[#0c0c11]/40 px-6 py-20 scroll-mt-20">
          <div className="max-w-6xl w-full mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Technical Benchmark
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
                How CodeRoom compares.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Architectural comparison between CRDTs, centralized operational transform, and traditional polling.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0c11] shadow-xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 text-[11px]">
                  <tr>
                    <th className="p-4 pl-6 font-medium">DIMENSION</th>
                    <th className="p-4 font-semibold text-emerald-400 bg-emerald-500/[0.04]">
                      CODEROOM (YJS CRDT)
                    </th>
                    <th className="p-4 font-medium text-zinc-500">TRADITIONAL WS / REST</th>
                    <th className="p-4 font-medium text-zinc-500 pr-6">OPERATIONAL TRANSFORM (OT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300 text-[11px]">
                  <tr>
                    <td className="p-4 pl-6 font-semibold text-white font-sans">Conflict Resolution</td>
                    <td className="p-4 text-emerald-400 bg-emerald-500/[0.03]">Deterministic mathematical merge</td>
                    <td className="p-4 text-zinc-500">Last-write-wins (data loss)</td>
                    <td className="p-4 text-zinc-400 pr-6">Complex centralized transform</td>
                  </tr>
                  <tr>
                    <td className="p-4 pl-6 font-semibold text-white font-sans">Local Keystroke Latency</td>
                    <td className="p-4 text-emerald-400 bg-emerald-500/[0.03]">&lt; 1ms (Optimistic execution)</td>
                    <td className="p-4 text-zinc-500">Round-trip bound (50-200ms)</td>
                    <td className="p-4 text-zinc-400 pr-6">Server ACK queue required</td>
                  </tr>
                  <tr>
                    <td className="p-4 pl-6 font-semibold text-white font-sans">Offline Resiliency</td>
                    <td className="p-4 text-emerald-400 bg-emerald-500/[0.03]">Buffers updates, auto-converges</td>
                    <td className="p-4 text-zinc-500">Connection drop = lost edits</td>
                    <td className="p-4 text-zinc-400 pr-6">Buffer limits, merge friction</td>
                  </tr>
                  <tr>
                    <td className="p-4 pl-6 font-semibold text-white font-sans">Network Protocol</td>
                    <td className="p-4 text-emerald-400 bg-emerald-500/[0.03]">Binary lib0 differential deltas</td>
                    <td className="p-4 text-zinc-500">Heavy JSON payloads</td>
                    <td className="p-4 text-zinc-400 pr-6">Serialized operation frames</td>
                  </tr>
                  <tr>
                    <td className="p-4 pl-6 font-semibold text-white font-sans">Horizontal Scaling</td>
                    <td className="p-4 text-emerald-400 bg-emerald-500/[0.03]">Stateless nodes + Redis Pub/Sub</td>
                    <td className="p-4 text-zinc-500">Sticky sessions / single node</td>
                    <td className="p-4 text-zinc-400 pr-6">Single coordinator bottleneck</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Final Call-to-Action Section (Explicit User Requirement) */}
        <section className="border-t border-white/[0.07] bg-[#0c0c11]/80 px-6 py-24 relative overflow-hidden">
          <div className="max-w-4xl w-full mx-auto rounded-3xl border border-white/[0.1] bg-[#0e0e14] p-8 sm:p-14 text-center flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute inset-0 hero-glow-card pointer-events-none" />

            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold relative z-10">
              Instant Collaboration
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white font-sans relative z-10">
              Build together in real time.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed relative z-10">
              No account creation. No password hurdles. Pick your display name, create a room or join existing colleagues, and start coding in seconds.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 relative z-10">
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 active:bg-emerald-600 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                Use the website &rarr;
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 relative z-10">
              <span>&bull; Ephemeral JavaScript rooms</span>
              <span>&bull; Resets daily at 00:00 IST</span>
              <span>&bull; Zero auth friction</span>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Refined Footer */}
      <footer className="border-t border-white/[0.07] bg-[#09090b] px-6 py-10">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
              &lt;/&gt;
            </div>
            <span className="text-white font-semibold font-sans">CodeRoom</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400">Enterprise CRDT Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <Link href="/rooms" className="hover:text-white transition-colors">
              Rooms Portal
            </Link>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Comparison
            </a>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Port 4000 Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

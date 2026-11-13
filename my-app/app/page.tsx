import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400 font-bold text-base">&lt;/&gt;</span>
          <span className="font-semibold text-sm tracking-tight text-white">CodeRoom</span>
        </div>

        {/* Top-Right "Use the website" Button */}
        <Link
          href="/rooms"
          className="inline-flex items-center justify-center rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          Use the website &rarr;
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col justify-center">
        {/* Daily Reset Notification Pill */}
        <div className="inline-flex items-center gap-2 self-start rounded border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-400 mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Automated Daily Reset at 00:00 IST</span>
        </div>

        {/* Hero Title & Direct Description */}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white max-w-2xl">
          Real-time collaborative code editor.
        </h1>
        <p className="mt-3 text-sm text-zinc-400 max-w-xl leading-relaxed">
          Create or join ephemeral JavaScript workspaces. Add multiple files, track live peer cursors with typing indicators, and collaborate simultaneously without accounts or login friction.
        </p>

        {/* Core Specs / Feature Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800 pt-8">
          <div className="border border-zinc-800 bg-zinc-900/50 p-4 rounded">
            <div className="font-mono text-xs text-emerald-400 font-medium">01 // MULTI-FILE</div>
            <div className="mt-2 text-sm font-medium text-white">JavaScript Workspaces</div>
            <div className="mt-1 text-xs text-zinc-400 leading-normal">
              Create and manage multiple .js files inside a shared room.
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 p-4 rounded">
            <div className="font-mono text-xs text-emerald-400 font-medium">02 // PRESENCE</div>
            <div className="mt-2 text-sm font-medium text-white">Live Typing Cursors</div>
            <div className="mt-1 text-xs text-zinc-400 leading-normal">
              Collaborator cursors display custom names and live typing status directly in the editor.
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 p-4 rounded">
            <div className="font-mono text-xs text-emerald-400 font-medium">03 // EPHEMERAL</div>
            <div className="mt-2 text-sm font-medium text-white">Midnight Reset (IST)</div>
            <div className="mt-1 text-xs text-zinc-400 leading-normal">
              Rooms and files automatically purge every day at 00:00 IST for a clean slate.
            </div>
          </div>
        </div>

        {/* Bottom "Use the website" CTA Button */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            No signup required &bull; Free & open collaboration
          </span>

          <Link
            href="/rooms"
            className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Use the website &rarr;
          </Link>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center font-mono text-[11px] text-zinc-600">
        CodeRoom &bull; Yjs CRDT + Monaco + Standalone WebSocket Sync
      </footer>
    </div>
  );
}

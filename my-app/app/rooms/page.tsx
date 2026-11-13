"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function generateRandomRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "room-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function RoomsPortalPage() {
  const router = useRouter();

  // User Name State
  const [name, setName] = useState("");
  const [createRoomName, setCreateRoomName] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("collab_user_name");
    if (savedName) {
      setName(savedName);
    }
    setCreateRoomName(generateRandomRoomId());
  }, []);

  const persistName = (): boolean => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErrorMessage("Please enter your name before continuing.");
      return false;
    }
    localStorage.setItem("collab_user_name", trimmed);
    sessionStorage.setItem("collab_session_user_name", trimmed);
    setErrorMessage(null);
    return true;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!persistName()) return;

    const targetRoom = createRoomName.trim() || generateRandomRoomId();
    router.push(`/room/${encodeURIComponent(targetRoom)}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!persistName()) return;

    const targetRoom = joinRoomCode.trim();
    if (targetRoom.length === 0) {
      setErrorMessage("Please enter a room code to join.");
      return;
    }
    router.push(`/room/${encodeURIComponent(targetRoom)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-emerald-400 font-bold text-base">&lt;/&gt;</span>
          <span className="font-semibold text-sm tracking-tight text-white">CodeRoom</span>
        </Link>

        <div className="font-mono text-xs text-zinc-500">
          <span>Resets Daily at 00:00 IST</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Reset Advisory Banner */}
        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300 font-mono mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Advisory: All room workspaces and files reset every day at midnight (00:00 IST).</span>
          </div>
        </div>

        {/* Global User Name Field */}
        <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4 mb-8">
          <label htmlFor="userNameInput" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Your Display Name
          </label>
          <input
            id="userNameInput"
            type="text"
            placeholder="e.g. Sanjay"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMessage(null);
            }}
            maxLength={24}
            className="w-full sm:w-80 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="block mt-1 text-[11px] text-zinc-500">
            This name is tagged on your cursor and visible to teammates in the room.
          </span>
          {errorMessage && (
            <div className="mt-2 text-xs text-red-400 font-mono">{errorMessage}</div>
          )}
        </div>

        {/* Two Options: Make Room vs Join Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Make Your Own Room */}
          <section className="rounded border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-emerald-400 font-semibold mb-1">
                OPTION 1
              </div>
              <h2 className="text-base font-semibold text-white">Make Your Own Room</h2>
              <p className="mt-1 text-xs text-zinc-400 leading-normal">
                Start a fresh collaborative workspace. Add multiple files and share the room link with your team.
              </p>

              <form onSubmit={handleCreateRoom} className="mt-5 space-y-3">
                <div>
                  <label htmlFor="createRoomInput" className="block text-xs font-medium text-zinc-300 mb-1">
                    Room Name / Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="createRoomInput"
                      type="text"
                      value={createRoomName}
                      onChange={(e) => setCreateRoomName(e.target.value)}
                      placeholder="e.g. room-alpha"
                      className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateRoomName(generateRandomRoomId())}
                      title="Generate new room code"
                      className="rounded border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      ↺
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                >
                  Create &amp; Enter Room &rarr;
                </button>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
              Auto-initializes with index.js
            </div>
          </section>

          {/* Card 2: Join an Existing Room */}
          <section className="rounded border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-emerald-400 font-semibold mb-1">
                OPTION 2
              </div>
              <h2 className="text-base font-semibold text-white">Join an Existing Room</h2>
              <p className="mt-1 text-xs text-zinc-400 leading-normal">
                Enter the room code shared by your peer to jump into their active JavaScript session.
              </p>

              <form onSubmit={handleJoinRoom} className="mt-5 space-y-3">
                <div>
                  <label htmlFor="joinRoomInput" className="block text-xs font-medium text-zinc-300 mb-1">
                    Room Code / ID
                  </label>
                  <input
                    id="joinRoomInput"
                    type="text"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value)}
                    placeholder="e.g. room-9d2a"
                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Join Room &rarr;
                </button>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
              Syncs active files &amp; cursors
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center font-mono text-[11px] text-zinc-600">
        CodeRoom &bull; All workspaces purge daily at 00:00 IST
      </footer>
    </div>
  );
}


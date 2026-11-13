"use client";

import dynamic from "next/dynamic";

/**
 * Client component wrapping MultiFileEditor with ssr: false.
 * Receives the resolved roomName from the server page component.
 */
const MultiFileEditor = dynamic(() => import("@/components/editor/MultiFileEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
      Loading collaborative workspace...
    </div>
  ),
});

interface RoomClientWrapperProps {
  roomName: string;
}

export default function RoomClientWrapper({ roomName }: RoomClientWrapperProps) {
  return (
    <main className="h-screen w-screen overflow-hidden bg-zinc-950">
      <MultiFileEditor roomName={roomName} />
    </main>
  );
}


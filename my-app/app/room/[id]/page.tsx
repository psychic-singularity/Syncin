import { Suspense } from "react";
import RoomClientWrapper from "./RoomClientWrapper";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
          Loading collaborative workspace...
        </div>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}

async function RoomContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedRoomName = decodeURIComponent(id);
  return <RoomClientWrapper roomName={decodedRoomName} />;
}

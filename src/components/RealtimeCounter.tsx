"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_PATH = "/api/socketio";

export function RealtimeCounter() {
  const socketRef = useRef<Socket | null>(null);
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const socket = io({
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("counter:update", (value: number) => {
      setCount(value);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const increment = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const started = performance.now();
    socket.once("counter:update", () => {
      setLastLatencyMs(Math.round(performance.now() - started));
    });
    socket.emit("counter:increment");
  }, []);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        3. Real-time counter (Socket.io)
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Open this page in two tabs on the same tenant host. Click increment in
        one tab; the other updates in under 500ms.
      </p>
      <p className="mt-4 text-4xl font-mono font-bold tabular-nums text-zinc-900">
        {count}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={increment}
          disabled={!connected}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          Increment
        </button>
        <span
          className={`text-xs font-medium ${connected ? "text-emerald-600" : "text-amber-600"}`}
        >
          {connected ? "Connected" : "Connecting…"}
        </span>
        {lastLatencyMs !== null && (
          <span className="text-xs text-zinc-500">
            Last round-trip: {lastLatencyMs}ms
          </span>
        )}
      </div>
    </section>
  );
}

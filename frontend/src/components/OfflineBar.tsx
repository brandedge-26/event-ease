"use client";

type Props = {
  isOnline:       boolean;
  pendingCount:   number;
  syncing:        boolean;
  justCameOnline: boolean;
  onSync:         () => void;
  onReconnect:    () => void;
};

export function OfflineBar({ isOnline, pendingCount, syncing, justCameOnline, onSync, onReconnect }: Props) {
  // Fully online, nothing pending, no flash → hide
  if (isOnline && pendingCount === 0 && !justCameOnline) return null;

  // ── Online flash (green) ──────────────────────────────────────────────────
  if (justCameOnline && isOnline && pendingCount === 0) {
    return (
      <div
        className="w-full flex items-center gap-2 px-5 py-2 text-sm font-semibold"
        style={{ background: "#16A34A", color: "#fff" }}
      >
        <span className="w-2 h-2 rounded-full bg-white shrink-0" />
        Online — you&apos;re connected
      </div>
    );
  }

  const offline = !isOnline;

  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-5 py-2 text-sm font-semibold"
      style={{ background: offline ? "#DC2626" : "#D97706", color: "#fff" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-2 h-2 rounded-full bg-white shrink-0"
          style={{ animation: offline ? "pulse 1.5s ease-in-out infinite" : "none" }}
        />
        <span className="truncate">
          {offline ? "Offline" : ""}
          {pendingCount > 0
            ? `${offline ? " · " : ""}${pendingCount} booking${pendingCount !== 1 ? "s" : ""} queued`
            : ""}
        </span>
      </div>

      <button
        onClick={offline ? onReconnect : onSync}
        disabled={syncing}
        className="text-xs font-bold underline cursor-pointer shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ color: "#fff" }}
      >
        {syncing ? "Syncing…" : offline ? "Reconnect" : "Sync now"}
      </button>
    </div>
  );
}

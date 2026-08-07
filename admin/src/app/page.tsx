export default function AdminPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-subtle)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          Admin
        </h1>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Event Ease Admin Panel
        </p>
      </div>
    </div>
  );
}

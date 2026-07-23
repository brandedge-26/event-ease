import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-normal tracking-tighter text-gray-900 mb-6">Event Ease</h1>
        <div className="flex gap-3">
          <Link
            href="/vendor/login"
            className="px-6 py-3 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#ffffff" }}
          >
            Vendor Login
          </Link>
          <Link
            href="/vendor/onboarding/business-info"
            className="px-6 py-3 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--bg-subtle)", color: "var(--fg)", border: "1px solid #D1D5DB" }}
          >
            Register Business
          </Link>
          <Link
            href="/vendor/dashboard"
            className="px-6 py-3 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--sidebar-bg)", color: "#ffffff" }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

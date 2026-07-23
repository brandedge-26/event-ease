export default function DashboardPage() {
  const stats = [
    { label: "Today's Events", value: "3", color: "var(--primary)", light: "var(--primary-light)", icon: <TodayIcon /> },
    { label: "New Inquiries", value: "7", color: "#2563EB", light: "#EFF6FF", icon: <InquiryIcon /> },
    { label: "Pending Payments", value: "4", color: "#D97706", light: "#FFFBEB", icon: <PaymentIcon /> },
    { label: "Upcoming Events", value: "12", color: "#16A34A", light: "#F0FDF4", icon: <UpcomingIcon /> },
  ];

  const quickActions = [
    { label: "New Inquiry", icon: <PlusIcon /> },
    { label: "New Booking", icon: <BookIcon /> },
    { label: "Generate Quote", icon: <FileIcon /> },
    { label: "Check Availability", icon: <CalendarIcon /> },
    { label: "Add Customer", icon: <UserPlusIcon /> },
  ];

  const recentInquiries = [
    { name: "Ahmed Khan", event: "Wedding", date: "15 Aug", status: "New", statusColor: "#2563EB", statusBg: "#EFF6FF" },
    { name: "Sara Malik", event: "Birthday", date: "18 Aug", status: "Contacted", statusColor: "#D97706", statusBg: "#FFFBEB" },
    { name: "Bilal Raza", event: "Corporate", date: "22 Aug", status: "Visit Scheduled", statusColor: "#16A34A", statusBg: "#F0FDF4" },
    { name: "Nadia Shah", event: "Wedding", date: "30 Aug", status: "Quotation Sent", statusColor: "var(--primary)", statusBg: "var(--primary-light)" },
  ];

  const todayEvents = [
    { hall: "Hall A", event: "Wedding — Usman & Fatima", time: "6:00 PM", guests: "350" },
    { hall: "Hall B", event: "Birthday — Ayaan", time: "4:00 PM", guests: "80" },
    { hall: "Hall C", event: "Corporate Dinner", time: "7:30 PM", guests: "120" },
  ];

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-black tracking-tight">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Wednesday, 23 July 2026
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: s.light, color: s.color }}
            >
              {s.icon}
            </div>
            <p className="text-3xl font-semibold text-black">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">

          {/* Today's Events */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Today&apos;s Events</h2>
            <div className="flex flex-col gap-3">
              {todayEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#F4F4F5] last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      {e.hall.split(" ")[1]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{e.event}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{e.hall} · {e.guests} guests</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Inquiries */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Recent Inquiries</h2>
              <a href="/vendor/dashboard/inquiries" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                View all
              </a>
            </div>
            <div className="flex flex-col gap-0">
              {recentInquiries.map((inq, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#F4F4F5] last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {inq.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{inq.name}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{inq.event} · {inq.date}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: inq.statusBg, color: inq.statusColor }}
                  >
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right col */}
        <div className="flex flex-col gap-4 lg:gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-left cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: "var(--bg-subtle)", color: "var(--fg)" }}
                >
                  <span style={{ color: "var(--primary)" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Reminders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-black mb-4">Follow-up Reminders</h2>
            <div className="flex flex-col gap-3">
              {[
                { name: "Usman Ali", note: "Send quotation", time: "2:00 PM" },
                { name: "Hina Baig", note: "Confirm booking", time: "4:30 PM" },
                { name: "Tariq Butt", note: "Payment follow-up", time: "6:00 PM" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{r.name}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{r.note}</p>
                  </div>
                  <span className="text-xs" style={{ color: "var(--primary)" }}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TodayIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" /></svg>;
}
function InquiryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function PaymentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function UpcomingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function BookIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function FileIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}
function CalendarIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function UserPlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>;
}

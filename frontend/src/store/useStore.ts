import { create } from "zustand";

// ─── Shared Types ─────────────────────────────────────────────────────────────
export type BookingStatus = "confirmed" | "pending" | "cancelled";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Cheque" | "Online";
export type PaymentStatus = "paid" | "partial" | "pending" | "overdue";

export type BookingService = { label: string; unit: string; price: string };

export type PaymentRecord = {
  id: string;
  amount: number;
  date: string;
  note: string;
  method: PaymentMethod;
};

export type Transaction = {
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
};

export type Booking = {
  id: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  guests: number;
  amount: number;
  hallAmount?: number;
  paid: number;
  status: BookingStatus;
  notes: string;
  services: BookingService[];
  payments?: PaymentRecord[];
};

export type Payment = {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  event: string;
  hall: string;
  eventDate: string;
  dueDate: string;
  totalAmount: number;
  paid: number;
  status: PaymentStatus;
  transactions: Transaction[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function payStatus(paid: number, total: number): PaymentStatus {
  if (total <= 0) return "pending";
  if (paid >= total) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_BOOKINGS: Booking[] = [
  { id: "BK-001", customerName: "Ahmed Khan",   phone: "0300-1234567", event: "Wedding",        hall: "Hall A", date: "2026-08-02", timeFrom: "18:00", timeTo: "23:00", guests: 350, amount: 450000, paid: 200000, status: "confirmed", notes: "Requires stage decoration", services: [{ label: "Drink Service", unit: "350", price: "35000" }, { label: "Music", unit: "1", price: "15000" }], payments: [{ id: "PR-001", amount: 100000, date: "2026-06-10", note: "Advance payment", method: "Bank Transfer" }, { id: "PR-002", amount: 100000, date: "2026-07-01", note: "2nd installment", method: "Cheque" }] },
  { id: "BK-002", customerName: "Sara Malik",   phone: "0312-9876543", event: "Birthday Party", hall: "Hall B", date: "2026-08-05", timeFrom: "16:00", timeTo: "21:00", guests: 80,  amount: 85000,  paid: 85000,  status: "confirmed", notes: "", services: [{ label: "Music", unit: "1", price: "12000" }], payments: [{ id: "PR-003", amount: 85000, date: "2026-07-05", note: "Full payment", method: "Online" }] },
  { id: "BK-003", customerName: "Nadia Shah",   phone: "0321-4567890", event: "Wedding",        hall: "Hall A", date: "2026-08-10", timeFrom: "17:00", timeTo: "23:00", guests: 400, amount: 520000, paid: 0,      status: "pending",   notes: "Menu tasting scheduled", services: [], payments: [] },
  { id: "BK-004", customerName: "Bilal Raza",   phone: "0333-1122334", event: "Corporate Event",hall: "Hall C", date: "2026-08-14", timeFrom: "10:00", timeTo: "17:00", guests: 120, amount: 95000,  paid: 50000,  status: "confirmed", notes: "", services: [{ label: "Table Service", unit: "10", price: "8000" }], payments: [{ id: "PR-004", amount: 50000, date: "2026-07-10", note: "Advance", method: "Cash" }] },
  { id: "BK-005", customerName: "Hina Baig",    phone: "0345-6677889", event: "Engagement",     hall: "Hall B", date: "2026-08-18", timeFrom: "19:00", timeTo: "23:30", guests: 200, amount: 180000, paid: 100000, status: "pending",   notes: "Guests from Lahore", services: [], payments: [{ id: "PR-005", amount: 100000, date: "2026-07-15", note: "Token", method: "Bank Transfer" }] },
  { id: "BK-006", customerName: "Tariq Butt",   phone: "0302-3344556", event: "Wedding",        hall: "Hall A", date: "2026-07-28", timeFrom: "18:00", timeTo: "00:00", guests: 450, amount: 600000, paid: 600000, status: "confirmed", notes: "", services: [{ label: "Drink Service", unit: "450", price: "45000" }, { label: "Music", unit: "1", price: "20000" }, { label: "Table Service", unit: "40", price: "32000" }], payments: [{ id: "PR-006", amount: 300000, date: "2026-06-01", note: "Advance 50%", method: "Cheque" }, { id: "PR-007", amount: 300000, date: "2026-07-18", note: "Final payment", method: "Bank Transfer" }] },
  { id: "BK-007", customerName: "Usman Ali",    phone: "0311-9988776", event: "Anniversary",    hall: "Hall B", date: "2026-07-05", timeFrom: "19:30", timeTo: "23:00", guests: 60,  amount: 55000,  paid: 0,      status: "cancelled", notes: "Client cancelled", services: [], payments: [] },
  { id: "BK-008", customerName: "Fatima Malik", phone: "0321-5566778", event: "Wedding",        hall: "Hall A", date: "2026-09-01", timeFrom: "17:00", timeTo: "23:00", guests: 450, amount: 580000, paid: 150000, status: "confirmed", notes: "", services: [], payments: [{ id: "PR-008", amount: 150000, date: "2026-07-10", note: "Advance booking", method: "Cash" }] },
  { id: "BK-009", customerName: "Omar Sheikh",  phone: "0300-8899001", event: "Corporate Event",hall: "Hall C", date: "2026-09-05", timeFrom: "09:00", timeTo: "17:00", guests: 150, amount: 110000, paid: 110000, status: "confirmed", notes: "Projector required", services: [{ label: "Table Service", unit: "12", price: "9600" }], payments: [{ id: "PR-009", amount: 110000, date: "2026-07-20", note: "Full advance", method: "Online" }] },
  { id: "BK-010", customerName: "Zara Ahmed",   phone: "0312-2233445", event: "Engagement",     hall: "Hall B", date: "2026-09-10", timeFrom: "19:00", timeTo: "23:00", guests: 180, amount: 160000, paid: 80000,  status: "pending",   notes: "", services: [], payments: [{ id: "PR-010", amount: 80000, date: "2026-07-22", note: "50% advance", method: "Bank Transfer" }] },
  { id: "BK-011", customerName: "Ali Hassan",   phone: "0333-7788990", event: "Wedding",        hall: "Hall A", date: "2026-09-20", timeFrom: "18:00", timeTo: "23:30", guests: 380, amount: 490000, paid: 200000, status: "confirmed", notes: "VIP seating arrangement", services: [{ label: "Drink Service", unit: "380", price: "38000" }], payments: [{ id: "PR-011", amount: 200000, date: "2026-07-25", note: "Advance payment", method: "Cheque" }] },
  { id: "BK-012", customerName: "Raza Corp",    phone: "0302-1122334", event: "Conference",     hall: "Hall C", date: "2026-09-25", timeFrom: "08:00", timeTo: "16:00", guests: 200, amount: 140000, paid: 0,      status: "pending",   notes: "", services: [], payments: [] },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: "PAY-001", bookingId: "BK-001", customerName: "Ahmed Khan",   phone: "0300-1234567", event: "Wedding",        hall: "Hall A", eventDate: "2026-08-02", dueDate: "2026-07-25", totalAmount: 450000, paid: 200000, status: "partial",  transactions: [{ date: "2026-06-10", amount: 100000, method: "Bank Transfer", note: "Advance payment" }, { date: "2026-07-01", amount: 100000, method: "Cheque", note: "2nd installment" }] },
  { id: "PAY-002", bookingId: "BK-002", customerName: "Sara Malik",   phone: "0312-9876543", event: "Birthday Party", hall: "Hall B", eventDate: "2026-08-05", dueDate: "2026-07-28", totalAmount: 85000,  paid: 85000,  status: "paid",     transactions: [{ date: "2026-07-05", amount: 85000,  method: "Online",        note: "Full payment" }] },
  { id: "PAY-003", bookingId: "BK-003", customerName: "Nadia Shah",   phone: "0321-4567890", event: "Wedding",        hall: "Hall A", eventDate: "2026-08-10", dueDate: "2026-07-20", totalAmount: 520000, paid: 0,      status: "overdue",  transactions: [] },
  { id: "PAY-004", bookingId: "BK-004", customerName: "Bilal Raza",   phone: "0333-1122334", event: "Corporate Event",hall: "Hall C", eventDate: "2026-08-14", dueDate: "2026-08-01", totalAmount: 95000,  paid: 50000,  status: "partial",  transactions: [{ date: "2026-07-10", amount: 50000,  method: "Cash",          note: "Advance" }] },
  { id: "PAY-005", bookingId: "BK-005", customerName: "Hina Baig",    phone: "0345-6677889", event: "Engagement",     hall: "Hall B", eventDate: "2026-08-18", dueDate: "2026-08-10", totalAmount: 180000, paid: 100000, status: "partial",  transactions: [{ date: "2026-07-15", amount: 100000, method: "Bank Transfer", note: "Token" }] },
  { id: "PAY-006", bookingId: "BK-006", customerName: "Tariq Butt",   phone: "0302-3344556", event: "Wedding",        hall: "Hall A", eventDate: "2026-07-28", dueDate: "2026-07-20", totalAmount: 600000, paid: 600000, status: "paid",     transactions: [{ date: "2026-06-01", amount: 300000, method: "Cheque",        note: "Advance 50%" }, { date: "2026-07-18", amount: 300000, method: "Bank Transfer", note: "Final payment" }] },
  { id: "PAY-007", bookingId: "BK-008", customerName: "Fatima Malik", phone: "0321-5566778", event: "Wedding",        hall: "Hall A", eventDate: "2026-09-01", dueDate: "2026-08-20", totalAmount: 580000, paid: 150000, status: "pending",  transactions: [{ date: "2026-07-10", amount: 150000, method: "Cash",          note: "Advance booking" }] },
  { id: "PAY-008", bookingId: "BK-009", customerName: "Omar Sheikh",  phone: "0300-8899001", event: "Corporate Event",hall: "Hall C", eventDate: "2026-09-05", dueDate: "2026-08-25", totalAmount: 110000, paid: 110000, status: "paid",     transactions: [{ date: "2026-07-20", amount: 110000, method: "Online",        note: "Full advance" }] },
  { id: "PAY-009", bookingId: "BK-010", customerName: "Zara Ahmed",   phone: "0312-2233445", event: "Engagement",     hall: "Hall B", eventDate: "2026-09-10", dueDate: "2026-08-28", totalAmount: 160000, paid: 80000,  status: "pending",  transactions: [{ date: "2026-07-22", amount: 80000,  method: "Bank Transfer", note: "50% advance" }] },
  { id: "PAY-010", bookingId: "BK-011", customerName: "Ali Hassan",   phone: "0333-7788990", event: "Wedding",        hall: "Hall A", eventDate: "2026-09-20", dueDate: "2026-09-05", totalAmount: 490000, paid: 200000, status: "pending",  transactions: [{ date: "2026-07-25", amount: 200000, method: "Cheque",        note: "Advance payment" }] },
];

// ─── Package Types ────────────────────────────────────────────────────────────
export type PackageCategory = "Wedding" | "Engagement" | "Birthday" | "Corporate" | "Anniversary" | "Other";
export type PackageStatus = "active" | "inactive";

export type Package = {
  id: string;
  name: string;
  category: PackageCategory;
  description: string;
  price: number;
  maxGuests: number;
  duration: string;
  includes: string[];
  status: PackageStatus;
};

const INITIAL_PACKAGES: Package[] = [
  { id: "PKG-001", name: "Basic Wedding Package",    category: "Wedding",    description: "Perfect for intimate weddings with essential services included.", price: 150000, maxGuests: 200, duration: "6 Hours",   status: "active",   includes: ["Hall Decoration", "Catering (Dinner)", "Sound System", "Stage Setup", "Parking"] },
  { id: "PKG-002", name: "Premium Wedding Package",  category: "Wedding",    description: "Our all-inclusive wedding package with premium add-ons for a grand celebration.", price: 350000, maxGuests: 500, duration: "Full Day", status: "active",   includes: ["Hall Decoration", "Catering (Dinner + Lunch)", "Sound System", "Stage Setup", "Lighting", "Photography", "Floral Arrangements", "Valet Parking", "Bridal Room"] },
  { id: "PKG-003", name: "Corporate Event Package",  category: "Corporate",  description: "Professional setup for corporate events, conferences and seminars.", price: 80000,  maxGuests: 150, duration: "8 Hours",   status: "active",   includes: ["Projector & Screen", "Sound System", "Round Tables", "Catering (Lunch)", "WiFi", "Reception Desk"] },
  { id: "PKG-004", name: "Birthday Bash Package",    category: "Birthday",   description: "Fun and colorful birthday celebration package for all ages.", price: 45000,  maxGuests: 80,  duration: "4 Hours",   status: "active",   includes: ["Theme Decoration", "DJ Sound", "Cake (3 tier)", "Catering (Snacks)", "Photo Booth"] },
  { id: "PKG-005", name: "Engagement Ceremony",      category: "Engagement", description: "Elegant engagement ceremony setup with traditional and modern elements.", price: 120000, maxGuests: 300, duration: "5 Hours",   status: "inactive", includes: ["Stage Decoration", "Catering (Dinner)", "Sound System", "Floral Setup", "Photography"] },
];

// ─── Staff Types ──────────────────────────────────────────────────────────────
export type StaffRole = "Manager" | "Waiter" | "Chef" | "Security" | "Cleaner" | "Decorator" | "DJ" | "Receptionist" | "Photographer" | "Driver" | "Other";
export type StaffStatus = "active" | "on-leave" | "inactive";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  salary: number;
  joinDate: string;
  status: StaffStatus;
  address: string;
  notes: string;
  avatarColor: string; // flat pastel bg hex
  avatarUrl?: string;  // uploaded photo URL (blob or data URL)
};

// Flat pastel colors — low bg, always use dark text (#1F2937)
export const STAFF_AVATAR_COLORS = [
  "#E0E7FF", "#FCE7F3", "#D1FAE5", "#FEF3C7",
  "#EDE9FE", "#CFFAFE", "#FEE2E2", "#F3F4F6",
];

const INITIAL_STAFF: StaffMember[] = [
  { id: "STF-001", name: "Imran Hussain",  email: "imran@royalbanquet.com",  phone: "0300-1112233", role: "Manager",      department: "Operations", salary: 80000, joinDate: "2020-03-15", status: "active",   address: "Gulshan-e-Iqbal, Karachi", notes: "Senior manager, handles all floor operations.", avatarColor: "#E0E7FF" },
  { id: "STF-002", name: "Sana Butt",      email: "sana@royalbanquet.com",   phone: "0312-4455667", role: "Receptionist", department: "Front Desk", salary: 35000, joinDate: "2021-07-01", status: "active",   address: "North Nazimabad, Karachi",  notes: "Handles client inquiries and walk-ins.", avatarColor: "#FCE7F3" },
  { id: "STF-003", name: "Tariq Mehmood",  email: "tariq@royalbanquet.com",  phone: "0321-9988776", role: "Chef",         department: "Kitchen",    salary: 65000, joinDate: "2019-11-10", status: "active",   address: "Gulberg, Lahore",           notes: "Head chef specializing in desi cuisine.", avatarColor: "#D1FAE5" },
  { id: "STF-004", name: "Ali Rehman",     email: "ali@royalbanquet.com",    phone: "0333-2233445", role: "Waiter",       department: "Service",    salary: 25000, joinDate: "2022-01-20", status: "active",   address: "FB Area, Karachi",          notes: "", avatarColor: "#FEF3C7" },
  { id: "STF-005", name: "Bilal Sheikh",   email: "bilal@royalbanquet.com",  phone: "0345-5566778", role: "Decorator",    department: "Events",     salary: 45000, joinDate: "2021-04-05", status: "on-leave", address: "DHA Phase 2, Karachi",      notes: "On medical leave till Aug 2026.", avatarColor: "#EDE9FE" },
  { id: "STF-006", name: "Nadia Anwar",    email: "nadia@royalbanquet.com",  phone: "0302-7788990", role: "Photographer", department: "Events",     salary: 55000, joinDate: "2022-06-15", status: "active",   address: "Clifton, Karachi",          notes: "Covers all events, experienced with DSLR.", avatarColor: "#CFFAFE" },
  { id: "STF-007", name: "Usman Farooq",   email: "usman@royalbanquet.com",  phone: "0311-3344556", role: "Security",     department: "Security",   salary: 28000, joinDate: "2023-02-01", status: "active",   address: "Korangi, Karachi",          notes: "", avatarColor: "#FEE2E2" },
  { id: "STF-008", name: "Kamran Akbar",   email: "kamran@royalbanquet.com", phone: "0300-9900112", role: "DJ",           department: "Events",     salary: 40000, joinDate: "2020-08-22", status: "inactive", address: "Saddar, Karachi",           notes: "Contract ended. Previously handled all event sound.", avatarColor: "#F3F4F6" },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface StoreState {
  bookings: Booking[];
  payments: Payment[];
  packages: Package[];
  staff: StaffMember[];

  addPackage: (p: Package) => void;
  updatePackage: (p: Package) => void;
  deletePackage: (id: string) => void;

  addStaff: (s: StaffMember) => void;
  updateStaff: (s: StaffMember) => void;
  deleteStaff: (id: string) => void;

  /** Create a new booking → auto-creates linked payment record */
  addBooking: (b: Booking) => void;

  /** Edit booking → syncs linked payment's totalAmount + paid + customer info */
  updateBooking: (b: Booking) => void;

  /** Cancel booking (status only) */
  cancelBooking: (id: string) => void;

  /** Add a payment from the Bookings detail view → updates booking.paid + payment record */
  addPaymentToBooking: (bookingId: string, amount: number, note: string, method: PaymentMethod) => void;

  /** Record a payment from the Payments page → updates payment + linked booking */
  recordPayment: (paymentId: string, amount: number, method: PaymentMethod, note: string) => void;

  /** Add a standalone payment (not linked to a booking) */
  addStandalonePayment: (p: Payment) => void;

  /** Edit payment metadata (customer name, dates etc.) */
  updatePaymentDetails: (p: Payment) => void;

  /** Delete payment record */
  deletePayment: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  bookings: INITIAL_BOOKINGS,
  payments: INITIAL_PAYMENTS,
  packages: INITIAL_PACKAGES,
  staff:    INITIAL_STAFF,

  addPackage: (p) => set((state) => ({ packages: [p, ...state.packages] })),
  updatePackage: (p) => set((state) => ({ packages: state.packages.map((pk) => pk.id === p.id ? p : pk) })),
  deletePackage: (id) => set((state) => ({ packages: state.packages.filter((p) => p.id !== id) })),

  addStaff: (s) => set((state) => ({ staff: [s, ...state.staff] })),
  updateStaff: (s) => set((state) => ({ staff: state.staff.map((m) => m.id === s.id ? s : m) })),
  deleteStaff: (id) => set((state) => ({ staff: state.staff.filter((s) => s.id !== id) })),

  addBooking: (b) =>
    set((state) => {
      const today = new Date().toISOString().slice(0, 10);
      const transactions: Transaction[] = b.payments && b.payments.length > 0
        ? b.payments.map((p) => ({ date: p.date, amount: p.amount, method: p.method, note: p.note }))
        : b.paid > 0
          ? [{ date: today, amount: b.paid, method: "Cash" as PaymentMethod, note: "Advance" }]
          : [];
      const newPayment: Payment = {
        id: `PAY-${Date.now()}`,
        bookingId: b.id,
        customerName: b.customerName,
        phone: b.phone,
        event: b.event,
        hall: b.hall,
        eventDate: b.date,
        dueDate: "",
        totalAmount: b.amount,
        paid: b.paid,
        status: payStatus(b.paid, b.amount),
        transactions,
      };
      return {
        bookings: [b, ...state.bookings],
        payments: [newPayment, ...state.payments],
      };
    }),

  updateBooking: (b) =>
    set((state) => ({
      bookings: state.bookings.map((bk) => (bk.id === b.id ? b : bk)),
      payments: state.payments.map((p) =>
        p.bookingId === b.id
          ? {
              ...p,
              customerName: b.customerName,
              phone: b.phone,
              event: b.event,
              hall: b.hall,
              eventDate: b.date,
              totalAmount: b.amount,
              paid: b.paid,
              status: payStatus(b.paid, b.amount),
            }
          : p
      ),
    })),

  cancelBooking: (id) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled" } : b
      ),
    })),

  addPaymentToBooking: (bookingId, amount, note, method) =>
    set((state) => {
      const today = new Date().toISOString().slice(0, 10);
      const record: PaymentRecord = { id: `PR-${Date.now()}`, amount, date: today, note: note || "Payment", method };
      const tx: Transaction = { date: today, amount, method, note: note || "Payment" };
      return {
        bookings: state.bookings.map((b) => {
          if (b.id !== bookingId) return b;
          return { ...b, paid: b.paid + amount, payments: [...(b.payments ?? []), record] };
        }),
        payments: state.payments.map((p) => {
          if (p.bookingId !== bookingId) return p;
          const newPaid = p.paid + amount;
          return { ...p, paid: newPaid, status: payStatus(newPaid, p.totalAmount), transactions: [...p.transactions, tx] };
        }),
      };
    }),

  recordPayment: (paymentId, amount, method, note) =>
    set((state) => {
      const today = new Date().toISOString().slice(0, 10);
      const tx: Transaction = { date: today, amount, method, note };
      let linkedBookingId = "";
      const updPayments = state.payments.map((p) => {
        if (p.id !== paymentId) return p;
        linkedBookingId = p.bookingId;
        const newPaid = p.paid + amount;
        return { ...p, paid: newPaid, status: payStatus(newPaid, p.totalAmount), transactions: [...p.transactions, tx] };
      });
      const record: PaymentRecord = { id: `PR-${Date.now()}`, amount, date: today, note, method };
      const updBookings = linkedBookingId
        ? state.bookings.map((b) => {
            if (b.id !== linkedBookingId) return b;
            return { ...b, paid: b.paid + amount, payments: [...(b.payments ?? []), record] };
          })
        : state.bookings;
      return { payments: updPayments, bookings: updBookings };
    }),

  addStandalonePayment: (p) =>
    set((state) => ({ payments: [p, ...state.payments] })),

  updatePaymentDetails: (p) =>
    set((state) => ({
      payments: state.payments.map((pm) => (pm.id === p.id ? p : pm)),
      bookings: state.bookings.map((b) =>
        b.id === p.bookingId ? { ...b, amount: p.totalAmount, paid: p.paid } : b
      ),
    })),

  deletePayment: (id) =>
    set((state) => ({ payments: state.payments.filter((p) => p.id !== id) })),
}));

import { create } from "zustand";

export type Stage = {
  id: string;
  label: string;
  color: string;
};

export type Deal = {
  id: string;
  client: string;
  title: string;
  amount: number;
  stageId: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  fromDealId?: string;
  receipt?: string;
  category?: string;
};

export type RecipeItem = { itemId: string; qty: number };

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  price: number;
  unit?: string; // ml, g, pcs
  isProduct?: boolean; // sellable in POS
  recipe?: RecipeItem[]; // ingredients consumed on sale
  prepSteps?: string[]; // optional preparation/cooking steps
};

export type Task = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

export type Customer = {
  id: string;
  phone: string;
  name?: string;
  note?: string;
  createdAt: string;
  email?: string;
  source?: string;
  socialHandle?: string;
  city?: string;
  birthday?: string;
  tags?: string[];
  status?: "lead" | "active" | "vip" | "inactive";
};

export type CartLine = { itemId: string; name: string; price: number; qty: number };

export type HeldOrder = {
  id: string;
  label: string;
  lines: CartLine[];
  customerId?: string;
  createdAt: string;
};

export type Receipt = {
  id: string;
  number: string;
  lines: CartLine[];
  total: number;
  customerId?: string;
  cashierId: string;
  createdAt: string;
  voided?: boolean;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  severity: "info" | "warn" | "alert";
};

export type AppointmentClient = {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
};

export type Appointment = {
  id: string;
  dealId?: string;
  title: string;
  clients: string[]; // legacy quick-list of names
  contacts?: AppointmentClient[]; // detailed client info
  start: string; // ISO
  duration: number; // minutes (multiples of 15)
  color?: string; // stage color id
  note?: string;
};

export type StaffRole = "owner" | "manager" | "cashier" | "barista" | "sales";

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  phone?: string;
  email?: string;
  pin: string; // 8-digit
  hiredAt: string;
  kpiTarget?: number; // monthly deals
};

export type Shift = {
  id: string;
  staffId: string;
  start: string;
  end?: string;
};

export type PremiumPlan = "Starter" | "Pro" | "Business" | "Enterprise";

export type Subscription = {
  plan: PremiumPlan;
  priceMonthly: number;
  status: "active" | "trial" | "past_due" | "canceled";
  startedAt: string;
  renewsAt: string; // next charge
  cardBrand: string;
  cardLast4: string;
  cardExpiry: string; // MM/YY
  autoRenew: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const pin = () => Math.floor(10_000_000 + Math.random() * 89_999_999).toString();

type State = {
  stages: Stage[];
  deals: Deal[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  tasks: Task[];
  customers: Customer[];
  heldOrders: HeldOrder[];
  receipts: Receipt[];
  audit: AuditEvent[];
  appointments: Appointment[];
  staff: Staff[];
  shifts: Shift[];
  subscription: Subscription;
  prepInstructions: Record<string, string>; // itemId -> markdown
  recipeNotes?: string;

  // crm
  addStage: () => void;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  removeStage: (id: string) => void;
  addDeal: (d: Omit<Deal, "id" | "createdAt">) => void;
  moveDeal: (id: string, stageId: string) => void;

  // appointments
  addAppointment: (a: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;

  // finance
  addTransaction: (t: Omit<Transaction, "id">) => void;

  // inventory
  addInventory: (i: Omit<InventoryItem, "id">) => void;
  updateStock: (id: string, delta: number) => void;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;

  // tasks
  addTask: (t: Omit<Task, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
  clearLostDeals: () => void;
  removeDeal: (id: string) => void;

  // customers (kept in store, UI tab removed)
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;

  // POS
  holdOrder: (label: string, lines: CartLine[], customerId?: string) => void;
  resumeOrder: (id: string) => HeldOrder | undefined;
  removeHeldOrder: (id: string) => void;
  checkoutOrder: (lines: CartLine[], customerId?: string) => Receipt;
  voidReceipt: (id: string, reason: string) => void;

  // staff
  addStaff: (s: Omit<Staff, "id" | "hiredAt" | "pin"> & { pin?: string }) => Staff;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  removeStaff: (id: string) => void;
  resetPin: (id: string) => string;
  clockIn: (staffId: string) => void;
  clockOut: (staffId: string) => void;

  // subscription
  updateSubscription: (patch: Partial<Subscription>) => void;

  // audit
  log: (e: Omit<AuditEvent, "id" | "at">) => void;
};

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
const minsAgo = (n: number) => new Date(today.getTime() - n * 60000).toISOString();

// Pre-seeded inventory: ingredients + products with recipes
const milkId = uid();
const beanId = uid();
const cupId = uid();
const syrupId = uid();
const cappId = uid();
const espId = uid();
const latteId = uid();
const croissantId = uid();

export const useStore = create<State>((set, get) => ({
  stages: [
    { id: "new", label: "New Client", color: "stage-new" },
    { id: "progress", label: "In Progress", color: "stage-progress" },
    { id: "noresponse", label: "No Response", color: "stage-noresponse" },
    { id: "completed", label: "Deal Completed", color: "stage-completed" },
    { id: "lost", label: "Deal Lost", color: "stage-lost" },
  ],
  deals: [
    { id: uid(), client: "Acme Corp", title: "Annual retainer", amount: 12500, stageId: "progress", createdAt: daysAgo(3) },
    { id: uid(), client: "Nova Studio", title: "Brand identity", amount: 4800, stageId: "new", createdAt: daysAgo(1) },
    { id: uid(), client: "Helix Labs", title: "Platform license", amount: 22000, stageId: "completed", createdAt: daysAgo(8) },
  ],
  transactions: [
    { id: uid(), label: "Helix Labs — Platform license", amount: 22000, type: "income", date: daysAgo(8), receipt: "RCPT-1042" },
    { id: uid(), label: "Server hosting", amount: 480, type: "expense", date: daysAgo(2), category: "Infrastructure" },
    { id: uid(), label: "Rent", amount: 1800, type: "expense", date: daysAgo(1), category: "Rent" },
  ],
  inventory: [
    
  ],
  tasks: [
    { id: uid(), title: "Order milk delivery", due: new Date(today.getTime() + 3600_000 * 5).toISOString(), done: false },
    { id: uid(), title: "Review yesterday's Z-report", due: new Date(today.getTime() + 86400000).toISOString(), done: false },
  ],
  customers: [
    { id: uid(), phone: "+1 555 0142", name: "Anna Petrova", email: "anna.p@gmail.com", source: "Instagram", socialHandle: "@anna.coffee", city: "Almaty", note: "Allergic to peanuts • likes window seat", createdAt: daysAgo(6), tags: ["loyal", "allergy"], status: "vip" },
    { id: uid(), phone: "+1 555 0177", name: "Marco Silva", email: "marco@nova.studio", source: "Referral", socialHandle: "@marco.s", city: "Lisbon", note: "Always orders double espresso", createdAt: daysAgo(2), tags: ["regular"], status: "active" },
    { id: uid(), phone: "+1 555 0203", name: "Acme Corp", email: "billing@acme.io", source: "Website", city: "NYC", note: "Annual retainer client", createdAt: daysAgo(40), tags: ["b2b"], status: "active" },
    { id: uid(), phone: "+1 555 0210", name: "Nova Studio", email: "hi@nova.studio", source: "Instagram", socialHandle: "@novastudio", city: "Berlin", createdAt: daysAgo(10), tags: ["b2b", "design"], status: "lead" },
    { id: uid(), phone: "+1 555 0299", name: "Helix Labs", email: "ops@helix.dev", source: "TikTok", city: "SF", createdAt: daysAgo(20), tags: ["b2b", "platform"], status: "vip" },
  ],
  heldOrders: [
   
  ],
  receipts: [
    
  ],
  audit: [
    { id: uid(), at: minsAgo(18), actor: "cashier-1", action: "Discount applied", detail: "Z-1002 • -10%", severity: "warn" },
    { id: uid(), at: minsAgo(40), actor: "system", action: "Low stock", detail: "Vanilla syrup near threshold", severity: "alert" },
  ],
  appointments: (() => {
    const base = new Date(); base.setHours(10, 0, 0, 0);
    const t = (h: number, m: number) => { const d = new Date(base); d.setHours(h, m, 0, 0); return d.toISOString(); };
    return [
      { id: uid(), title: "Brand kickoff", clients: ["Nova Studio"], start: t(10, 0), duration: 45, color: "stage-progress" },
      { id: uid(), title: "Discovery call", clients: ["Acme Corp", "Helix Labs"], start: t(11, 30), duration: 30, color: "stage-new" },
      { id: uid(), title: "Contract review", clients: ["Helix Labs"], start: t(14, 15), duration: 60, color: "stage-completed" },
    ];
  })(),
  staff: [
    { id: "owner", name: "Alex Mercer", role: "owner", phone: "+1 555 0001", email: "alex@mbe.app", pin: pin(), hiredAt: daysAgo(420), kpiTarget: 30 },
    { id: "cashier-1", name: "Mia Chen", role: "cashier", phone: "+1 555 0188", pin: pin(), hiredAt: daysAgo(60), kpiTarget: 0 },
    { id: "sales-1", name: "Daria Volkova", role: "sales", phone: "+1 555 0212", pin: pin(), hiredAt: daysAgo(180), kpiTarget: 12 },
    { id: "barista-1", name: "Tom Reyes", role: "barista", phone: "+1 555 0233", pin: pin(), hiredAt: daysAgo(45), kpiTarget: 0 },
  ],
  shifts: [
    { id: uid(), staffId: "cashier-1", start: new Date(today.getTime() - 3600_000 * 4).toISOString() },
    { id: uid(), staffId: "barista-1", start: new Date(today.getTime() - 3600_000 * 2.5).toISOString() },
  ],
  subscription: {
    plan: "Pro",
    priceMonthly: 49,
    status: "active",
    startedAt: daysAgo(120),
    renewsAt: new Date(today.getTime() + 86400000 * 14).toISOString(),
    cardBrand: "Visa",
    cardLast4: "4242",
    cardExpiry: "08/28",
    autoRenew: true,
  },
  prepInstructions: {
    
  },

  addStage: () => set((s) => ({ stages: [...s.stages, { id: uid(), label: "New Stage", color: "stage-progress" }] })),
  updateStage: (id, patch) => set((s) => ({ stages: s.stages.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeStage: (id) => set((s) => ({ stages: s.stages.filter((x) => x.id !== id) })),

  addDeal: (d) => set((s) => ({ deals: [{ ...d, id: uid(), createdAt: new Date().toISOString() }, ...s.deals] })),
  moveDeal: (id, stageId) => {
    const deal = get().deals.find((d) => d.id === id);
    set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, stageId } : d)) }));
    if (deal && stageId === "completed") {
      const exists = get().transactions.some((t) => t.fromDealId === id);
      if (!exists) {
        get().addTransaction({
          label: `${deal.client} — ${deal.title}`,
          amount: deal.amount, type: "income", date: new Date().toISOString(),
          fromDealId: id, receipt: `RCPT-${1000 + Math.floor(Math.random() * 9000)}`,
        });
      }
    }
  },

  addTransaction: (t) => set((s) => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })),

  addInventory: (i) => set((s) => ({ inventory: [{ ...i, id: uid() }, ...s.inventory] })),
  updateStock: (id, delta) =>
    set((s) => ({ inventory: s.inventory.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + delta) } : x)) })),
  updateInventory: (id, patch) =>
    set((s) => ({ inventory: s.inventory.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), done: false }] })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  clearCompletedTasks: () => set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),
  clearLostDeals: () => set((s) => ({ deals: s.deals.filter((d) => d.stageId !== "lost") })),
  removeDeal: (id) => set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

  addCustomer: (c) => {
    const cust = { ...c, id: uid(), createdAt: new Date().toISOString() };
    set((s) => ({ customers: [cust, ...s.customers] }));
    get().log({ actor: "owner", action: "Customer added", detail: cust.phone, severity: "info" });
    return cust;
  },
  updateCustomer: (id, patch) =>
    set((s) => ({ customers: s.customers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  holdOrder: (label, lines, customerId) => {
    set((s) => ({ heldOrders: [{ id: uid(), label, lines, customerId, createdAt: new Date().toISOString() }, ...s.heldOrders] }));
    get().log({ actor: "cashier-1", action: "Order held", detail: `${label} • ${lines.length} items`, severity: "info" });
  },
  resumeOrder: (id) => {
    const order = get().heldOrders.find((o) => o.id === id);
    set((s) => ({ heldOrders: s.heldOrders.filter((o) => o.id !== id) }));
    return order;
  },
  removeHeldOrder: (id) => set((s) => ({ heldOrders: s.heldOrders.filter((o) => o.id !== id) })),

  checkoutOrder: (lines, customerId) => {
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const number = `Z-${1000 + get().receipts.length + 1}`;
    const receipt: Receipt = { id: uid(), number, lines, total, customerId, cashierId: "cashier-1", createdAt: new Date().toISOString() };
    set((s) => ({ receipts: [receipt, ...s.receipts] }));
    // Consume inventory via recipes
    const inv = get().inventory;
    const updates: Record<string, number> = {};
    lines.forEach((l) => {
      const item = inv.find((i) => i.id === l.itemId);
      if (!item) return;
      if (item.recipe?.length) {
        item.recipe.forEach((r) => {
          updates[r.itemId] = (updates[r.itemId] ?? 0) - r.qty * l.qty;
        });
      } else {
        updates[l.itemId] = (updates[l.itemId] ?? 0) - l.qty;
      }
    });
    Object.entries(updates).forEach(([id, delta]) => get().updateStock(id, delta));
    get().addTransaction({ label: `POS ${number}`, amount: total, type: "income", date: receipt.createdAt, receipt: number });
    get().log({ actor: "cashier-1", action: "Sale", detail: `${number} • $${total.toFixed(2)}`, severity: "info" });
    return receipt;
  },

  voidReceipt: (id, reason) => {
    const r = get().receipts.find((x) => x.id === id);
    set((s) => ({ receipts: s.receipts.map((x) => (x.id === id ? { ...x, voided: true } : x)) }));
    if (r) get().log({ actor: "cashier-1", action: "Receipt voided", detail: `${r.number} • ${reason}`, severity: "alert" });
  },


  addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, { ...a, id: uid() }] })),
  updateAppointment: (id, patch) => set((s) => ({ appointments: s.appointments.map((x) => x.id === id ? { ...x, ...patch } : x) })),
  removeAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((x) => x.id !== id) })),

  addStaff: (s) => {
    const st: Staff = { ...s, id: uid(), pin: s.pin ?? pin(), hiredAt: new Date().toISOString() };
    set((state) => ({ staff: [...state.staff, st] }));
    get().log({ actor: "owner", action: "Staff added", detail: `${st.name} (${st.role})`, severity: "info" });
    return st;
  },
  updateStaff: (id, patch) => set((s) => ({ staff: s.staff.map((x) => x.id === id ? { ...x, ...patch } : x) })),
  removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
  resetPin: (id) => {
    const np = pin();
    set((s) => ({ staff: s.staff.map((x) => x.id === id ? { ...x, pin: np } : x) }));
    get().log({ actor: "owner", action: "PIN reset", detail: id, severity: "warn" });
    return np;
  },
  clockIn: (staffId) => {
    const open = get().shifts.find((sh) => sh.staffId === staffId && !sh.end);
    if (open) return;
    set((s) => ({ shifts: [...s.shifts, { id: uid(), staffId, start: new Date().toISOString() }] }));
  },
  clockOut: (staffId) => set((s) => ({
    shifts: s.shifts.map((sh) => (sh.staffId === staffId && !sh.end) ? { ...sh, end: new Date().toISOString() } : sh),
  })),

  updateSubscription: (patch) => set((s) => ({ subscription: { ...s.subscription, ...patch } })),

  log: (e) => set((s) => ({ audit: [{ ...e, id: uid(), at: new Date().toISOString() }, ...s.audit].slice(0, 100) })),
}));

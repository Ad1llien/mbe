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

const uid = () => Math.random().toString(36).slice(2, 9);

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

  // crm
  addStage: () => void;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  removeStage: (id: string) => void;
  addDeal: (d: Omit<Deal, "id" | "createdAt">) => void;
  moveDeal: (id: string, stageId: string) => void;

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

  // customers
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;

  // POS
  holdOrder: (label: string, lines: CartLine[], customerId?: string) => void;
  resumeOrder: (id: string) => HeldOrder | undefined;
  removeHeldOrder: (id: string) => void;
  checkoutOrder: (lines: CartLine[], customerId?: string) => Receipt;
  voidReceipt: (id: string, reason: string) => void;

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
    { id: milkId, name: "Milk", sku: "ING-MLK", stock: 4200, threshold: 2000, price: 0.004, unit: "ml" },
    { id: beanId, name: "Coffee beans", sku: "ING-BEAN", stock: 1800, threshold: 500, price: 0.05, unit: "g" },
    { id: cupId, name: "Paper cup 12oz", sku: "ING-CUP", stock: 120, threshold: 50, price: 0.12, unit: "pcs" },
    { id: syrupId, name: "Vanilla syrup", sku: "ING-SYR", stock: 800, threshold: 300, price: 0.02, unit: "ml" },
    { id: cappId, name: "Cappuccino", sku: "PRD-CAP", stock: 0, threshold: 0, price: 4.5, unit: "pcs", isProduct: true,
      recipe: [{ itemId: milkId, qty: 200 }, { itemId: beanId, qty: 18 }, { itemId: cupId, qty: 1 }] },
    { id: espId, name: "Espresso", sku: "PRD-ESP", stock: 0, threshold: 0, price: 3, unit: "pcs", isProduct: true,
      recipe: [{ itemId: beanId, qty: 9 }, { itemId: cupId, qty: 1 }] },
    { id: latteId, name: "Vanilla Latte", sku: "PRD-LAT", stock: 0, threshold: 0, price: 5.2, unit: "pcs", isProduct: true,
      recipe: [{ itemId: milkId, qty: 220 }, { itemId: beanId, qty: 18 }, { itemId: cupId, qty: 1 }, { itemId: syrupId, qty: 15 }] },
    { id: croissantId, name: "Croissant", sku: "PRD-CRS", stock: 8, threshold: 6, price: 3.8, unit: "pcs", isProduct: true },
  ],
  tasks: [
    { id: uid(), title: "Order milk delivery", due: new Date(today.getTime() + 3600_000 * 5).toISOString(), done: false },
    { id: uid(), title: "Review yesterday's Z-report", due: new Date(today.getTime() + 86400000).toISOString(), done: false },
  ],
  customers: [
    { id: uid(), phone: "+1 555 0142", name: "Anna", note: "Allergic to peanuts • likes window seat", createdAt: daysAgo(6) },
    { id: uid(), phone: "+1 555 0177", name: "Marco", note: "Always orders double espresso", createdAt: daysAgo(2) },
  ],
  heldOrders: [
    { id: uid(), label: "Table 4", lines: [
      { itemId: cappId, name: "Cappuccino", price: 4.5, qty: 2 },
      { itemId: croissantId, name: "Croissant", price: 3.8, qty: 1 },
    ], createdAt: minsAgo(4) },
  ],
  receipts: [
    { id: uid(), number: "Z-1001", lines: [{ itemId: espId, name: "Espresso", price: 3, qty: 1 }], total: 3, cashierId: "cashier-1", createdAt: minsAgo(35) },
    { id: uid(), number: "Z-1002", lines: [{ itemId: cappId, name: "Cappuccino", price: 4.5, qty: 2 }], total: 9, cashierId: "cashier-1", createdAt: minsAgo(20) },
  ],
  audit: [
    { id: uid(), at: minsAgo(18), actor: "cashier-1", action: "Discount applied", detail: "Z-1002 • -10%", severity: "warn" },
    { id: uid(), at: minsAgo(40), actor: "system", action: "Low stock", detail: "Vanilla syrup near threshold", severity: "alert" },
  ],

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

  log: (e) => set((s) => ({ audit: [{ ...e, id: uid(), at: new Date().toISOString() }, ...s.audit].slice(0, 100) })),
}));

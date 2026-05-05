import { create } from "zustand";

export type Stage = {
  id: string;
  label: string;
  color: string; // hsl var name
};

export type Deal = {
  id: string;
  client: string;
  title: string;
  amount: number;
  stageId: string;
  createdAt: string; // ISO
};

export type Transaction = {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  date: string; // ISO
  fromDealId?: string;
  receipt?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  price: number;
};

export type Task = {
  id: string;
  title: string;
  due: string; // ISO datetime
  done: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 9);

type State = {
  stages: Stage[];
  deals: Deal[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  tasks: Task[];
  // actions
  addStage: () => void;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  removeStage: (id: string) => void;
  addDeal: (d: Omit<Deal, "id" | "createdAt">) => void;
  moveDeal: (id: string, stageId: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  addInventory: (i: Omit<InventoryItem, "id">) => void;
  updateStock: (id: string, delta: number) => void;
  addTask: (t: Omit<Task, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
};

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

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
    { id: uid(), client: "Pine & Co", title: "Consulting sprint", amount: 6400, stageId: "noresponse", createdAt: daysAgo(12) },
    { id: uid(), client: "Orbit", title: "Q2 campaign", amount: 9100, stageId: "completed", createdAt: daysAgo(20) },
    { id: uid(), client: "Vector Ai", title: "Audit", amount: 3200, stageId: "lost", createdAt: daysAgo(30) },
  ],
  transactions: [
    { id: uid(), label: "Helix Labs — Platform license", amount: 22000, type: "income", date: daysAgo(8), receipt: "RCPT-1042" },
    { id: uid(), label: "Orbit — Q2 campaign", amount: 9100, type: "income", date: daysAgo(20), receipt: "RCPT-1041" },
    { id: uid(), label: "Server hosting", amount: 480, type: "expense", date: daysAgo(5) },
    { id: uid(), label: "Northwind — Retainer", amount: 5400, type: "income", date: daysAgo(35) },
    { id: uid(), label: "Greycroft — Workshop", amount: 2800, type: "income", date: daysAgo(50) },
  ],
  inventory: [
    { id: uid(), name: "Wireless Headset Pro", sku: "AUD-001", stock: 42, threshold: 10, price: 189 },
    { id: uid(), name: "Mechanical Keyboard", sku: "KBD-220", stock: 6, threshold: 8, price: 149 },
    { id: uid(), name: "Studio Monitor 5\"", sku: "MON-512", stock: 18, threshold: 5, price: 320 },
    { id: uid(), name: "USB-C Hub 8-in-1", sku: "HUB-808", stock: 3, threshold: 12, price: 79 },
    { id: uid(), name: "4K Webcam", sku: "CAM-4K", stock: 24, threshold: 6, price: 220 },
  ],
  tasks: [
    { id: uid(), title: "Send proposal to Nova Studio", due: new Date(today.getTime() + 3600_000 * 5).toISOString(), done: false },
    { id: uid(), title: "Review Q2 financial report", due: new Date(today.getTime() + 86400000).toISOString(), done: false },
    { id: uid(), title: "Restock USB-C Hubs", due: new Date(today.getTime() + 86400000 * 2).toISOString(), done: false },
    { id: uid(), title: "Call Pine & Co for follow-up", due: new Date(today.getTime() + 86400000 * 4).toISOString(), done: false },
  ],

  addStage: () => set((s) => ({ stages: [...s.stages, { id: uid(), label: "New Stage", color: "stage-progress" }] })),
  updateStage: (id, patch) => set((s) => ({ stages: s.stages.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeStage: (id) => set((s) => ({ stages: s.stages.filter((x) => x.id !== id) })),

  addDeal: (d) => set((s) => ({ deals: [{ ...d, id: uid(), createdAt: new Date().toISOString() }, ...s.deals] })),

  moveDeal: (id, stageId) => {
    const deal = get().deals.find((d) => d.id === id);
    set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, stageId } : d)) }));
    // Sync to Finance when completed
    if (deal && stageId === "completed") {
      const exists = get().transactions.some((t) => t.fromDealId === id);
      if (!exists) {
        get().addTransaction({
          label: `${deal.client} — ${deal.title}`,
          amount: deal.amount,
          type: "income",
          date: new Date().toISOString(),
          fromDealId: id,
          receipt: `RCPT-${1000 + Math.floor(Math.random() * 9000)}`,
        });
      }
    }
  },

  addTransaction: (t) => set((s) => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })),
  addInventory: (i) => set((s) => ({ inventory: [{ ...i, id: uid() }, ...s.inventory] })),
  updateStock: (id, delta) =>
    set((s) => ({ inventory: s.inventory.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + delta) } : x)) })),
  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), done: false }] })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));

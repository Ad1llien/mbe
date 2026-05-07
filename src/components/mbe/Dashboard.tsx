import { useMemo, useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowDownRight, ArrowUpRight, ReceiptText, Wallet, AlertTriangle, Activity, Plus, ShoppingBag } from "lucide-react";
import { format, parseISO, isToday, subDays, startOfDay } from "date-fns";

export const Dashboard = ({ onGoto }: { onGoto?: (s: string) => void }) => {
  const { receipts, transactions, inventory, audit, addTransaction } = useStore();

  const todayReceipts = receipts.filter((r) => !r.voided && isToday(parseISO(r.createdAt)));
  const revenueToday = todayReceipts.reduce((s, r) => s + r.total, 0);
  const expensesToday = transactions.filter((t) => t.type === "expense" && isToday(parseISO(t.date))).reduce((s, t) => s + t.amount, 0);
  const profit = revenueToday - expensesToday;
  const critical = inventory.filter((i) => !i.isProduct && i.stock <= i.threshold);

  const series = useMemo(() => {
    const arr: { day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayStart = startOfDay(d).getTime();
      const dayEnd = dayStart + 86400000;
      const sum = receipts.filter((r) => !r.voided).filter((r) => {
        const t = parseISO(r.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).reduce((s, r) => s + r.total, 0);
      arr.push({ day: format(d, "EEE"), revenue: sum });
    }
    return arr;
  }, [receipts]);

  return (
    <div className="fade-in">
      <SectionHeader
        title="Pulse"
        subtitle="Am I in the green today? Real-time business heartbeat."
        action={
          <div className="flex gap-2">
            <QuickExpense onAdd={addTransaction} />
            <Button className="h-9" onClick={() => onGoto?.("pos")}><ShoppingBag className="h-4 w-4 mr-1" /> Open POS</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue today" value={`$${revenueToday.toFixed(2)}`} delta={`${todayReceipts.length} receipts`} />
        <Stat label="Expenses today" value={`$${expensesToday.toFixed(2)}`} delta="manual entries" />
        <Stat label="Net profit (est.)" value={`${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(2)}`} delta={profit >= 0 ? "in the green" : "in the red"} />
        <Stat label="Critical stock" value={`${critical.length}`} delta={critical.length ? "action needed" : "all good"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Revenue • last 7 days</div>
              <div className="text-xs text-muted-foreground">POS sales, voided excluded</div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#dash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Critical stock</div>
            <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={() => onGoto?.("inventory")}>view all →</button>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {critical.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Stock is healthy ✦</div>}
            {critical.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/10 hairline">
                <div className="h-8 w-8 rounded-lg bg-destructive/20 text-destructive grid place-items-center"><AlertTriangle className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{i.name}</div>
                  <div className="text-[10px] text-muted-foreground">{i.stock} {i.unit} left • threshold {i.threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Panel>
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Recent receipts</div>
          <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
            {receipts.slice(0, 8).map((r) => (
              <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 ${r.voided ? "opacity-50" : ""}`}>
                <div className="h-8 w-8 rounded-lg bg-foreground text-background grid place-items-center"><ArrowUpRight className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{r.number} {r.voided && <span className="text-destructive">• voided</span>}</div>
                  <div className="text-[10px] text-muted-foreground">{r.lines.map((l) => `${l.qty}× ${l.name}`).join(" • ")}</div>
                </div>
                <div className="text-xs font-semibold">${r.total.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">{format(parseISO(r.createdAt), "HH:mm")}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> Activity log</div>
          <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
            {audit.slice(0, 12).map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/40 hairline">
                <span className={`mt-1 h-2 w-2 rounded-full ${a.severity === "alert" ? "bg-destructive" : a.severity === "warn" ? "bg-[hsl(var(--stage-progress))]" : "bg-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{a.action} <span className="text-muted-foreground font-normal">— {a.detail}</span></div>
                  <div className="text-[10px] text-muted-foreground">{format(parseISO(a.at), "MMM d • HH:mm")} • {a.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

const QuickExpense = ({ onAdd }: { onAdd: (t: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Supplies");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-9"><Wallet className="h-4 w-4 mr-1" /> Quick expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Description</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Coffee beans, taxi…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Supplies", "Rent", "Salary", "Marketing", "Infrastructure", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (!label || !amount) return;
            onAdd({ label, amount: Number(amount), type: "expense", date: new Date().toISOString(), category });
            setLabel(""); setAmount(""); setOpen(false);
          }}><Plus className="h-4 w-4 mr-1" /> Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

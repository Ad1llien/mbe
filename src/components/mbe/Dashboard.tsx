import { useMemo, useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Sector } from "recharts";
import { ArrowUpRight, ReceiptText, Wallet, Activity, Plus, ShoppingBag, UserCheck, Clock } from "lucide-react";
import { format, parseISO, isToday, subDays, startOfDay, differenceInMinutes } from "date-fns";

export const Dashboard = ({ onGoto }: { onGoto?: (s: string) => void }) => {
  const { receipts, transactions, inventory, audit, addTransaction, staff, shifts } = useStore();
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const onShift = shifts.filter((sh) => !sh.end).map((sh) => ({ shift: sh, person: staff.find((p) => p.id === sh.staffId)! })).filter((x) => x.person);

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
            <div className="text-sm font-medium flex items-center gap-2"><UserCheck className="h-4 w-4 text-[hsl(var(--stage-completed))]" /> Active staff</div>
            <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={() => onGoto?.("staff")}>manage →</button>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {onShift.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Nobody clocked in</div>}
            {onShift.map(({ shift, person }) => {
              const mins = differenceInMinutes(new Date(), parseISO(shift.start));
              const h = Math.floor(mins / 60); const m = mins % 60;
              return (
                <div key={shift.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hairline">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                    {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{person.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{person.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold tabular-nums flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />{h}h {m}m</div>
                    <div className="text-[10px] text-[hsl(var(--stage-completed))]">on shift</div>
                  </div>
                </div>
              );
            })}
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

        <RevenuePie receipts={receipts} activeIdx={activeIdx} setActiveIdx={setActiveIdx} />
      </div>
    </div>
  );
};

const PIE_COLORS = ["hsl(var(--foreground))", "hsl(var(--stage-completed))", "hsl(var(--stage-progress))", "hsl(var(--stage-noresponse))", "hsl(var(--stage-new))", "hsl(var(--muted-foreground))"];

const RevenuePie = ({ receipts, activeIdx, setActiveIdx }: { receipts: any[]; activeIdx: number; setActiveIdx: (n: number) => void }) => {
  const data = useMemo(() => {
    const totals = new Map<string, { name: string; revenue: number; qty: number }>();
    receipts.filter((r) => !r.voided).forEach((r) => r.lines.forEach((l: any) => {
      const cur = totals.get(l.name) || { name: l.name, revenue: 0, qty: 0 };
      cur.revenue += l.price * l.qty;
      cur.qty += l.qty;
      totals.set(l.name, cur);
    }));
    return Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [receipts]);

  const total = data.reduce((s, d) => s + d.revenue, 0);
  const totalQty = data.reduce((s, d) => s + d.qty, 0);

  const renderActive = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
      </g>
    );
  };

  const active = data[activeIdx];

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" /> Revenue mix</div>
        <div className="text-[10px] text-muted-foreground">top products</div>
      </div>
      {data.length === 0 ? (
        <div className="text-xs text-muted-foreground py-12 text-center">No sales yet</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="h-[230px] relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                  activeIndex={activeIdx}
                  activeShape={renderActive}
                  onMouseEnter={(_, idx) => setActiveIdx(idx)}
                  isAnimationActive
                  animationDuration={700}
                >
                  {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                  formatter={(v: number, n) => [`$${v.toFixed(2)}`, n as string]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{active?.name || "Total"}</div>
                <div className="text-xl font-semibold tabular-nums">${(active?.revenue ?? total).toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">{active ? `${active.qty} sold • ${((active.revenue / total) * 100).toFixed(1)}%` : `${totalQty} items`}</div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <button
                key={d.name}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${activeIdx === i ? "bg-secondary" : "hover:bg-secondary/50"}`}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-xs font-medium flex-1 truncate">{d.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">${d.revenue.toFixed(0)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{((d.revenue / total) * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
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

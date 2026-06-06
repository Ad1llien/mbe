import { useMemo, useState, useEffect } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Plus, Receipt, ArrowUpRight, ArrowDownRight, CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { API } from "@/lib/config";

const ranges = { "7d": 7, "30d": 30, "90d": 90 } as const;
type RangeKey = keyof typeof ranges;

export const Finance = () => {
  const { transactions, addTransaction, deals, stages } = useStore();
  const [compareMode, setCompareMode] = useState<"prev" | "custom">("prev");
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 60), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [open, setOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RangeKey | "custom">("30d");
  const [apiReceipts, setApiReceipts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/pos/receipts`)
      .then(r => r.json())
      .then(setApiReceipts);
  }, []);

  const days = activeTab !== "custom" ? ranges[activeTab as RangeKey] : 30;
  const now = new Date();

  const start = customRange?.from && activeTab === "custom"
    ? customRange.from
    : subDays(now, days);
  const end = customRange?.to && activeTab === "custom"
    ? customRange.to
    : now;

  const posIncome = apiReceipts
    .filter(r => !r.voided && isWithinInterval(parseISO(r.createdAt), { start, end }))
    .reduce((s, r) => s + r.total, 0);

  const series = useMemo(() => {
    const arr: { date: string; income: number }[] = [];
    const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = totalDays; i >= 0; i--) {
      const d = subDays(end, i);
      const key = format(d, "MMM d");
      const manualIncome = transactions
        .filter((t) => t.type === "income" && format(parseISO(t.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))
        .reduce((s, t) => s + t.amount, 0);
      const posDay = apiReceipts
        .filter(r => !r.voided && format(parseISO(r.createdAt), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))
        .reduce((s, r) => s + r.total, 0);
      arr.push({ date: key, income: manualIncome + posDay });
    }
    return arr;
  }, [transactions, apiReceipts, start, end]);

  const totalIncome = transactions
    .filter((t) => t.type === "income" && isWithinInterval(parseISO(t.date), { start, end }))
    .reduce((s, t) => s + t.amount, 0);

  const totalIncomeWithPos = totalIncome + posIncome;

  const totalExpense = transactions
    .filter((t) => t.type === "expense" && isWithinInterval(parseISO(t.date), { start, end }))
    .reduce((s, t) => s + t.amount, 0);

  const compareTotal = useMemo(() => {
    if (compareMode === "prev") {
      const prevStart = startOfMonth(subMonths(now, 1));
      const prevEnd = endOfMonth(subMonths(now, 1));
      return transactions
        .filter((t) => t.type === "income" && isWithinInterval(parseISO(t.date), { start: prevStart, end: prevEnd }))
        .reduce((s, t) => s + t.amount, 0);
    }
    const f = parseISO(customFrom);
    const tt = parseISO(customTo);
    return transactions
      .filter((t) => t.type === "income" && isWithinInterval(parseISO(t.date), { start: f, end: tt }))
      .reduce((s, t) => s + t.amount, 0);
  }, [compareMode, customFrom, customTo, transactions]);

  const diffPct = compareTotal > 0 ? Math.round(((totalIncome - compareTotal) / compareTotal) * 100) : 0;
  const completedDeals = deals.filter((d) => d.stageId === "completed");

  const rangeLabel = activeTab === "custom" && customRange?.from
    ? customRange.to
      ? `${format(customRange.from, "MMM d")} — ${format(customRange.to, "MMM d, yyyy")}`
      : format(customRange.from, "MMM d, yyyy")
    : `${format(start, "MMM d")} — ${format(now, "MMM d, yyyy")}`;

  return (
    <div className="fade-in">
      <SectionHeader
        title="Finance"
        subtitle="Income overview, comparisons, and synced deal payments."
        action={
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab !== "custom" ? activeTab : ""}
              onValueChange={(v) => {
                setActiveTab(v as RangeKey);
                setCustomRange(undefined);
              }}
            >
              <TabsList className="bg-secondary">
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
              </TabsList>
            </Tabs>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeTab === "custom" ? "default" : "outline"}
                  className="h-9 text-xs gap-1.5"
                  onClick={() => setActiveTab("custom")}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customRange?.from
                    ? customRange.to
                      ? `${format(customRange.from, "MMM d")} — ${format(customRange.to, "MMM d")}`
                      : format(customRange.from, "MMM d")
                    : "Custom"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-card border-border"
                align="end"
              >
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={(range) => {
                    setCustomRange(range);
                    if (range?.from && range?.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  disabled={{ after: now }}
                  className="bg-card text-foreground"
                />
              </PopoverContent>
            </Popover>

            <AddSaleDialog open={open} setOpen={setOpen} onAdd={addTransaction} />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat
          label={`Total income (${activeTab === "custom" ? "custom" : activeTab})`}
          value={`$${totalIncomeWithPos.toLocaleString()}`}
          delta={`${diffPct >= 0 ? "+" : ""}${diffPct}% vs ${compareMode === "prev" ? "last month" : "custom"}`}
          tone={totalIncomeWithPos > 0 ? "pos" : "neutral"}
        />
        <Stat
          label="Expenses"
          value={`$${totalExpense.toLocaleString()}`}
          delta={`${transactions.filter((t) => t.type === "expense").length} entries`}
          tone={totalExpense > 0 ? "neg" : "neutral"}
        />
        <Stat
          label="Net (income − expenses)"
          value={`${totalIncomeWithPos - totalExpense >= 0 ? "+" : "−"}$${Math.abs(totalIncomeWithPos - totalExpense).toLocaleString()}`}
          delta={totalIncomeWithPos - totalExpense > 0 ? "profit" : totalIncomeWithPos - totalExpense < 0 ? "loss" : "break-even"}
          tone={totalIncomeWithPos - totalExpense > 0 ? "pos" : totalIncomeWithPos - totalExpense < 0 ? "neg" : "neutral"}
        />
        <Stat
          label="Completed deals"
          value={`${completedDeals.length}`}
          delta="Synced from CRM"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Income trend</div>
              <div className="text-xs text-muted-foreground">{rangeLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={compareMode} onValueChange={(v) => setCompareMode(v as "prev" | "custom")}>
                <SelectTrigger className="w-[170px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prev">Compare: previous month</SelectItem>
                  <SelectItem value="custom">Compare: custom range</SelectItem>
                </SelectContent>
              </Select>
              {compareMode === "custom" && (
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 w-[140px] text-xs"
                  />
                  <span className="text-muted-foreground text-xs">→</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 w-[140px] text-xs"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Income"]}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="text-sm font-medium mb-3">Recent transactions</div>
          <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
            {transactions.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
                <div className={`h-8 w-8 rounded-lg grid place-items-center ${t.type === "income" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                  {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(parseISO(t.date), "MMM d, yyyy")} {t.receipt && `• ${t.receipt}`}
                  </div>
                </div>
                <div className={`text-xs font-semibold ${t.type === "income" ? "text-foreground" : "text-muted-foreground"}`}>
                  {t.type === "income" ? "+" : "−"}${t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Completed deals (from CRM)</div>
          <span className="text-xs text-muted-foreground">Auto-synced with payment receipts</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {completedDeals.map((d) => {
            const stage = stages.find((s) => s.id === d.stageId);
            return (
              <div key={d.id} className="rounded-xl bg-secondary/50 p-4 hairline">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{d.client}</div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(var(--${stage?.color}) / 0.15)`,
                      color: `hsl(var(--${stage?.color}))`,
                    }}
                  >
                    {stage?.label}
                  </span>
                </div>
                <div className="mt-1 font-medium">{d.title}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-lg font-semibold">${d.amount.toLocaleString()}</div>
                  <div className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Receipt className="h-3 w-3" /> Receipt issued
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

const AddSaleDialog = ({
  open,
  setOpen,
  onAdd,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  onAdd: (t: any) => void;
}) => {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Add sale
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Description</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Client name — Service" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (!label || !amount) return;
            onAdd({
              label,
              amount: Number(amount),
              type,
              date: new Date().toISOString(),
              receipt: type === "income" ? `RCPT-${1000 + Math.floor(Math.random() * 9000)}` : undefined,
            });
            setLabel("");
            setAmount("");
            setOpen(false);
          }}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
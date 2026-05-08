import { useMemo, useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { parseISO, isToday, isThisWeek, isThisMonth, isThisYear, subDays, isAfter, format, startOfDay } from "date-fns";

type Period = "day" | "week" | "month" | "halfyear" | "year";

const LABELS: Record<Period, string> = { day: "Today", week: "This week", month: "This month", halfyear: "Last 6 months", year: "This year" };

export const Reports = () => {
  const { receipts, transactions, deals } = useStore();
  const [period, setPeriod] = useState<Period>("week");

  const inPeriod = (iso: string) => {
    const d = parseISO(iso);
    if (period === "day") return isToday(d);
    if (period === "week") return isThisWeek(d, { weekStartsOn: 1 });
    if (period === "month") return isThisMonth(d);
    if (period === "halfyear") return isAfter(d, subDays(new Date(), 183));
    return isThisYear(d);
  };

  const periodReceipts = receipts.filter((r) => !r.voided && inPeriod(r.createdAt));
  const periodExpenses = transactions.filter((t) => t.type === "expense" && inPeriod(t.date));
  const periodIncome = transactions.filter((t) => t.type === "income" && inPeriod(t.date));
  const completedDeals = deals.filter((d) => d.stageId === "completed" && inPeriod(d.createdAt));

  const revenue = periodIncome.reduce((s, t) => s + t.amount, 0);
  const expense = periodExpenses.reduce((s, t) => s + t.amount, 0);
  const profit = revenue - expense;

  const chart = useMemo(() => {
    const buckets = period === "day" ? 24 : period === "week" ? 7 : period === "month" ? 30 : period === "halfyear" ? 26 : 12;
    const arr: { label: string; revenue: number; expense: number }[] = [];
    for (let i = buckets - 1; i >= 0; i--) {
      let label = ""; let from = 0; let to = 0;
      if (period === "day") {
        const h = new Date(); h.setHours(h.getHours() - i, 0, 0, 0);
        from = h.getTime(); to = from + 3600_000; label = format(h, "HH:00");
      } else if (period === "week" || period === "month") {
        const d = subDays(new Date(), i); from = startOfDay(d).getTime(); to = from + 86400000; label = format(d, period === "week" ? "EEE" : "d MMM");
      } else if (period === "halfyear") {
        const d = subDays(new Date(), i * 7); from = startOfDay(d).getTime(); to = from + 7 * 86400000; label = format(d, "d MMM");
      } else {
        const m = new Date(); m.setMonth(m.getMonth() - i, 1); m.setHours(0, 0, 0, 0); from = m.getTime();
        const next = new Date(m); next.setMonth(next.getMonth() + 1); to = next.getTime(); label = format(m, "MMM");
      }
      const rev = receipts.filter((r) => !r.voided).filter((r) => { const t = parseISO(r.createdAt).getTime(); return t >= from && t < to; }).reduce((s, r) => s + r.total, 0);
      const exp = transactions.filter((t) => t.type === "expense").filter((t) => { const tt = parseISO(t.date).getTime(); return tt >= from && tt < to; }).reduce((s, t) => s + t.amount, 0);
      arr.push({ label, revenue: rev, expense: exp });
    }
    return arr;
  }, [period, receipts, transactions]);

  const exportCSV = () => {
    const rows = [["Type", "Date", "Label", "Amount"]];
    periodIncome.forEach((t) => rows.push(["income", t.date, t.label, String(t.amount)]));
    periodExpenses.forEach((t) => rows.push(["expense", t.date, t.label, String(t.amount)]));
    const csv = rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="Reports"
        subtitle="Performance breakdowns by day, week, month, half-year and year."
        action={<Button variant="secondary" className="h-9" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>}
      />

      <div className="flex flex-wrap gap-1 mb-5 p-1 rounded-lg bg-secondary/50 w-fit hairline">
        {(["day", "week", "month", "halfyear", "year"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 h-8 text-xs rounded-md transition-all ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"}`}>
            {LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue" value={`$${revenue.toFixed(2)}`} delta={`${periodReceipts.length} receipts`} />
        <Stat label="Expenses" value={`$${expense.toFixed(2)}`} delta={`${periodExpenses.length} entries`} />
        <Stat label="Net profit" value={`${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(2)}`} delta={profit >= 0 ? "in the green" : "in the red"} />
        <Stat label="Deals closed" value={`${completedDeals.length}`} delta={`$${completedDeals.reduce((s, d) => s + d.amount, 0).toLocaleString()}`} />
      </div>

      <Panel>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium flex items-center gap-2"><FileBarChart2 className="h-4 w-4" /> Revenue vs expenses · {LABELS[period]}</div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer>
            <BarChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                formatter={(v: number, n) => [`$${v.toFixed(2)}`, n as string]} />
              <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};

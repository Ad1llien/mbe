import { useMemo, useState, useEffect, useRef } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileBarChart2, FileText, Printer, Braces, Table2, Loader2, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import {
  parseISO, isToday, isThisWeek, isThisMonth, isThisYear,
  subDays, subYears, isAfter, format, startOfDay,
} from "date-fns";
import { API } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";

type Period = "day" | "week" | "month" | "halfyear" | "year";
const LABELS: Record<Period, string> = {
  day: "Today", week: "This week", month: "This month",
  halfyear: "Last 6 months", year: "This year",
};

/* ─────────────────────────────────────────
   Dual-handle range slider
───────────────────────────────────────── */
function RangeSlider({ fromTs, toTs, minTs, maxTs, onChange }: {
  fromTs: number; toTs: number; minTs: number; maxTs: number;
  onChange: (from: number, to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // All mutable values in one ref so the effect closure stays stable
  const s = useRef({ fromTs, toTs, minTs, maxTs, onChange, dragging: null as "from" | "to" | null });
  s.current.fromTs = fromTs;
  s.current.toTs   = toTs;
  s.current.minTs  = minTs;
  s.current.maxTs  = maxTs;
  s.current.onChange = onChange;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { dragging, fromTs, toTs, minTs, maxTs, onChange } = s.current;
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const ts   = minTs + (pct / 100) * (maxTs - minTs);
      const DAY  = 86_400_000;
      if (dragging === "from") onChange(Math.min(ts, toTs - DAY), toTs);
      else                     onChange(fromTs, Math.max(ts, fromTs + DAY));
    };
    const onUp = () => { s.current.dragging = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []); // single registration, reads from ref

  const range   = (maxTs - minTs) || 1;
  const fromPct = Math.max(0, Math.min(100, ((fromTs - minTs) / range) * 100));
  const toPct   = Math.max(0, Math.min(100, ((toTs   - minTs) / range) * 100));

  // tick marks (up to 12 months)
  const ticks: { pct: number; label: string }[] = [];
  const span = maxTs - minTs;
  const tickMs = span > 365 * 86_400_000 * 2 ? 365 * 86_400_000
               : span > 180 * 86_400_000     ? 30  * 86_400_000
               : span > 60  * 86_400_000     ? 7   * 86_400_000
               :                               86_400_000;
  let t = new Date(minTs); t.setDate(1); t.setHours(0,0,0,0);
  while (t.getTime() < maxTs) {
    const pct = ((t.getTime() - minTs) / range) * 100;
    if (pct > 0 && pct < 100) ticks.push({ pct, label: format(t, span > 180 * 86_400_000 ? "MMM yy" : "d MMM") });
    t = new Date(t.getTime() + tickMs);
    if (ticks.length > 11) break;
  }

  return (
    <div className="select-none">
      <div ref={trackRef} className="relative h-5 flex items-center mx-1">
        {/* track bg */}
        <div className="absolute w-full h-1.5 bg-secondary rounded-full" />
        {/* active range */}
        <div className="absolute h-1.5 bg-primary/60 rounded-full transition-all"
          style={{ left: `${fromPct}%`, width: `${toPct - fromPct}%` }} />
        {/* from handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary border-2 border-background shadow-md cursor-grab hover:scale-110 transition-transform z-10"
          style={{ left: `${fromPct}%` }}
          onMouseDown={e => { e.preventDefault(); s.current.dragging = "from"; }}
        />
        {/* to handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary border-2 border-background shadow-md cursor-grab hover:scale-110 transition-transform z-10"
          style={{ left: `${toPct}%` }}
          onMouseDown={e => { e.preventDefault(); s.current.dragging = "to"; }}
        />
      </div>
      {/* ticks */}
      <div className="relative h-4 mt-1 mx-1">
        {ticks.map(tk => (
          <span key={tk.pct} className="absolute text-[9px] text-muted-foreground -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${tk.pct}%` }}>
            {tk.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Export Modal
───────────────────────────────────────── */
type ExportFmt = "csv" | "excel" | "json" | "pdf";

function ExportModal({ open, onClose, apiReceipts, transactions, deals }: {
  open: boolean; onClose: () => void;
  apiReceipts: any[]; transactions: any[]; deals: any[];
}) {
  const now     = Date.now();
  const oneYear = subYears(new Date(), 1).getTime();

  // Derive min date from actual data
  const minTs = useMemo(() => {
    const dates = [
      oneYear,
      ...apiReceipts.map(r => { try { return parseISO(r.createdAt).getTime(); } catch { return now; } }),
      ...transactions.map(t => { try { return parseISO(t.date).getTime();    } catch { return now; } }),
    ].filter(Number.isFinite);
    return Math.min(...dates, oneYear);
  }, [apiReceipts, transactions]);

  const [fromTs, setFromTs] = useState(() => subDays(new Date(), 30).getTime());
  const [toTs,   setToTs]   = useState(now);
  const [fmt,    setFmt]    = useState<ExportFmt>("csv");
  const [loading, setLoading] = useState(false);

  const fromDate = new Date(fromTs);
  const toDate   = new Date(toTs);

  const inRange = (iso: string) => {
    try {
      const d = parseISO(iso).getTime();
      return d >= fromTs && d <= toTs + 86_400_000;
    } catch { return false; }
  };

  const rangeReceipts  = apiReceipts.filter(r => !r.voided && inRange(r.createdAt));
  const rangeIncome    = transactions.filter(t => t.type === "income"  && inRange(t.date));
  const rangeExpenses  = transactions.filter(t => t.type === "expense" && inRange(t.date));
  const totalRevenue   = rangeReceipts.reduce((s, r) => s + r.total, 0) + rangeIncome.reduce((s, t) => s + t.amount, 0);
  const totalExpense   = rangeExpenses.reduce((s, t) => s + t.amount, 0);
  const profit         = totalRevenue - totalExpense;

  const PRESETS = [
    { label: "Today",     days: 0   },
    { label: "7 days",    days: 7   },
    { label: "30 days",   days: 30  },
    { label: "3 months",  days: 90  },
    { label: "6 months",  days: 183 },
    { label: "This year", days: 365 },
    { label: "All time",  days: Math.ceil((now - minTs) / 86_400_000) + 1 },
  ];

  const applyPreset = (days: number) => {
    setToTs(now);
    setFromTs(days === 0 ? startOfDay(new Date()).getTime() : subDays(new Date(), days).getTime());
  };

  /* ── helpers ── */
  const trigger = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click(); URL.revokeObjectURL(url);
  };

  const fileName = (ext: string) =>
    `report-${format(fromDate, "yyyy-MM-dd")}-to-${format(toDate, "yyyy-MM-dd")}.${ext}`;

  /* ── CSV ── */
  const doCSV = () => {
    const rows: string[][] = [["Type", "Date", "Description", "Amount"]];
    rangeReceipts.forEach(r => rows.push(["POS Sale", r.createdAt?.slice(0, 10) ?? "", `Receipt #${r.number ?? r.id?.slice(0, 8)}`, String(r.total)]));
    rangeIncome.forEach(t   => rows.push(["Income",   t.date, t.label, String(t.amount)]));
    rangeExpenses.forEach(t => rows.push(["Expense",  t.date, t.label, String(t.amount)]));
    rows.push([], ["", "", "Total Revenue",  totalRevenue.toFixed(2)]);
    rows.push(    ["", "", "Total Expenses", totalExpense.toFixed(2)]);
    rows.push(    ["", "", "Net Profit",     profit.toFixed(2)]);
    const csv = rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
    trigger(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), fileName("csv"));
  };

  /* ── Excel (HTML table trick, no deps) ── */
  const doExcel = () => {
    const r2row = (cells: (string | number)[]) =>
      `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
    const table = [
      r2row(["Type", "Date", "Description", "Amount"]),
      ...rangeReceipts.map(r => r2row(["POS Sale", r.createdAt?.slice(0, 10), `Receipt #${r.number ?? r.id?.slice(0, 8)}`, r.total])),
      ...rangeIncome.map(t   => r2row(["Income",   t.date, t.label, t.amount])),
      ...rangeExpenses.map(t => r2row(["Expense",  t.date, t.label, t.amount])),
      r2row([]), r2row(["", "", "Total Revenue",  totalRevenue]),
      r2row(["", "", "Total Expenses", totalExpense]),
      r2row(["", "", "Net Profit",     profit]),
    ].join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
      <x:ExcelWorksheet><x:Name>Report</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head><body><table>${table}</table></body></html>`;
    trigger(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName("xls"));
  };

  /* ── JSON ── */
  const doJSON = () => {
    const data = {
      generated: new Date().toISOString(),
      period: { from: format(fromDate, "yyyy-MM-dd"), to: format(toDate, "yyyy-MM-dd") },
      summary: { revenue: totalRevenue, expenses: totalExpense, profit },
      pos_sales: rangeReceipts.map(r => ({ id: r.id, date: r.createdAt, number: r.number, total: r.total, items: r.items })),
      income:    rangeIncome.map(t   => ({ date: t.date,  label: t.label, amount: t.amount })),
      expenses:  rangeExpenses.map(t => ({ date: t.date, label: t.label, amount: t.amount })),
    };
    trigger(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), fileName("json"));
  };

  /* ── PDF (print window) ── */
  const doPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const badge = (type: string) => {
      const c = type === "POS Sale" ? "#16a34a;background:#f0fdf4"
              : type === "Income"   ? "#2563eb;background:#eff6ff"
              :                       "#dc2626;background:#fef2f2";
      return `<span style="color:${c};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">${type}</span>`;
    };
    const rows = [
      ...rangeReceipts.map(r  => `<tr><td>${badge("POS Sale")}</td><td>${r.createdAt?.slice(0,10)}</td><td>Receipt #${r.number ?? r.id?.slice(0,8)}</td><td style="text-align:right">$${(r.total??0).toFixed(2)}</td></tr>`),
      ...rangeIncome.map(t    => `<tr><td>${badge("Income")}</td><td>${t.date}</td><td>${t.label}</td><td style="text-align:right">$${t.amount.toFixed(2)}</td></tr>`),
      ...rangeExpenses.map(t  => `<tr><td>${badge("Expense")}</td><td>${t.date}</td><td>${t.label}</td><td style="text-align:right; color:#dc2626">$${t.amount.toFixed(2)}</td></tr>`),
    ].join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Report</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,sans-serif;padding:40px;color:#111;font-size:13px}
      h1{font-size:22px;font-weight:700;margin-bottom:4px}
      .sub{color:#666;margin-bottom:28px}
      .stats{display:flex;gap:20px;margin-bottom:28px}
      .s{background:#f5f5f5;border-radius:10px;padding:14px 22px}
      .sl{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:4px}
      .sv{font-size:24px;font-weight:700}
      .green{color:#16a34a}.red{color:#dc2626}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;border-bottom:2px solid #eee;padding:9px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#888}
      td{border-bottom:1px solid #f0f0f0;padding:8px 10px;vertical-align:middle}
      @media print{body{padding:20px}}
    </style></head><body>
    <h1>Financial Report</h1>
    <div class="sub">${format(fromDate,"MMMM d, yyyy")} — ${format(toDate,"MMMM d, yyyy")}</div>
    <div class="stats">
      <div class="s"><div class="sl">Revenue</div><div class="sv green">$${totalRevenue.toFixed(2)}</div></div>
      <div class="s"><div class="sl">Expenses</div><div class="sv red">$${totalExpense.toFixed(2)}</div></div>
      <div class="s"><div class="sl">Net Profit</div><div class="sv ${profit>=0?"green":"red"}">${profit>=0?"+":"−"}$${Math.abs(profit).toFixed(2)}</div></div>
    </div>
    <table>
      <tr><th>Type</th><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr>
      ${rows}
    </table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`);
    win.document.close();
  };

  const handleExport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // "thinking" delay
    if (fmt === "csv")   doCSV();
    else if (fmt === "excel") doExcel();
    else if (fmt === "json")  doJSON();
    else doPDF();
    setLoading(false);
    onClose();
  };

  const FORMATS: { id: ExportFmt; icon: React.ElementType; label: string; ext: string; desc: string }[] = [
    { id: "csv",   icon: FileText,  label: "CSV",   ext: ".csv", desc: "Excel · Sheets"        },
    { id: "excel", icon: Table2,    label: "Excel", ext: ".xls", desc: "Microsoft Excel"        },
    { id: "json",  icon: Braces,    label: "JSON",  ext: ".json",desc: "Raw data"               },
    { id: "pdf",   icon: Printer,   label: "PDF",   ext: ".pdf", desc: "Print · Save as PDF"    },
  ];

  const total = rangeReceipts.length + rangeIncome.length + rangeExpenses.length;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" /> Export Report
          </DialogTitle>
        </DialogHeader>

        {/* ── Date Range ── */}
        <div className="space-y-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date range</div>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.days)}
                className="px-2.5 h-6 text-[11px] rounded-full border border-border hover:bg-secondary transition-colors">
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <RangeSlider
            fromTs={fromTs} toTs={toTs} minTs={minTs} maxTs={now}
            onChange={(f, t) => { setFromTs(f); setToTs(t); }}
          />

          {/* Date inputs */}
          <div className="flex items-center gap-2 pt-1">
            <input type="date"
              value={format(fromDate, "yyyy-MM-dd")}
              onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setFromTs(d.getTime()); }}
              className="flex-1 h-8 text-xs px-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors" />
            <span className="text-muted-foreground text-xs">→</span>
            <input type="date"
              value={format(toDate, "yyyy-MM-dd")}
              onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setToTs(d.getTime()); }}
              className="flex-1 h-8 text-xs px-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors" />
          </div>

          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{rangeReceipts.length} POS receipts</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{rangeIncome.length} income</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{rangeExpenses.length} expenses</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">{total} total rows</span>
          </div>
        </div>

        {/* ── Format ── */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">File format</div>
          <div className="grid grid-cols-4 gap-2">
            {FORMATS.map(({ id, icon: Icon, label, ext, desc }) => (
              <button key={id} onClick={() => setFmt(id)}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  fmt === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-secondary/30")}>
                <Icon className={cn("h-5 w-5", fmt === id ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-semibold", fmt === id ? "text-primary" : "")}>{label}</span>
                <span className="text-[9px] text-muted-foreground leading-tight text-center">{ext}</span>
                <span className="text-[9px] text-muted-foreground leading-tight text-center">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-muted-foreground space-x-2">
            <span className="text-green-500 font-medium">${totalRevenue.toFixed(2)}</span>
            <span className="text-muted-foreground">revenue</span>
            <span className="text-destructive font-medium">${totalExpense.toFixed(2)}</span>
            <span className="text-muted-foreground">expenses</span>
          </div>
          <Button onClick={handleExport} disabled={loading || total === 0} className="min-w-[130px] gap-2">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────
   Main Reports page
───────────────────────────────────────── */
export const Reports = () => {
  const { transactions, deals } = useStore();
  const user = useAuthStore(s => s.user);
  const [period, setPeriod]       = useState<Period>("week");
  const [apiReceipts, setApiReceipts] = useState<any[]>([]);
  const [exportOpen, setExportOpen]   = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/pos/receipts?ownerId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setApiReceipts(data); });
  }, [user?.id]);

  const inPeriod = (iso: string) => {
    const d = parseISO(iso);
    if (period === "day")      return isToday(d);
    if (period === "week")     return isThisWeek(d, { weekStartsOn: 1 });
    if (period === "month")    return isThisMonth(d);
    if (period === "halfyear") return isAfter(d, subDays(new Date(), 183));
    return isThisYear(d);
  };

  const periodReceipts = apiReceipts.filter(r => !r.voided && inPeriod(r.createdAt));
  const posRevenue     = periodReceipts.reduce((s, r) => s + r.total, 0);
  const periodExpenses = transactions.filter(t => t.type === "expense" && inPeriod(t.date));
  const periodIncome   = transactions.filter(t => t.type === "income"  && inPeriod(t.date));
  const manualRevenue  = periodIncome.reduce((s, t) => s + t.amount, 0);
  const completedDeals = deals.filter(d => d.stageId === "completed" && inPeriod(d.createdAt));
  const revenue        = posRevenue + manualRevenue;
  const expense        = periodExpenses.reduce((s, t) => s + t.amount, 0);
  const profit         = revenue - expense;

  const chart = useMemo(() => {
    const buckets = period === "day" ? 24 : period === "week" ? 7 : period === "month" ? 30 : period === "halfyear" ? 26 : 12;
    return Array.from({ length: buckets }, (_, idx) => {
      const i = buckets - 1 - idx;
      let label = "", from = 0, to = 0;
      if (period === "day") {
        const h = new Date(); h.setHours(h.getHours() - i, 0, 0, 0);
        from = h.getTime(); to = from + 3_600_000; label = format(h, "HH:00");
      } else if (period === "week" || period === "month") {
        const d = subDays(new Date(), i); from = startOfDay(d).getTime(); to = from + 86_400_000;
        label = format(d, period === "week" ? "EEE" : "d MMM");
      } else if (period === "halfyear") {
        const d = subDays(new Date(), i * 7); from = startOfDay(d).getTime(); to = from + 7 * 86_400_000;
        label = format(d, "d MMM");
      } else {
        const m = new Date(); m.setMonth(m.getMonth() - i, 1); m.setHours(0,0,0,0); from = m.getTime();
        const nxt = new Date(m); nxt.setMonth(nxt.getMonth() + 1); to = nxt.getTime(); label = format(m, "MMM");
      }
      const inBucket = (ts: number) => ts >= from && ts < to;
      const posRev    = apiReceipts.filter(r => !r.voided && inBucket(parseISO(r.createdAt).getTime())).reduce((s, r) => s + r.total, 0);
      const manualRev = transactions.filter(t => t.type === "income"  && inBucket(parseISO(t.date).getTime())).reduce((s, t) => s + t.amount, 0);
      const exp       = transactions.filter(t => t.type === "expense" && inBucket(parseISO(t.date).getTime())).reduce((s, t) => s + t.amount, 0);
      const rev       = posRev + manualRev;
      return { label, revenue: rev, expense: exp, profit: rev - exp };
    });
  }, [period, apiReceipts, transactions]);

  return (
    <div className="fade-in">
      <SectionHeader
        title="Reports"
        subtitle="Performance breakdowns by day, week, month, half-year and year."
        action={
          <Button variant="secondary" className="h-9" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        }
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        apiReceipts={apiReceipts}
        transactions={transactions}
        deals={deals}
      />

      <div className="flex flex-wrap gap-1 mb-5 p-1 rounded-lg bg-secondary/50 w-fit hairline">
        {(["day","week","month","halfyear","year"] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 h-8 text-xs rounded-md transition-all ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"}`}>
            {LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue"      value={`$${revenue.toFixed(2)}`}  delta={`${periodReceipts.length} POS + ${periodIncome.length} manual`} tone={revenue > 0 ? "pos" : "neutral"} />
        <Stat label="Expenses"     value={`$${expense.toFixed(2)}`}  delta={`${periodExpenses.length} entries`} tone={expense > 0 ? "neg" : "neutral"} />
        <Stat label="Net profit"   value={`${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(2)}`} delta={profit >= 0 ? "in the green" : "in the red"} tone={profit >= 0 ? "pos" : "neg"} />
        <Stat label="Deals closed" value={`${completedDeals.length}`} delta={`$${completedDeals.reduce((s,d) => s + d.amount, 0).toLocaleString()}`} tone={completedDeals.length > 0 ? "pos" : "neutral"} />
      </div>

      <Panel>
        <div className="text-sm font-medium flex items-center gap-2 mb-1">
          <FileBarChart2 className="h-4 w-4" /> Revenue vs expenses · {LABELS[period]}
        </div>
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-6 rounded-full inline-block" style={{ background: "hsl(var(--stage-completed))" }} /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-6 rounded-full inline-block" style={{ background: "hsl(var(--destructive))" }} /> Expenses
          </span>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                formatter={(v: number, n) => [`$${v.toFixed(2)}`, n as string]}
              />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--stage-completed))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" name="Expenses" stroke="hsl(var(--destructive))"    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};


import { useMemo, useState } from "react";
import { useStore, StaffRole } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, KeyRound, Clock, Trash2, Power, Copy, ShieldCheck, Target, ChevronDown, ChevronUp } from "lucide-react";
import { differenceInMinutes, parseISO, format, isThisWeek, isThisMonth, isToday } from "date-fns";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { toast } from "@/hooks/use-toast";

const ROLES: StaffRole[] = ["owner", "manager", "cashier", "barista", "sales"];
const ROLE_COLORS: Record<StaffRole, string> = {
  owner: "stage-completed",
  manager: "stage-progress",
  cashier: "stage-noresponse",
  barista: "stage-new",
  sales: "stage-completed",
};

export const StaffPage = () => {
  const { staff, shifts, deals, addStaff, removeStaff, resetPin, updateStaff, clockIn, clockOut } = useStore();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [activeIdx, setActiveIdx] = useState(0);
  const [form, setForm] = useState({ name: "", role: "cashier" as StaffRole, phone: "", email: "", kpiTarget: "0", pin: "" });

  const onShiftIds = new Set(shifts.filter((sh) => !sh.end).map((sh) => sh.staffId));
  const activeStaff = staff.filter((s) => onShiftIds.has(s.id));

  const isInPeriod = (iso: string) => {
    const d = parseISO(iso);
    if (period === "day") return isToday(d);
    if (period === "week") return isThisWeek(d, { weekStartsOn: 1 });
    return isThisMonth(d);
  };

  const kpiData = useMemo(() => {
    const salesPeople = staff.filter((s) => ["sales", "manager", "owner"].includes(s.role));
    const completedDeals = deals.filter((d) => d.stageId === "completed" && isInPeriod(d.createdAt));
    // distribute deals round-robin (no assignee in model) — visualisation purpose
    return salesPeople.map((p, i) => {
      const mine = completedDeals.filter((_, j) => j % salesPeople.length === i);
      return { name: p.name.split(" ")[0], value: mine.length, revenue: mine.reduce((s, d) => s + d.amount, 0), target: p.kpiTarget || 0 };
    });
  }, [staff, deals, period]);

  const totalKPI = kpiData.reduce((s, d) => s + d.value, 0);

  const submit = () => {
    if (!form.name) return;
    addStaff({
      name: form.name, role: form.role,
      phone: form.phone, email: form.email,
      kpiTarget: Number(form.kpiTarget) || 0,
      pin: form.pin && /^\d{8}$/.test(form.pin) ? form.pin : undefined,
    });
    setForm({ name: "", role: "cashier", phone: "", email: "", kpiTarget: "0", pin: "" });
    setOpen(false);
    toast({ title: "Staff member created", description: "An 8-digit PIN was issued." });
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="Staff"
        subtitle="Active shifts, KPIs, PINs and access management."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add staff</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New staff member</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v: StaffRole) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>KPI target / month</Label><Input type="number" value={form.kpiTarget} onChange={(e) => setForm({ ...form, kpiTarget: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div>
                  <Label>8-digit PIN (auto-generated if empty)</Label>
                  <Input value={form.pin} maxLength={8} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} placeholder="auto" />
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="On shift now" value={`${activeStaff.length}`} delta={activeStaff.length ? "live" : "nobody"} />
        <Stat label="Total team" value={`${staff.length}`} delta={`${staff.filter(s => s.role === "sales").length} in sales`} />
        <Stat label="KPI this period" value={`${totalKPI}`} delta={period} />
        <Stat label="Avg shift today" value={(() => {
          const todays = shifts.filter((sh) => isToday(parseISO(sh.start)));
          if (!todays.length) return "—";
          const mins = todays.reduce((s, sh) => s + differenceInMinutes(sh.end ? parseISO(sh.end) : new Date(), parseISO(sh.start)), 0) / todays.length;
          return `${(mins / 60).toFixed(1)}h`;
        })()} delta="hours" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Team</div>
          <div className="space-y-2">
            {staff.map((p) => {
              const openShift = shifts.find((sh) => sh.staffId === p.id && !sh.end);
              const mins = openShift ? differenceInMinutes(new Date(), parseISO(openShift.start)) : 0;
              const myDeals = deals.filter((_, i) => i % Math.max(1, staff.filter((x) => x.role === "sales" || x.role === "manager" || x.role === "owner").length) === 0 && (p.role === "sales" || p.role === "manager" || p.role === "owner"));
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-lg bg-secondary/40 hairline overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/70 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                      {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {p.name}
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `hsl(var(--${ROLE_COLORS[p.role]}) / 0.18)`, color: `hsl(var(--${ROLE_COLORS[p.role]}))` }}>{p.role}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{p.phone} • PIN •••• {p.pin.slice(-4)}</div>
                    </div>
                    {openShift ? (
                      <span className="text-[10px] text-[hsl(var(--stage-completed))] flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--stage-completed))] animate-pulse" /> {Math.floor(mins / 60)}h {mins % 60}m</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">off</span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-2 border-t border-border space-y-3 bg-background/40">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <Info label="Hired" value={format(parseISO(p.hiredAt), "MMM d, yyyy")} />
                        <Info label="Email" value={p.email || "—"} />
                        <Info label="KPI target" value={p.kpiTarget ? `${p.kpiTarget}/mo` : "—"} />
                      </div>
                      {(p.role === "sales" || p.role === "manager" || p.role === "owner") && (
                        <div className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> KPI progress</span>
                            <span className="font-semibold">{myDeals.length}/{p.kpiTarget || "—"}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, p.kpiTarget ? (myDeals.length / p.kpiTarget) * 100 : 0)}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {openShift ? (
                          <Button size="sm" variant="secondary" className="h-8" onClick={() => clockOut(p.id)}><Power className="h-3 w-3 mr-1" /> Clock out</Button>
                        ) : (
                          <Button size="sm" variant="secondary" className="h-8" onClick={() => clockIn(p.id)}><Power className="h-3 w-3 mr-1" /> Clock in</Button>
                        )}
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => {
                          const np = resetPin(p.id);
                          navigator.clipboard?.writeText(np);
                          toast({ title: "New PIN issued", description: `${np} (copied)` });
                        }}><KeyRound className="h-3 w-3 mr-1" /> Reset PIN</Button>
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => {
                          navigator.clipboard?.writeText(p.pin);
                          toast({ title: "PIN copied" });
                        }}><Copy className="h-3 w-3 mr-1" /> Copy PIN</Button>
                        {p.role !== "owner" && (
                          <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => removeStaff(p.id)}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Sales KPI</div>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="h-7 w-[100px] text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {totalKPI === 0 ? (
            <div className="text-xs text-muted-foreground py-12 text-center">No completed deals in this period</div>
          ) : (
            <>
              <div className="h-[200px] relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={kpiData} dataKey="value" nameKey="name"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={2} stroke="none"
                      onMouseEnter={(_, idx) => setActiveIdx(idx)}
                      isAnimationActive animationDuration={600}
                    >
                      {kpiData.map((_, i) => (
                        <Cell key={i} fill={`hsl(var(--${["stage-completed", "stage-progress", "stage-noresponse", "stage-new"][i % 4]}))`} opacity={i === activeIdx ? 1 : 0.7} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                      formatter={(v: number, n) => [`${v} deals`, n as string]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpiData[activeIdx]?.name || "Total"}</div>
                    <div className="text-2xl font-semibold">{kpiData[activeIdx]?.value ?? totalKPI}</div>
                    <div className="text-[10px] text-muted-foreground">{kpiData[activeIdx] ? `$${kpiData[activeIdx].revenue.toLocaleString()}` : "deals"}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                {kpiData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--${["stage-completed", "stage-progress", "stage-noresponse", "stage-new"][i % 4]}))` }} />
                    <span className="flex-1">{d.name}</span>
                    <span className="tabular-nums text-muted-foreground">{d.value}/{d.target || "—"}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-secondary/40 p-2">
    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="text-xs font-medium truncate">{value}</div>
  </div>
);

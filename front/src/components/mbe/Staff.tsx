import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, KeyRound, Clock, Trash2, Copy, ShieldCheck, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, ScrollText, ShieldAlert, ShieldCheck as ShieldOk, Timer, TimerOff, CalendarClock, Pencil as PencilLine } from "lucide-react";
import { parseISO, format, isThisWeek, isThisMonth, isToday, startOfWeek, endOfWeek, differenceInMinutes } from "date-fns";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { toast } from "@/hooks/use-toast";

const API = "http://localhost:3000";
const ROLES = ["owner", "manager", "cashier", "barista", "sales"];
const STATUSES = [
  { id: "active",   label: "Active",   color: "stage-completed" },
  { id: "on_leave", label: "On leave", color: "stage-progress"  },
  { id: "inactive", label: "Inactive", color: "muted-foreground" },
];
const ROLE_COLORS: Record<string, string> = {
  owner: "stage-completed",
  manager: "stage-progress",
  cashier: "stage-noresponse",
  barista: "stage-new",
  sales: "stage-completed",
};
const ACTIVITY_ICONS: Record<string, string> = {
  login: "🔑", shift_start: "▶️", shift_end: "⏹️", sale: "💰", verified: "✅",
};

export const StaffPage = () => {
  const user = useAuthStore((s) => s.user);
  const { deals } = useStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [activeIdx, setActiveIdx] = useState(0);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", role: "cashier", phone: "", email: "", kpiTarget: "0", pin: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "cashier", phone: "", kpiTarget: "0" });

  // Activity log
  const [activityStaff, setActivityStaff] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const activitySkipRef = useRef(0);

  // Shifts / time tracking
  // shiftsData[staffId] = { shifts, totalMinutes, activeShift }
  const [shiftsData, setShiftsData] = useState<Record<string, any>>({});
  const [hoursTarget, setHoursTarget] = useState<any | null>(null); // staff whose shifts dialog is open
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [editShiftForm, setEditShiftForm] = useState({ clockIn: "", clockOut: "" });

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/staff?ownerId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStaff(data); });
  }, [user?.id]);

  const isInPeriod = (iso: string) => {
    const d = parseISO(iso);
    if (period === "day") return isToday(d);
    if (period === "week") return isThisWeek(d, { weekStartsOn: 1 });
    return isThisMonth(d);
  };

  const kpiData = useMemo(() => {
    const salesPeople = staff.filter((s) => ["sales", "manager", "owner"].includes(s.role));
    const completedDeals = deals.filter((d) => d.stageId === "completed" && isInPeriod(d.createdAt));
    return salesPeople.map((p, i) => {
      const mine = completedDeals.filter((_, j) => j % salesPeople.length === i);
      return { id: p.id, name: p.name.split(" ")[0], value: mine.length, revenue: mine.reduce((s, d) => s + d.amount, 0), target: p.kpiTarget || 0 };
    });
  }, [staff, deals, period]);

  const kpiMap = useMemo(() => Object.fromEntries(kpiData.map(d => [d.id, d])), [kpiData]);
  const totalKPI = kpiData.reduce((s, d) => s + d.value, 0);

  // Validate create form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Required";
    if (!form.email.trim()) errors.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email";
    if (!form.phone.trim()) errors.phone = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm() || !user?.id) return;
    const raw = await fetch(`${API}/staff?ownerId=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        kpiTarget: Number(form.kpiTarget) || 0,
        pin: form.pin && /^\d{8}$/.test(form.pin) ? form.pin : undefined,
      }),
    });
    const res = await raw.json();

    if (!raw.ok) {
      // Show server error (e.g. duplicate email)
      const msg = res?.message ?? "Failed to create staff member";
      setFormErrors(prev => ({ ...prev, email: Array.isArray(msg) ? msg[0] : msg }));
      return;
    }

    if (res.id) {
      setStaff(prev => [...prev, res]);
      setTempPassword(res.tempPassword);
      setForm({ name: "", role: "cashier", phone: "", email: "", kpiTarget: "0", pin: "" });
      setFormErrors({});
      setOpen(false);
      toast({ title: "Staff created", description: res.tempPassword ? "Temp password: " + res.tempPassword : "Created" });
    }
  };

  const handleResetPin = async (id: string) => {
    const res = await fetch(`${API}/staff/${id}/pin`, { method: "PATCH" }).then(r => r.json());
    navigator.clipboard?.writeText(res.pin);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, pin: res.pin } : s));
    toast({ title: "New PIN issued", description: `${res.pin} (copied)` });
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/staff/${id}`, { method: "DELETE" });
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`${API}/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(r => r.json());
    setStaff(prev => prev.map(s => s.id === res.id ? res : s));
  };

  const openEdit = (p: any) => {
    setEditTarget(p);
    setEditForm({ name: p.name, role: p.role, phone: p.phone || "", kpiTarget: String(p.kpiTarget || 0) });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const res = await fetch(`${API}/staff/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, role: editForm.role, phone: editForm.phone, kpiTarget: Number(editForm.kpiTarget) }),
    }).then(r => r.json());
    setStaff(prev => prev.map(s => s.id === res.id ? res : s));
    setEditTarget(null);
    toast({ title: "Saved" });
  };

  // Activity log
  const loadActivity = useCallback(async (staffId: string, skip: number, reset = false) => {
    setActivityLoading(true);
    const res = await fetch(`${API}/staff/${staffId}/activity?skip=${skip}&take=10`).then(r => r.json());
    setActivities(prev => reset ? res.items : [...prev, ...res.items]);
    setActivityTotal(res.total);
    activitySkipRef.current = skip + res.items.length;
    setActivityLoading(false);
  }, []);

  const openActivity = (p: any) => {
    setActivityStaff(p);
    setActivities([]);
    activitySkipRef.current = 0;
    loadActivity(p.id, 0, true);
  };

  // Load this week's shifts for a staff member
  const loadShifts = useCallback(async (staffId: string) => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const to   = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const res = await fetch(`${API}/staff/${staffId}/shifts?from=${from}&to=${to}`).then(r => r.json());
    setShiftsData(prev => ({ ...prev, [staffId]: res }));
    return res;
  }, []);

  const handleClockIn = async (staffId: string) => {
    const res = await fetch(`${API}/staff/${staffId}/clock-in`, { method: "POST" }).then(r => r.json());
    if (res.error) { toast({ title: res.error }); return; }
    await loadShifts(staffId);
    toast({ title: "Clocked in ▶️" });
  };

  const handleClockOut = async (staffId: string) => {
    const res = await fetch(`${API}/staff/${staffId}/clock-out`, { method: "PATCH" }).then(r => r.json());
    if (res.error) { toast({ title: res.error }); return; }
    await loadShifts(staffId);
    toast({ title: "Clocked out ⏹️" });
  };

  const openHoursDialog = async (p: any) => {
    setHoursTarget(p);
    await loadShifts(p.id);
  };

  const openEditShift = (shift: any) => {
    setEditingShift(shift);
    setEditShiftForm({
      clockIn:  format(parseISO(shift.clockIn),  "yyyy-MM-dd'T'HH:mm"),
      clockOut: shift.clockOut ? format(parseISO(shift.clockOut), "yyyy-MM-dd'T'HH:mm") : "",
    });
  };

  const handleSaveShift = async () => {
    if (!editingShift) return;
    await fetch(`${API}/staff/shifts/${editingShift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clockIn:  editShiftForm.clockIn  ? new Date(editShiftForm.clockIn).toISOString()  : undefined,
        clockOut: editShiftForm.clockOut ? new Date(editShiftForm.clockOut).toISOString() : undefined,
        editedBy: user?.id,
      }),
    });
    await loadShifts(editingShift.staffId);
    setEditingShift(null);
    toast({ title: "Shift updated" });
  };

  const handleDeleteShift = async (shiftId: string, staffId: string) => {
    await fetch(`${API}/staff/shifts/${shiftId}`, { method: "DELETE" });
    await loadShifts(staffId);
    toast({ title: "Shift deleted" });
  };

  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="Staff"
        subtitle="Active shifts, KPIs, PINs and access management."
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFormErrors({}); }}>
            <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add staff</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New staff member</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Full name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={formErrors.name ? "border-destructive" : ""} />
                  {formErrors.name && <p className="text-[11px] text-destructive mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={formErrors.email ? "border-destructive" : ""} />
                  {formErrors.email && <p className="text-[11px] text-destructive mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={formErrors.phone ? "border-destructive" : ""} placeholder="+7 777 000 00 00" />
                  {formErrors.phone && <p className="text-[11px] text-destructive mt-1">{formErrors.phone}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>KPI target / month</Label><Input type="number" value={form.kpiTarget} onChange={(e) => setForm({ ...form, kpiTarget: e.target.value })} /></div>
                </div>
                <div>
                  <Label>8-digit PIN <span className="text-muted-foreground text-[11px]">(auto if empty)</span></Label>
                  <Input value={form.pin} maxLength={8} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} placeholder="auto" />
                </div>
                <p className="text-[11px] text-muted-foreground">📧 An invite email with login instructions will be sent automatically.</p>
              </div>
              <DialogFooter><Button onClick={handleCreate}>Create & Send Invite</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit staff member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>KPI target / month</Label><Input type="number" value={editForm.kpiTarget} onChange={(e) => setEditForm({ ...editForm, kpiTarget: e.target.value })} /></div>
            </div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleEdit}>Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity log dialog */}
      <Dialog open={!!activityStaff} onOpenChange={(o) => !o && setActivityStaff(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> Activity — {activityStaff?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {activities.length === 0 && !activityLoading && (
              <div className="text-xs text-muted-foreground py-8 text-center">No activity yet</div>
            )}
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/50">
                <span className="text-base leading-none mt-0.5">{ACTIVITY_ICONS[a.type] ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium capitalize">{a.type.replace("_", " ")}</div>
                  {a.note && <div className="text-[11px] text-muted-foreground">{a.note}</div>}
                  {a.amount != null && <div className="text-[11px] text-muted-foreground">${a.amount.toFixed(2)}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {format(parseISO(a.createdAt), "MMM d, HH:mm")}
                </div>
              </div>
            ))}
            {activityLoading && <div className="text-xs text-muted-foreground py-4 text-center">Loading…</div>}
          </div>
          {activities.length < activityTotal && !activityLoading && (
            <Button variant="secondary" className="w-full h-8 text-xs mt-2" onClick={() => loadActivity(activityStaff.id, activitySkipRef.current)}>
              Load more ({activityTotal - activities.length} remaining)
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Hours edit dialog ── */}
      <Dialog open={!!hoursTarget} onOpenChange={o => !o && setHoursTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Work hours — {hoursTarget?.name}
            </DialogTitle>
          </DialogHeader>

          {hoursTarget && (() => {
            const sd = shiftsData[hoursTarget.id];
            const shifts = sd?.shifts ?? [];
            const totalMins = sd?.totalMinutes ?? 0;
            const activeMins = sd?.activeShift ? differenceInMinutes(new Date(), parseISO(sd.activeShift.clockIn)) : 0;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground">This week total</span>
                  <span className="text-sm font-semibold">{fmtDuration(totalMins + activeMins)}</span>
                </div>

                {/* Active shift — force clock out */}
                {sd?.activeShift && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--stage-completed))]/10 border border-[hsl(var(--stage-completed))]/30">
                    <span className="text-xs font-medium flex-1">
                      ● Currently clocked in since {format(parseISO(sd.activeShift.clockIn), "HH:mm, MMM d")}
                    </span>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleClockOut(hoursTarget.id)}>
                      <TimerOff className="h-3 w-3 mr-1" /> Clock out now
                    </Button>
                  </div>
                )}

                {/* Shift list */}
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {shifts.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">No shifts this week</div>}
                  {shifts.map((sh: any) => {
                    const mins = sh.clockOut
                      ? differenceInMinutes(parseISO(sh.clockOut), parseISO(sh.clockIn))
                      : differenceInMinutes(new Date(), parseISO(sh.clockIn));
                    return (
                      <div key={sh.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hairline">
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="font-medium">
                            {format(parseISO(sh.clockIn), "EEE, MMM d")}
                          </div>
                          <div className="text-muted-foreground">
                            {format(parseISO(sh.clockIn), "HH:mm")} → {sh.clockOut ? format(parseISO(sh.clockOut), "HH:mm") : <span className="text-[hsl(var(--stage-completed))]">active</span>}
                            {sh.editedBy && <span className="ml-2 text-[10px] text-muted-foreground/60">• edited</span>}
                          </div>
                        </div>
                        <span className="text-xs font-semibold tabular-nums">{fmtDuration(mins)}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => openEditShift(sh)}>
                          <PencilLine className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => handleDeleteShift(sh.id, hoursTarget.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Edit individual shift ── */}
      <Dialog open={!!editingShift} onOpenChange={o => !o && setEditingShift(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Clock in</Label>
              <Input type="datetime-local" value={editShiftForm.clockIn}
                onChange={e => setEditShiftForm(f => ({ ...f, clockIn: e.target.value }))} />
            </div>
            <div>
              <Label>Clock out <span className="text-muted-foreground text-[11px]">(leave empty if still active)</span></Label>
              <Input type="datetime-local" value={editShiftForm.clockOut}
                onChange={e => setEditShiftForm(f => ({ ...f, clockOut: e.target.value }))} />
            </div>
            {editShiftForm.clockIn && editShiftForm.clockOut && (
              <div className="text-xs text-muted-foreground px-1">
                Duration: <span className="font-semibold text-foreground">
                  {fmtDuration(differenceInMinutes(new Date(editShiftForm.clockOut), new Date(editShiftForm.clockIn)))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingShift(null)}>Cancel</Button>
            <Button onClick={handleSaveShift}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp password banner */}
      {tempPassword && (
        <div className="mb-4 p-4 rounded-xl bg-secondary hairline flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium mb-1">✅ Staff created — invite email sent!</div>
            <div className="text-xs text-muted-foreground">Share this temp password via WhatsApp/SMS as backup:</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm bg-background px-3 py-1.5 rounded-lg hairline">
              {showPass ? tempPassword : "••••••••••••"}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowPass(p => !p)}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" className="h-8" onClick={() => { navigator.clipboard.writeText(tempPassword); toast({ title: "Copied" }); }}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setTempPassword(null)}>✕</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active team" value={`${staff.filter(s => s.status !== "inactive").length}`} delta={`${staff.filter(s => s.role === "sales" && s.status !== "inactive").length} in sales`} />
        <Stat label="KPI this period" value={`${totalKPI}`} delta={period} />
        <Stat label="Verified" value={`${staff.filter(s => s.verified).length}`} delta={`${staff.filter(s => !s.verified).length} pending`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Team</div>
          <div className="space-y-2">
            {staff.map((p) => {
              const isOpen = expanded === p.id;
              const kpi = kpiMap[p.id];
              const pct = kpi && kpi.target > 0 ? Math.min(100, Math.round((kpi.value / kpi.target) * 100)) : null;
              const color = pct === null ? "stage-progress" : pct >= 100 ? "stage-completed" : pct >= 60 ? "stage-progress" : pct >= 30 ? "stage-noresponse" : "stage-new";
              const statusInfo = STATUSES.find(s => s.id === (p.status || "active")) ?? STATUSES[0];
              return (
                <div key={p.id} className="rounded-lg bg-secondary/40 hairline overflow-hidden">
                  <button onClick={() => { const next = isOpen ? null : p.id; setExpanded(next); if (next) loadShifts(p.id); }} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/70 transition-colors">
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold"
                        style={{ background: p.status === "inactive" ? "hsl(var(--secondary))" : "hsl(var(--primary))", color: p.status === "inactive" ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))" }}>
                        {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
                        style={{ background: `hsl(var(--${statusInfo.color}))` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {p.name}
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `hsl(var(--${ROLE_COLORS[p.role] || "stage-progress"}) / 0.18)`, color: `hsl(var(--${ROLE_COLORS[p.role] || "stage-progress"}))` }}>{p.role}</span>
                        {p.verified
                          ? <ShieldOk className="h-3 w-3 text-[hsl(var(--stage-completed))]" title="Verified" />
                          : <ShieldAlert className="h-3 w-3 text-[hsl(var(--stage-noresponse))]" title="Not verified" />
                        }
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1.5">
                        {p.email} • PIN •••• {p.pin?.slice(-4)}
                        {!p.verified && <span className="ml-2 text-[hsl(var(--stage-noresponse))]">• pending verification</span>}
                      </div>
                      {pct !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `hsl(var(--${color}))` }} />
                          </div>
                          <span className="text-[10px] tabular-nums shrink-0" style={{ color: `hsl(var(--${color}))` }}>{kpi.value}/{kpi.target}</span>
                        </div>
                      ) : p.kpiTarget ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full w-0 rounded-full" style={{ background: `hsl(var(--stage-progress))` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">0/{p.kpiTarget}</span>
                        </div>
                      ) : null}
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isOpen && (() => {
                    const sd = shiftsData[p.id];
                    const activeShift = sd?.activeShift ?? null;
                    const weekMins = sd?.totalMinutes ?? 0;
                    const activeMins = activeShift ? differenceInMinutes(new Date(), parseISO(activeShift.clockIn)) : 0;
                    return (
                    <div className="px-3 pb-3 pt-2 border-t border-border space-y-3 bg-background/40">
                      {/* Info grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <Info label="Hired" value={format(parseISO(p.hiredAt), "MMM d, yyyy")} />
                        <Info label="Phone" value={p.phone || "—"} />
                        <Info label="KPI target" value={p.kpiTarget ? `${p.kpiTarget}/mo` : "—"} />
                        <div className="rounded-md bg-secondary/40 p-2">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Status</div>
                          <Select value={p.status || "active"} onValueChange={(v) => handleStatusChange(p.id, v)}>
                            <SelectTrigger className="h-6 text-[11px] border-0 p-0 bg-transparent focus:ring-0 shadow-none">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: `hsl(var(--${statusInfo.color}))` }} />
                                {statusInfo.label}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--${s.color}))` }} />
                                    {s.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Time tracking strip */}
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hairline">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium flex items-center gap-2">
                            This week:
                            <span className="text-foreground font-semibold">{fmtDuration(weekMins + activeMins)}</span>
                            {activeShift && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--stage-completed))]/15 text-[hsl(var(--stage-completed))] font-semibold animate-pulse">
                                ● clocked in {fmtDuration(activeMins)}
                              </span>
                            )}
                          </div>
                          {activeShift && (
                            <div className="text-[10px] text-muted-foreground">
                              Since {format(parseISO(activeShift.clockIn), "HH:mm, MMM d")}
                            </div>
                          )}
                        </div>
                        {/* Clock in/out */}
                        {activeShift ? (
                          <Button size="sm" variant="destructive" className="h-7 text-xs shrink-0" onClick={() => handleClockOut(p.id)}>
                            <TimerOff className="h-3 w-3 mr-1" /> Clock out
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" className="h-7 text-xs shrink-0" onClick={() => handleClockIn(p.id)}>
                            <Timer className="h-3 w-3 mr-1" /> Clock in
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => openHoursDialog(p)}>
                          <CalendarClock className="h-3.5 w-3.5 mr-1" /> Edit hours
                        </Button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => openActivity(p)}><ScrollText className="h-3 w-3 mr-1" /> Activity</Button>
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => handleResetPin(p.id)}><KeyRound className="h-3 w-3 mr-1" /> Reset PIN</Button>
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => { navigator.clipboard?.writeText(p.pin); toast({ title: "PIN copied" }); }}><Copy className="h-3 w-3 mr-1" /> Copy PIN</Button>
                        <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
                      </div>
                    </div>
                    );
                  })()}
                </div>
              );
            })}
            {staff.length === 0 && <div className="text-xs text-muted-foreground py-8 text-center">No staff yet</div>}
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
                    <Pie data={kpiData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none" onMouseEnter={(_, idx) => setActiveIdx(idx)} isAnimationActive animationDuration={600}>
                      {kpiData.map((_, i) => (
                        <Cell key={i} fill={`hsl(var(--${["stage-completed", "stage-progress", "stage-noresponse", "stage-new"][i % 4]}))`} opacity={i === activeIdx ? 1 : 0.7} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} formatter={(v: number, n) => [`${v} deals`, n as string]} />
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

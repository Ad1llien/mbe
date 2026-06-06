import { useMemo, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { type AppointmentClient } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock, Users as UsersIcon, Pencil, StickyNote, Phone, Mail, User } from "lucide-react";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { API } from "@/lib/config";

const SLOT_MIN = 15;
const ROW_H = 14;
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);
const DURATIONS = [15, 30, 45, 60, 75, 90, 120];
const COLORS = ["stage-new", "stage-progress", "stage-noresponse", "stage-completed", "stage-lost"];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultClient?: string;
  defaultTitle?: string;
  dealId?: string;
};

export const CalendarDialog = ({ open, onOpenChange, defaultClient, defaultTitle, dealId }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl p-0 overflow-hidden">
      <DialogHeader className="p-5 border-b border-border">
        <DialogTitle>Schedule appointment</DialogTitle>
      </DialogHeader>
      <CalendarBoard defaultClient={defaultClient} defaultTitle={defaultTitle} dealId={dealId} />
    </DialogContent>
  </Dialog>
);

export const CalendarBoard = ({ defaultClient, defaultTitle, dealId }: { defaultClient?: string; defaultTitle?: string; dealId?: string }) => {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editing, setEditing] = useState<{ day: Date; hour: number; minute: number } | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/appointments?userId=${user.id}`)
      .then(r => r.json())
      .then(setAppointments);
  }, [user?.id]);

  const slotsPerHour = 60 / SLOT_MIN;
  const totalSlots = HOURS.length * slotsPerHour;

  const apptsByDay = (d: Date) => appointments.filter((a) => isSameDay(parseISO(a.start), d));

  const handleAdd = async (payload: any) => {
    if (!user?.id) return;
    const appt = await fetch(`${API}/appointments?userId=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => r.json());
    setAppointments(prev => [...prev, appt]);
    setEditing(null);
  };

  const handleUpdate = async (id: string, patch: any) => {
    const updated = await fetch(`${API}/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(r => r.json());
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/appointments/${id}`, { method: "DELETE" });
    setAppointments(prev => prev.filter(a => a.id !== id));
    setSelected(null);
  };

  return (
    <div className="bg-background">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          <div className="ml-3 text-sm font-medium">
            {format(weekStart, "MMM d")} — {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">15-min slots • click any slot to book • click a booking for details</div>
      </div>

      <div className="grid grid-cols-[60px_repeat(7,_1fr)] border-b border-border bg-secondary/30 text-[11px]">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className={`px-2 py-2 text-center ${isSameDay(d, new Date()) ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            <div className="uppercase tracking-widest">{format(d, "EEE")}</div>
            <div className={`mt-0.5 inline-block h-6 w-6 leading-6 rounded-full ${isSameDay(d, new Date()) ? "bg-primary text-primary-foreground" : ""}`}>{format(d, "d")}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[60px_repeat(7,_1fr)] max-h-[70vh] overflow-auto">
        <div className="border-r border-border">
          {HOURS.map((h) => (
            <div key={h} style={{ height: ROW_H * slotsPerHour }} className="text-[10px] text-muted-foreground text-right pr-2 -mt-2">{`${String(h).padStart(2, "0")}:00`}</div>
          ))}
        </div>
        {days.map((d) => {
          const dayAppts = apptsByDay(d);
          return (
            <div key={d.toISOString()} className="relative border-r border-border last:border-r-0">
              {Array.from({ length: totalSlots }).map((_, i) => {
                const hour = HOURS[0] + Math.floor(i / slotsPerHour);
                const minute = (i % slotsPerHour) * SLOT_MIN;
                const isHour = minute === 0;
                return (
                  <button
                    key={i}
                    onClick={() => setEditing({ day: d, hour, minute })}
                    style={{ height: ROW_H }}
                    className={`block w-full hover:bg-foreground/5 transition-colors ${isHour ? "border-t border-border" : "border-t border-border/30"}`}
                  />
                );
              })}
              {dayAppts.map((a) => {
                const start = parseISO(a.start);
                const minutesFromTop = (start.getHours() - HOURS[0]) * 60 + start.getMinutes();
                if (minutesFromTop < 0) return null;
                const top = (minutesFromTop / SLOT_MIN) * ROW_H;
                const height = (a.duration / SLOT_MIN) * ROW_H;
                const color = a.color || "stage-progress";
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    style={{ top, height, background: `hsl(var(--${color}) / 0.18)`, borderLeft: `3px solid hsl(var(--${color}))` }}
                    className="absolute left-0.5 right-0.5 rounded-md p-1.5 text-[10px] overflow-hidden text-left hover:shadow-elegant transition-all hover:brightness-110"
                  >
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <Clock className="h-2.5 w-2.5 shrink-0" />{format(start, "HH:mm")} • {a.duration}m
                    </div>
                    <div className="truncate">{a.title}</div>
                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                      <UsersIcon className="h-2.5 w-2.5 shrink-0" />{(a.clients as string[]).join(", ")}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {editing && (
        <NewApptDialog
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(null); }}
          slot={editing}
          defaultClient={defaultClient}
          defaultTitle={defaultTitle}
          dealId={dealId}
          onSave={handleAdd}
        />
      )}

      <AppointmentDetailDialog
        appointment={selected}
        onOpenChange={(v) => { if (!v) setSelected(null); }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
};

const AppointmentDetailDialog = ({ appointment, onOpenChange, onUpdate, onDelete }: {
  appointment: any | null;
  onOpenChange: (v: boolean) => void;
  onUpdate: (id: string, patch: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<any | null>(null);

  const open = !!appointment;
  const a = edit && draft ? draft : appointment;

  const startEdit = () => { setDraft(appointment); setEdit(true); };
  const cancelEdit = () => { setEdit(false); setDraft(null); };
  const save = () => {
    if (!draft) return;
    const { id, ...patch } = draft;
    onUpdate(id, patch);
    setEdit(false); setDraft(null);
  };

  if (!a) return null;
  const start = parseISO(a.start);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) cancelEdit(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(var(--${a.color || "stage-progress"}))` }} />
            {edit ? "Edit appointment" : "Appointment"}
          </DialogTitle>
        </DialogHeader>

        {!edit ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">When</div>
              <div className="font-medium">{format(start, "EEE d MMM yyyy")} · {format(start, "HH:mm")} ({a.duration} min)</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</div>
              <div className="font-medium">{a.title}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clients ({(a.contacts?.length || (a.clients as any[])?.length || 0)})</div>
              {a.contacts && a.contacts.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {(a.contacts as AppointmentClient[]).map((c, i) => (
                    <div key={i} className="rounded-lg bg-secondary/50 hairline p-3">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.firstName} {c.lastName || ""}
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                        {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground"><Phone className="h-3 w-3" /> {c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground"><Mail className="h-3 w-3" /> {c.email}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(a.clients as string[]).map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-secondary">{c}</span>
                  ))}
                </div>
              )}
            </div>
            {a.note && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" /> Note</div>
                <div className="text-xs text-muted-foreground mt-1 p-2 rounded bg-secondary/50">{a.note}</div>
              </div>
            )}
          </div>
        ) : (
          <EditFields draft={draft!} setDraft={setDraft} />
        )}

        <DialogFooter className="gap-2">
          {!edit ? (
            <>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(a.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
              <Button onClick={startEdit}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={save}>Save changes</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditFields = ({ draft, setDraft }: { draft: any; setDraft: (v: any) => void }) => {
  const [clientDraft, setClientDraft] = useState("");
  return (
    <div className="space-y-3">
      <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Duration</Label>
          <Select value={String(draft.duration)} onValueChange={(v) => setDraft({ ...draft, duration: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Color</Label>
          <Select value={draft.color || "stage-progress"} onValueChange={(v) => setDraft({ ...draft, color: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLORS.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ background: `hsl(var(--${c}))` }} />{c.replace("stage-", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Clients</Label>
        <div className="flex gap-2">
          <Input value={clientDraft} onChange={(e) => setClientDraft(e.target.value)} placeholder="Add and Enter"
            onKeyDown={(e) => { if (e.key === "Enter" && clientDraft.trim()) { setDraft({ ...draft, clients: [...(draft.clients || []), clientDraft.trim()] }); setClientDraft(""); } }} />
          <Button variant="secondary" type="button" onClick={() => { if (clientDraft.trim()) { setDraft({ ...draft, clients: [...(draft.clients || []), clientDraft.trim()] }); setClientDraft(""); } }}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(draft.clients as string[] || []).map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-secondary">
              {c}
              <button onClick={() => setDraft({ ...draft, clients: draft.clients.filter((_: any, j: number) => j !== i) })} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>
      <div><Label>Note</Label><Input value={draft.note || ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></div>
    </div>
  );
};

const NewApptDialog = ({ open, onOpenChange, slot, defaultClient, defaultTitle, dealId, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slot: { day: Date; hour: number; minute: number };
  defaultClient?: string;
  defaultTitle?: string;
  dealId?: string;
  onSave: (a: any) => void;
}) => {
  const [title, setTitle] = useState(defaultTitle || "");
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState("stage-progress");
  const [contacts, setContacts] = useState<AppointmentClient[]>(
    defaultClient ? [{ firstName: defaultClient }] : [{ firstName: "" }]
  );
  const [note, setNote] = useState("");

  const start = new Date(slot.day);
  start.setHours(slot.hour, slot.minute, 0, 0);

  const updateContact = (i: number, patch: Partial<AppointmentClient>) =>
    setContacts(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addContact = () => setContacts([...contacts, { firstName: "" }]);
  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking · {format(start, "EEE d MMM, HH:mm")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting / Service" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration</Label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color tag</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) =>
                    <SelectItem key={c} value={c}><span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ background: `hsl(var(--${c}))` }} />{c.replace("stage-", "")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Clients</Label>
              <Button type="button" variant="secondary" size="sm" className="h-7" onClick={addContact}>
                <Plus className="h-3 w-3 mr-1" /> Add client
              </Button>
            </div>
            {contacts.map((c, i) => (
              <div key={i} className="rounded-lg bg-secondary/40 hairline p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Client {i + 1}</div>
                  {contacts.length > 1 && (
                    <button onClick={() => removeContact(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={c.firstName} onChange={(e) => updateContact(i, { firstName: e.target.value })} placeholder="First name" />
                  <Input value={c.lastName || ""} onChange={(e) => updateContact(i, { lastName: e.target.value })} placeholder="Last name" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={c.phone || ""} onChange={(e) => updateContact(i, { phone: e.target.value })} placeholder="Phone" />
                  <Input value={c.email || ""} onChange={(e) => updateContact(i, { email: e.target.value })} placeholder="Email" />
                </div>
              </div>
            ))}
          </div>

          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            const valid = contacts.filter((c) => c.firstName.trim());
            if (!title || valid.length === 0) return;
            const clientNames = valid.map((c) => `${c.firstName}${c.lastName ? " " + c.lastName : ""}`.trim());
            onSave({ title, clients: clientNames, contacts: valid, duration, color, note, start: start.toISOString(), dealId });
          }}>Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

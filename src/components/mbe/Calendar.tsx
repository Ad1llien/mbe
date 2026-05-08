import { useMemo, useState } from "react";
import { useStore, Appointment } from "./store";
import { Panel, SectionHeader } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock, Users as UsersIcon } from "lucide-react";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";

const SLOT_MIN = 15;
const ROW_H = 14; // px per 15-min slot
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00 — 20:00
const DURATIONS = [15, 30, 45, 60, 75, 90, 120];

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
  const { appointments, addAppointment, removeAppointment } = useStore();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editing, setEditing] = useState<{ day: Date; hour: number; minute: number } | null>(null);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const slotsPerHour = 60 / SLOT_MIN;
  const totalSlots = HOURS.length * slotsPerHour;

  const apptsByDay = (d: Date) => appointments.filter((a) => isSameDay(parseISO(a.start), d));

  const handleSlotClick = (d: Date, hour: number, minute: number) => {
    setEditing({ day: d, hour, minute });
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
        <div className="text-[11px] text-muted-foreground">15-min slots • click any slot to book</div>
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

      <div className="grid grid-cols-[60px_repeat(7,_1fr)] max-h-[60vh] overflow-auto">
        {/* time column */}
        <div className="border-r border-border">
          {HOURS.map((h) => (
            <div key={h} style={{ height: ROW_H * slotsPerHour }} className="text-[10px] text-muted-foreground text-right pr-2 -mt-2">{`${String(h).padStart(2, "0")}:00`}</div>
          ))}
        </div>
        {days.map((d) => {
          const dayAppts = apptsByDay(d);
          return (
            <div key={d.toISOString()} className="relative border-r border-border last:border-r-0">
              {/* slot grid */}
              {Array.from({ length: totalSlots }).map((_, i) => {
                const hour = HOURS[0] + Math.floor(i / slotsPerHour);
                const minute = (i % slotsPerHour) * SLOT_MIN;
                const isHour = minute === 0;
                return (
                  <button
                    key={i}
                    onClick={() => handleSlotClick(d, hour, minute)}
                    style={{ height: ROW_H }}
                    className={`block w-full hover:bg-foreground/5 transition-colors ${isHour ? "border-t border-border" : "border-t border-border/30"}`}
                  />
                );
              })}
              {/* appointments overlaid */}
              {dayAppts.map((a) => {
                const start = parseISO(a.start);
                const minutesFromTop = (start.getHours() - HOURS[0]) * 60 + start.getMinutes();
                if (minutesFromTop < 0) return null;
                const top = (minutesFromTop / SLOT_MIN) * ROW_H;
                const height = (a.duration / SLOT_MIN) * ROW_H;
                const color = a.color || "stage-progress";
                return (
                  <div
                    key={a.id}
                    style={{ top, height, background: `hsl(var(--${color}) / 0.18)`, borderLeft: `3px solid hsl(var(--${color}))` }}
                    className="absolute left-0.5 right-0.5 rounded-md p-1.5 text-[10px] overflow-hidden group hover:shadow-elegant transition-all"
                  >
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <Clock className="h-2.5 w-2.5 shrink-0" />{format(start, "HH:mm")} • {a.duration}m
                    </div>
                    <div className="truncate">{a.title}</div>
                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                      <UsersIcon className="h-2.5 w-2.5 shrink-0" />{a.clients.join(", ")}
                    </div>
                    <button
                      onClick={() => removeAppointment(a.id)}
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 h-4 w-4 grid place-items-center rounded bg-background/70 hover:bg-destructive hover:text-destructive-foreground transition-all"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
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
          onSave={(payload) => { addAppointment(payload); setEditing(null); }}
        />
      )}
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
  onSave: (a: Omit<Appointment, "id">) => void;
}) => {
  const [title, setTitle] = useState(defaultTitle || "");
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState("stage-progress");
  const [clients, setClients] = useState<string[]>(defaultClient ? [defaultClient] : []);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");

  const start = new Date(slot.day);
  start.setHours(slot.hour, slot.minute, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                  {["stage-new", "stage-progress", "stage-noresponse", "stage-completed", "stage-lost"].map((c) =>
                    <SelectItem key={c} value={c}><span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ background: `hsl(var(--${c}))` }} />{c.replace("stage-", "")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Clients (multiple allowed at same slot)</Label>
            <div className="flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add client name and Enter"
                onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { setClients([...clients, draft.trim()]); setDraft(""); } }} />
              <Button variant="secondary" onClick={() => { if (draft.trim()) { setClients([...clients, draft.trim()]); setDraft(""); } }}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {clients.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-secondary">
                  {c}
                  <button onClick={() => setClients(clients.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (!title || clients.length === 0) return;
            onSave({ title, clients, duration, color, note, start: start.toISOString(), dealId });
          }}>Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

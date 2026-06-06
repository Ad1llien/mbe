import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Panel, SectionHeader } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Trash2, Check, PenLine } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { Whiteboard } from "./Whiteboard";
import { API } from "@/lib/config";

export const TaskList = () => {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("12:00");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/tasks?userId=${user.id}`)
      .then(r => r.json())
      .then(setTasks);
  }, [user?.id]);

  const sorted = [...tasks].sort((a, b) => +parseISO(a.due) - +parseISO(b.due));
  const upcoming = sorted.filter((t) => !t.done);
  const done = sorted.filter((t) => t.done);

  const labelFor = (iso: string) => {
    const d = parseISO(iso);
    if (isToday(d)) return `Today • ${format(d, "h:mm a")}`;
    if (isTomorrow(d)) return `Tomorrow • ${format(d, "h:mm a")}`;
    return format(d, "EEE, MMM d • h:mm a");
  };

  const handleAdd = async () => {
    if (!title || !user?.id) return;
    const task = await fetch(`${API}/tasks?userId=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due: new Date(`${date}T${time}`).toISOString() }),
    }).then(r => r.json());
    setTasks(prev => [...prev, task]);
    setTitle("");
    setOpen(false);
  };

  const handleToggle = async (id: string) => {
    const updated = await fetch(`${API}/tasks/${id}/toggle`, { method: "PATCH" }).then(r => r.json());
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleClearCompleted = async () => {
    if (!user?.id) return;
    await fetch(`${API}/tasks/completed?userId=${user.id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => !t.done));
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="Task List"
        subtitle="Plan your day with deadlines and times."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" className="h-9" onClick={() => setBoardOpen(true)}>
              <PenLine className="h-4 w-4 mr-1" /> Whiteboard
            </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> New task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Task</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                  <div><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <Whiteboard open={boardOpen} onClose={() => setBoardOpen(false)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="text-sm font-medium mb-3">Upcoming</div>
          <div className="space-y-2">
            {upcoming.map((t) => {
              const mins = differenceInMinutes(parseISO(t.due), new Date());
              const overdue = mins < 0;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hairline">
                  <button onClick={() => handleToggle(t.id)} className="h-6 w-6 rounded-md border border-border grid place-items-center hover:bg-foreground hover:text-background transition-colors">
                    <Check className="h-3 w-3 opacity-0 hover:opacity-100" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {labelFor(t.due)}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${overdue ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {overdue ? "overdue" : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`}
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              );
            })}
            {upcoming.length === 0 && <div className="text-xs text-muted-foreground py-8 text-center">All clear ✦</div>}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Completed</div>
            {done.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground hover:text-destructive" onClick={handleClearCompleted}>
                <Trash2 className="h-3 w-3 mr-1" /> Clear completed
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 opacity-70">
                <button onClick={() => handleToggle(t.id)} className="h-5 w-5 rounded-md bg-foreground text-background grid place-items-center"><Check className="h-3 w-3" /></button>
                <div className="text-xs line-through truncate flex-1">{t.title}</div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            {done.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Nothing yet</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
};

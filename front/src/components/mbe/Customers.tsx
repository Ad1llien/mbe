import { useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus, User, Phone, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

export const Customers = () => {
  const { customers, addCustomer, updateCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  return (
    <div className="fade-in">
      <SectionHeader
        title="Customers"
        subtitle="Phone-first registry with quick notes — no forms, no friction."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add customer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 …" /></div>
                <div><Label>Name (optional)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, preferences…" /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (!phone) return;
                  addCustomer({ phone, name, note });
                  setPhone(""); setName(""); setNote(""); setOpen(false);
                }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Total customers" value={`${customers.length}`} />
        <Stat label="With notes" value={`${customers.filter((c) => c.note).length}`} />
        <Stat label="This week" value={`${customers.filter((c) => Date.now() - parseISO(c.createdAt).getTime() < 7 * 86400000).length}`} />
      </div>

      <Panel>
        <div className="divide-y divide-border">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center gap-4 py-3">
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center"><User className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.name || "—"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>
                {c.note && <div className="text-xs text-muted-foreground mt-1 italic">"{c.note}"</div>}
              </div>
              <div className="text-[10px] text-muted-foreground">{format(parseISO(c.createdAt), "MMM d")}</div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(c.id); setEditNote(c.note || ""); }}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {customers.length === 0 && <div className="text-xs text-muted-foreground py-8 text-center">No customers yet.</div>}
        </div>
      </Panel>

      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit note</DialogTitle></DialogHeader>
          <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          <DialogFooter>
            <Button onClick={() => { if (editingId) updateCustomer(editingId, { note: editNote }); setEditingId(null); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

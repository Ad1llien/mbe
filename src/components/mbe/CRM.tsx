import { useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Settings2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

const colorOptions = [
  { id: "stage-new", label: "Red" },
  { id: "stage-progress", label: "Yellow" },
  { id: "stage-noresponse", label: "Orange" },
  { id: "stage-completed", label: "Green" },
  { id: "stage-lost", label: "Deep Red" },
];

export const CRM = () => {
  const { stages, deals, addDeal, moveDeal } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client: "", title: "", amount: "", stageId: stages[0]?.id ?? "new" });

  return (
    <div className="fade-in">
      <SectionHeader
        title="CRM"
        subtitle="Pipeline synced with Finance — completed deals issue receipts automatically."
        action={
          <div className="flex items-center gap-2">
            <CustomizeStages />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add deal</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Client</Label><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></div>
                  <div><Label>Deal title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                    <div>
                      <Label>Stage</Label>
                      <Select value={form.stageId} onValueChange={(v) => setForm({ ...form, stageId: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    if (!form.client) return;
                    addDeal({ client: form.client, title: form.title || "Untitled", amount: Number(form.amount) || 0, stageId: form.stageId });
                    setForm({ client: "", title: "", amount: "", stageId: stages[0]?.id });
                    setOpen(false);
                  }}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          const total = stageDeals.reduce((s, d) => s + d.amount, 0);
          return (
            <Panel key={stage.id} className="min-h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(var(--${stage.color}))` }} />
                  <div className="text-sm font-medium">{stage.label}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">{stageDeals.length} • ${total.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                {stageDeals.map((d) => (
                  <div key={d.id} className="rounded-lg bg-secondary/60 p-3 hairline group">
                    <div className="text-xs text-muted-foreground">{d.client}</div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">${d.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">{format(parseISO(d.createdAt), "MMM d")}</div>
                    </div>
                    <Select value={d.stageId} onValueChange={(v) => moveDeal(d.id, v)}>
                      <SelectTrigger className="h-7 mt-2 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
                {stageDeals.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">No deals</div>}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
};

const CustomizeStages = () => {
  const { stages, updateStage, addStage, removeStage } = useStore();
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="secondary" className="h-9"><Settings2 className="h-4 w-4 mr-1" /> Customize stages</Button></PopoverTrigger>
      <PopoverContent className="w-[360px]">
        <div className="text-sm font-medium mb-2">Pipeline stages</div>
        <div className="space-y-2 max-h-[320px] overflow-auto">
          {stages.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: `hsl(var(--${s.color}))` }} />
              <Input value={s.label} onChange={(e) => updateStage(s.id, { label: e.target.value })} className="h-8 text-xs" />
              <Select value={s.color} onValueChange={(v) => updateStage(s.id, { color: v })}>
                <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{colorOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeStage(s.id)}><Pencil className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
        <Button variant="secondary" className="w-full mt-3 h-8" onClick={addStage}><Plus className="h-3 w-3 mr-1" /> Add stage</Button>
      </PopoverContent>
    </Popover>
  );
};

import { useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, AlertTriangle, Package } from "lucide-react";

export const Inventory = () => {
  const { inventory, addInventory, updateStock } = useStore();
  const findName = (id: string) => inventory.find((x) => x.id === id)?.name ?? "?";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", stock: "", threshold: "", price: "" });

  const totalValue = inventory.filter((i) => !i.isProduct).reduce((s, i) => s + i.stock * i.price, 0);
  const low = inventory.filter((i) => !i.isProduct && i.stock <= i.threshold);

  return (
    <div className="fade-in">
      <SectionHeader
        title="Inventory"
        subtitle="Stock levels, low-stock alerts, and quick adjustments."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add item</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add inventory item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                  <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                  <div><Label>Low threshold</Label><Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (!form.name) return;
                  addInventory({ name: form.name, sku: form.sku || "—", stock: Number(form.stock) || 0, threshold: Number(form.threshold) || 5, price: Number(form.price) || 0 });
                  setForm({ name: "", sku: "", stock: "", threshold: "", price: "" });
                  setOpen(false);
                }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="SKUs tracked" value={`${inventory.length}`} />
        <Stat label="Inventory value" value={`$${totalValue.toLocaleString()}`} />
        <Stat label="Low-stock alerts" value={`${low.length}`} delta={low.length ? "Action recommended" : "All good"} />
      </div>

      {low.length > 0 && (
        <Panel className="mb-4 border border-destructive/30">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Low stock alerts</div>
              <div className="text-xs text-muted-foreground">{low.map((i) => i.name).join(" • ")}</div>
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <div className="text-sm font-medium mb-3">Stock</div>
        <div className="divide-y divide-border">
          {inventory.map((i) => {
            const isLow = !i.isProduct && i.stock <= i.threshold;
            return (
              <div key={i.id} className="flex items-center gap-4 py-3">
                <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center"><Package className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {i.name}
                    {i.isProduct && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground text-background">Product</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">SKU {i.sku} • ${i.price} {i.unit && `/ ${i.unit}`}</div>
                  {i.recipe && i.recipe.length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Recipe: {i.recipe.map((r) => `${r.qty} ${findName(r.itemId)}`).join(" + ")}
                    </div>
                  )}
                </div>
                <div className="text-right mr-3">
                  {i.isProduct ? (
                    <div className="text-[10px] text-muted-foreground">auto from recipe</div>
                  ) : (
                    <>
                      <div className={`text-sm font-semibold ${isLow ? "text-destructive" : ""}`}>{i.stock} {i.unit || ""}</div>
                      <div className="text-[10px] text-muted-foreground">threshold {i.threshold}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => updateStock(i.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => updateStock(i.id, 1)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

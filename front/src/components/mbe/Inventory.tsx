import { useRef, useState, useEffect } from "react";
import { useStore, InventoryItem } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, AlertTriangle, Package, Warehouse, Store, Paperclip, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "stock" | "sale";

export const Inventory = () => {
  const { inventory, addInventory, updateStock } = useStore();
  const [tab, setTab] = useState<Tab>("stock");
  const [open, setOpen] = useState(false);
  const [apiProducts, setApiProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/pos/products')
      .then(r => r.json())
      .then(setApiProducts);
  }, []);

  const stock = inventory.filter((i) => !i.isProduct);
  const totalValue = stock.reduce((s, i) => s + i.stock * i.price, 0);
  const low = stock.filter((i) => i.threshold > 0 && i.stock <= i.threshold);
  const list = tab === "stock" ? stock : apiProducts;

  return (
    <div className="fade-in">
      <SectionHeader
        title="Inventory"
        subtitle="Warehouse stock and sellable items — manage them separately."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9"><Plus className="h-4 w-4 mr-1" /> Add {tab === "stock" ? "stock item" : "product"}</Button>
            </DialogTrigger>
            <AddItemDialog
              tab={tab}
              onClose={() => setOpen(false)}
              onSave={addInventory}
              onProductAdded={(p) => setApiProducts(prev => [...prev, p])}
            />
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Stock SKUs" value={`${stock.length}`} />
        <Stat label="Sale items" value={`${apiProducts.length}`} />
        <Stat label="Stock value" value={`$${totalValue.toLocaleString()}`} delta={low.length ? `${low.length} low alerts` : "All good"} />
      </div>

      {low.length > 0 && tab === "stock" && (
        <Panel className="mb-4 border border-destructive/30">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Stock below your alert threshold</div>
              <div className="text-xs text-muted-foreground">{low.map((i) => i.name).join(" • ")}</div>
            </div>
          </div>
        </Panel>
      )}

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-secondary hairline mb-4">
        <TabButton active={tab === "stock"} onClick={() => setTab("stock")} icon={<Warehouse className="h-3.5 w-3.5" />} label="Warehouse stock" count={stock.length} />
        <TabButton active={tab === "sale"} onClick={() => setTab("sale")} icon={<Store className="h-3.5 w-3.5" />} label="On sale" count={apiProducts.length} />
      </div>

      <Panel>
        <div className="text-sm font-medium mb-3 flex items-center gap-2">
          {tab === "stock" ? <><Warehouse className="h-4 w-4" /> Warehouse</> : <><Store className="h-4 w-4" /> Storefront</>}
        </div>
        {list.length === 0 && <div className="text-xs text-muted-foreground py-10 text-center">Nothing here yet. Click "Add" to create your first item.</div>}
        <div className="divide-y divide-border">
          {list.map((i) => <Row key={i.id} item={i} onAdjust={updateStock} />)}
        </div>
      </Panel>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
      active ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon} {label} <span className={cn("ml-1 px-1.5 py-0.5 rounded text-[10px]", active ? "bg-primary-foreground/15" : "bg-foreground/5")}>{count}</span>
  </button>
);

const Row = ({ item: i, onAdjust }: { item: any; onAdjust: (id: string, delta: number) => void }) => {
  const isLow = i.threshold > 0 && !i.isProduct && i.stock <= i.threshold;
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center"><Package className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate flex items-center gap-2">
          {i.name}
          {i.isProduct && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground text-background">Product</span>}
          {!i.isProduct && i.threshold > 0 && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground inline-flex items-center gap-1">
              <Bell className="h-2.5 w-2.5" /> alert ≤ {i.threshold}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">SKU {i.sku} • ${i.price} {i.unit && `/ ${i.unit}`}</div>
      </div>
      <div className="text-right mr-3">
        {i.isProduct && i.recipe?.length ? (
          <div className="text-[10px] text-muted-foreground">auto from recipe</div>
        ) : (
          <>
            <div className={`text-sm font-semibold ${isLow ? "text-destructive" : ""}`}>{i.stock ?? "—"} {i.unit || ""}</div>
            <div className="text-[10px] text-muted-foreground">{i.threshold > 0 ? `alert at ${i.threshold}` : "no alert"}</div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onAdjust(i.id, -1)}><Minus className="h-3 w-3" /></Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onAdjust(i.id, 1)}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
};

const AddItemDialog = ({ tab, onClose, onSave, onProductAdded }: {
  tab: Tab;
  onClose: () => void;
  onSave: (i: Omit<InventoryItem, "id">) => void;
  onProductAdded: (p: any) => void;
}) => {
  const [form, setForm] = useState({ name: "", sku: "", stock: "", price: "", unit: "" });
  const [alertOn, setAlertOn] = useState(false);
  const [alertPct, setAlertPct] = useState("50");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isProduct = tab === "sale";

  const submit = () => {
    if (!form.name) return;

    if (isProduct) {
      fetch('http://localhost:3000/pos/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku || 'PRD-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
          price: Number(form.price) || 0,
          unit: form.unit || 'pcs',
        }),
      })
        .then(r => r.json())
        .then(newProduct => {
          onProductAdded(newProduct);
          onClose();
        });
      return;
    }

    const stockN = Number(form.stock) || 0;
    const threshold = alertOn ? Math.max(1, Math.round(stockN * (Number(alertPct) || 50) / 100)) : 0;
    onSave({
      name: form.name,
      sku: form.sku || 'ING-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      stock: stockN,
      threshold,
      price: Number(form.price) || 0,
      unit: form.unit || 'pcs',
      isProduct: false,
    });
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isProduct ? "Add product to storefront" : "Add stock item to warehouse"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isProduct ? "Cappuccino, Croissant…" : "Milk, Beans, Cups…"} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="optional" /></div>
          <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, ml, g" /></div>
        </div>

        {!isProduct && (
          <div className="p-3 rounded-lg bg-secondary/40 hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {alertOn ? <Bell className="h-4 w-4 text-[hsl(var(--stage-progress))]" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <div className="font-medium">Manual low-stock alert</div>
                  <div className="text-[11px] text-muted-foreground">Warn when stock drops below your % of initial. Off by default.</div>
                </div>
              </div>
              <Switch checked={alertOn} onCheckedChange={setAlertOn} />
            </div>
            {alertOn && (
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Alert below</Label>
                <Input type="number" min={1} max={100} value={alertPct} onChange={(e) => setAlertPct(e.target.value)} className="h-8" />
                <span className="text-xs text-muted-foreground">% of initial stock</span>
              </div>
            )}
          </div>
        )}

        <div className="p-3 rounded-lg bg-secondary/40 hairline">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> Attach file</div>
              <div className="text-[11px] text-muted-foreground truncate">{file ? file.name : "Spec sheet, invoice, photo… (UI only)"}</div>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button type="button" variant="secondary" className="h-8" onClick={() => fileRef.current?.click()}>
              <Paperclip className="h-3.5 w-3.5 mr-1" /> {file ? "Change" : "Choose file"}
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
};

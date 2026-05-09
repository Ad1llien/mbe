import { useMemo, useState } from "react";
import { useStore, CartLine, Customer } from "./store";
import { Panel, SectionHeader } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, X, PauseCircle, PlayCircle, ReceiptText, User, Trash2, Search, HelpCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

export const POS = () => {
  const { inventory, holdOrder, heldOrders, resumeOrder, removeHeldOrder, checkoutOrder, customers, addCustomer, log, prepInstructions } = useStore();
  const [helpItem, setHelpItem] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdLabel, setHoldLabel] = useState("");
  const [custOpen, setCustOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const products = inventory.filter((i) => i.isProduct);
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const addToCart = (id: string) => {
    const p = inventory.find((i) => i.id === id);
    if (!p) return;
    setCart((c) => {
      const exists = c.find((l) => l.itemId === id);
      if (exists) return c.map((l) => (l.itemId === id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { itemId: id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const adjust = (id: string, delta: number) => {
    setCart((c) => c.flatMap((l) => {
      if (l.itemId !== id) return [l];
      const nq = l.qty + delta;
      if (nq <= 0) {
        log({ actor: "cashier-1", action: "Item removed from cart", detail: l.name, severity: "warn" });
        return [];
      }
      return [{ ...l, qty: nq }];
    }));
  };

  const removeLine = (id: string) => {
    const line = cart.find((l) => l.itemId === id);
    setCart((c) => c.filter((l) => l.itemId !== id));
    if (line) log({ actor: "cashier-1", action: "Item removed from cart", detail: line.name, severity: "warn" });
  };

  const checkout = () => {
    if (cart.length === 0) return;
    const r = checkoutOrder(cart, customer?.id);
    toast({ title: `Receipt ${r.number}`, description: `Total $${r.total.toFixed(2)}` });
    setCart([]);
    setCustomer(undefined);
  };

  const onHold = () => {
    if (cart.length === 0) return;
    holdOrder(holdLabel || `Order #${heldOrders.length + 1}`, cart, customer?.id);
    setCart([]); setCustomer(undefined); setHoldLabel(""); setHoldOpen(false);
    toast({ title: "Order held", description: "Resume it from the held panel." });
  };

  const resume = (id: string) => {
    const o = resumeOrder(id);
    if (o) {
      setCart(o.lines);
      const c = customers.find((x) => x.id === o.customerId);
      if (c) setCustomer(c);
    }
  };

  const findOrCreateCustomer = () => {
    const existing = customers.find((c) => c.phone.replace(/\s+/g, "") === phone.replace(/\s+/g, ""));
    if (existing) {
      setCustomer(existing);
    } else {
      const c = addCustomer({ phone, name, note });
      setCustomer(c);
    }
    setPhone(""); setName(""); setNote(""); setCustOpen(false);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="POS Terminal"
        subtitle="Tap to sell. Hold orders, attach customers, auto-deduct ingredients."
        action={
          <div className="flex gap-2">
            <Dialog open={custOpen} onOpenChange={setCustOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="h-9">
                  <User className="h-4 w-4 mr-1" /> {customer ? customer.name || customer.phone : "Attach customer"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Customer</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 …" /></div>
                  <div><Label>Name (optional)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><Label>Note (allergies, preferences…)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={findOrCreateCustomer} disabled={!phone}>Find / Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product grid */}
        <Panel className="lg:col-span-3">
          <div className="relative mb-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-9 h-9 bg-secondary border-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="relative group">
                <button onClick={() => addToCart(p.id)}
                  className="w-full rounded-xl bg-secondary/50 hairline p-4 text-left hover:bg-secondary transition-all active:scale-[0.98]">
                  <div className="text-sm font-medium truncate pr-6">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.sku}</div>
                  <div className="mt-3 text-lg font-semibold">${p.price.toFixed(2)}</div>
                </button>
                {prepInstructions[p.id] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setHelpItem(p.id); }}
                    className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-full bg-background/70 hover:bg-foreground hover:text-background text-muted-foreground transition-all"
                    title="How to prepare"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-xs text-muted-foreground py-8 text-center">No products match.</div>}
          </div>

          {heldOrders.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Held orders</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {heldOrders.map((o) => (
                  <div key={o.id} className="rounded-lg bg-secondary/40 hairline p-3 flex items-center gap-2">
                    <PauseCircle className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{o.label}</div>
                      <div className="text-[10px] text-muted-foreground">{o.lines.length} items • {format(parseISO(o.createdAt), "HH:mm")}</div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => resume(o.id)}><PlayCircle className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeHeldOrder(o.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Cart */}
        <Panel className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Current order</div>
            {customer && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground text-background">{customer.name || customer.phone}</span>
            )}
          </div>
          <div className="flex-1 space-y-2 max-h-[420px] overflow-auto pr-1">
            {cart.length === 0 && <div className="text-xs text-muted-foreground py-12 text-center">Tap a product to start.</div>}
            {cart.map((l) => (
              <div key={l.itemId} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hairline">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground">${l.price.toFixed(2)} × {l.qty}</div>
                </div>
                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => adjust(l.itemId, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-6 text-center text-xs font-semibold">{l.qty}</span>
                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => adjust(l.itemId, 1)}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(l.itemId)}><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="h-11" disabled={cart.length === 0}>
                    <PauseCircle className="h-4 w-4 mr-1" /> Hold
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Hold order</DialogTitle></DialogHeader>
                  <div><Label>Label (e.g. "Table 4")</Label><Input value={holdLabel} onChange={(e) => setHoldLabel(e.target.value)} /></div>
                  <DialogFooter><Button onClick={onHold}>Hold</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Button className="h-11" onClick={checkout} disabled={cart.length === 0}>
                Charge ${total.toFixed(2)}
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <Dialog open={!!helpItem} onOpenChange={(v) => !v && setHelpItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              How to prepare · {inventory.find((i) => i.id === helpItem)?.name}
            </DialogTitle>
          </DialogHeader>
          <ol className="space-y-2 text-sm">
            {(prepInstructions[helpItem || ""] || "").split("\n").filter(Boolean).map((line, i) => (
              <li key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/40 hairline">
                <span className="h-6 w-6 shrink-0 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-semibold">{i + 1}</span>
                <span className="leading-relaxed pt-0.5">{line.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
};

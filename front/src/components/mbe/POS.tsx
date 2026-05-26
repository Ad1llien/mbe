import { useMemo, useState, useEffect } from "react";
import { useStore, CartLine, Customer } from "./store";
import { Panel, SectionHeader } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, X, PauseCircle, PlayCircle, ReceiptText, User, Trash2, Search, HelpCircle, History, Calendar as CalendarIcon, Eye, Ban, CheckCircle2, AlertTriangle, Copy, Printer} from "lucide-react";
import { format, parseISO, isSameDay} from "date-fns";
import { toast } from "@/hooks/use-toast";

export const POS = () => {
  const { inventory, holdOrder, heldOrders, resumeOrder, removeHeldOrder, checkoutOrder, customers, addCustomer, log, prepInstructions } = useStore();
  const [historyDate, setHistoryDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [historyQuery, setHistoryQuery] = useState("");
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
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
  const [products, setProducts] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const PAYMENT_LABELS: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    online: "Online",
  };
  
  const VOID_REASONS = [
    "Ошибка кассира",
    "Запрос клиента",
    "Неверный заказ",
    "Технический сбой",
    "Other",
  ];

  useEffect(() => {
    fetch('http://localhost:3000/pos/products')
      .then(r => r.json())
      .then(setProducts);
  
    fetch('http://localhost:3000/pos/receipts')
      .then(r => r.json())
      .then(setReceipts);
  }, []);

 

  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const addToCart = (id: string) => {
    const p = products.find((i) => i.id === id);
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

  const checkout = async () => {
    if (cart.length === 0) return;
    const res = await fetch('http://localhost:3000/pos/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: cart.map(l => ({
        productId: l.itemId,
        name: l.name,
        price: l.price,
        qty: l.qty,
      })) }),
    });
    const receipt = await res.json();
    toast({ title: `Receipt ${receipt.number}`, description: `Total $${receipt.total.toFixed(2)}` });
    setCart([]);
    setCustomer(undefined);
    setReceipts(prev => [receipt, ...prev]);
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

  const [voidReasonChoice, setVoidReasonChoice] = useState("");
  const [voidReasonOther, setVoidReasonOther] = useState("");

 

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
              <div key={l.Id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hairline">
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

      <Panel className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 mr-auto">
            <History className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">Receipt history</div>
            <span className="text-[10px] text-muted-foreground">
              {receipts.filter((r) => isSameDay(parseISO(r.createdAt), parseISO(historyDate))).length} on selected day
            </span>
          </div>
          <div className="relative">
            <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="pl-9 h-9 bg-secondary border-transparent w-[170px]"
            />
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search receipt ID…"
              className="pl-9 h-9 bg-secondary border-transparent w-[220px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-2 px-2">Receipt</th>
                <th className="text-left font-medium py-2 px-2">Time</th>
                <th className="text-left font-medium py-2 px-2">Items</th>
                <th className="text-left font-medium py-2 px-2">Customer</th>
                <th className="text-right font-medium py-2 px-2">Total</th>
                <th className="text-left font-medium py-2 px-2">Status</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = historyQuery.trim().toLowerCase();
                const rows = receipts
                  .filter((r) => (q ? r.number.toLowerCase().includes(q) : isSameDay(parseISO(r.createdAt), parseISO(historyDate))))
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                if (rows.length === 0) {
                  return (
                    <tr><td colSpan={7} className="text-xs text-muted-foreground py-10 text-center">No receipts.</td></tr>
                  );
                }
                return rows.map((r) => {
                  const cust = customers.find((c) => c.id === r.customerId);
                  const items = (r.items ?? r.lines ?? []).reduce((s: number, l: any) => s + l.qty, 0);
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                      <td className="py-2.5 px-2 font-medium">{r.number}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{format(parseISO(r.createdAt), "HH:mm")}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{items}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{cust ? (cust.name || cust.phone) : "—"}</td>
                      <td className="py-2.5 px-2 text-right font-semibold">${r.total.toFixed(2)}</td>
                      <td className="py-2.5 px-2">
                        {r.voided ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--stage-new)/0.15)] text-[hsl(var(--stage-new))]">VOID</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--stage-completed)/0.15)] text-[hsl(var(--stage-completed))]">PAID</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewReceipt(r.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Panel>

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

      <Dialog open={!!viewReceipt} onOpenChange={(v) => { if (!v) { setViewReceipt(null); setVoidOpen(false); setVoidReasonChoice(""); setVoidReasonOther(""); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {(() => {
            const r = receipts.find((x) => x.id === viewReceipt);
            if (!r) return null;
            const cust = customers.find((c) => c.id === r.customerId);
            const itemsCount = r.items.reduce((s, l) => s + l.qty, 0);
            const finalReason = voidReasonChoice === "Other" ? voidReasonOther.trim() : voidReasonChoice;

            const  confirmVoid = async () => {
              if (!finalReason) return;
              await fetch(`http://localhost:3000/pos/receipts/${r.id}/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: finalReason }),
              });
              setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, voided: true, voidReason: finalReason } : x));
              toast({ title: `Receipt ${r.number} voided`, description: finalReason });
              setVoidOpen(false);
              setVoidReasonChoice("");
              setVoidReasonOther("");
              setViewReceipt(null);
            };

            return (
              <>
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-secondary/50 to-transparent">
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                          <ReceiptText className="h-5 w-5" /> {r.number}
                        </DialogTitle>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format(parseISO(r.createdAt), "PPP · HH:mm")}
                        </div>
                      </div>
                      {r.voided ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[hsl(var(--stage-new)/0.15)] text-[hsl(var(--stage-new))] font-semibold tracking-wider">
                          <Ban className="h-3 w-3" /> VOID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[hsl(var(--stage-completed)/0.15)] text-[hsl(var(--stage-completed))] font-semibold tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> PAID
                        </span>
                      )}
                    </div>
                  </DialogHeader>
                </div>

                {/* Meta */}
                <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Customer</div>
                    <div className="text-sm font-medium mt-0.5 truncate">{cust ? (cust.name || cust.phone) : "Walk-in"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cashier</div>
                    <div className="text-sm font-medium mt-0.5 truncate">{r.cashierId}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment</div>
                    
                  </div>
                </div>

                {/* Items */}
                <div className="px-6 py-4 max-h-[280px] overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Items</div>
                    <div className="text-[10px] text-muted-foreground">{itemsCount} units</div>
                  </div>
                  <div className="rounded-lg hairline divide-y divide-border bg-secondary/30">
                    {r.items.map((l) => (
                      <div key={l.Id} className="flex items-center gap-3 p-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{l.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">${l.price.toFixed(2)} × {l.qty}</div>
                        </div>
                        <div className="text-right font-semibold tabular-nums">${(l.price * l.qty).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="px-6 py-4 border-t border-border bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Total</div>
                    <div className="text-2xl font-semibold tabular-nums">${r.total.toFixed(2)}</div>
                  </div>
                  {r.voided && r.voidReason && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-[hsl(var(--stage-new)/0.08)] hairline">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-[hsl(var(--stage-new))] shrink-0" />
                      <div className="text-xs">
                        <span className="text-muted-foreground">Void reason: </span>
                        <span className="font-medium">{r.voidReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Void flow */}
                {voidOpen && !r.voided && (
                  <div className="px-6 py-4 border-t border-border bg-[hsl(var(--stage-new)/0.04)]">
                    <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Select void reason
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {VOID_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setVoidReasonChoice(reason)}
                          className={`text-left px-3 py-2 rounded-lg text-xs hairline transition-colors ${voidReasonChoice === reason ? "bg-foreground text-background border-foreground" : "bg-secondary/40 hover:bg-secondary"}`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    {voidReasonChoice === "Other" && (
                      <Input
                        autoFocus
                        value={voidReasonOther}
                        onChange={(e) => setVoidReasonOther(e.target.value)}
                        placeholder="Describe reason…"
                        className="mt-2 h-9 bg-secondary border-transparent"
                      />
                    )}
                  </div>
                )}

                {/* Footer actions */}
                <DialogFooter className="px-6 py-4 border-t border-border bg-background">
                  <div className="flex w-full gap-2">
                    <Button
                      variant="ghost"
                      className="h-9"
                      onClick={() => {
                        navigator.clipboard?.writeText(r.number);
                        toast({ title: "Copied", description: r.number });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy ID
                    </Button>
                    <Button variant="ghost" className="h-9" onClick={() => window.print()}>
                      <Printer className="h-3.5 w-3.5 mr-1" /> Print
                    </Button>
                    <div className="flex-1" />
                    {!r.voided && !voidOpen && (
                      <Button variant="destructive" className="h-9" onClick={() => setVoidOpen(true)}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Void receipt
                      </Button>
                    )}
                    {!r.voided && voidOpen && (
                      <>
                        <Button variant="secondary" className="h-9" onClick={() => { setVoidOpen(false); setVoidReasonChoice(""); setVoidReasonOther(""); }}>
                          Cancel
                        </Button>
                        <Button variant="destructive" className="h-9" disabled={!finalReason} onClick={confirmVoid}>
                          Confirm void
                        </Button>
                      </>
                    )}
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

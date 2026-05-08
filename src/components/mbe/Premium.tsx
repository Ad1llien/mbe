import { useState } from "react";
import { useStore } from "./store";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, CreditCard, Calendar, Sparkles, Check, RefreshCw } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

const PLANS: { id: "Starter" | "Pro" | "Business" | "Enterprise"; price: number; features: string[]; popular?: boolean }[] = [
  { id: "Starter", price: 19, features: ["1 location", "POS + Inventory", "Email support"] },
  { id: "Pro", price: 49, features: ["Up to 5 locations", "CRM + Calendar", "Priority support", "Advanced analytics"], popular: true },
  { id: "Business", price: 119, features: ["Unlimited locations", "Multi-currency", "API access", "Dedicated manager"] },
  { id: "Enterprise", price: 299, features: ["SLA 99.99%", "SSO + audit", "Custom integrations", "On-prem option"] },
];

export const Premium = () => {
  const { subscription, updateSubscription } = useStore();
  const daysLeft = differenceInDays(parseISO(subscription.renewsAt), new Date());
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState({ number: `**** **** **** ${subscription.cardLast4}`, expiry: subscription.cardExpiry, cvv: "", brand: subscription.cardBrand });

  return (
    <div className="fade-in">
      <SectionHeader
        title="Premium"
        subtitle="Subscription, billing, and plan upgrades."
        action={<Button variant="secondary" className="h-9"><Sparkles className="h-4 w-4 mr-1" /> Upgrade</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Panel className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[hsl(var(--stage-progress)/0.18)] blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[hsl(var(--stage-progress))]">
              <Crown className="h-5 w-5" />
              <span className="text-[11px] uppercase tracking-widest font-semibold">Current plan</span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-4xl font-semibold tracking-tight">{subscription.plan}</div>
              <div className="text-sm text-muted-foreground mb-1">${subscription.priceMonthly}/mo</div>
              <span className="ml-auto text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-[hsl(var(--stage-completed)/0.15)] text-[hsl(var(--stage-completed))]">{subscription.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <Info icon={<Calendar className="h-3 w-3" />} label="Days remaining" value={`${Math.max(0, daysLeft)}`} sub="until renewal" />
              <Info icon={<RefreshCw className="h-3 w-3" />} label="Next charge" value={`$${subscription.priceMonthly}`} sub={format(parseISO(subscription.renewsAt), "MMM d, yyyy")} />
              <Info icon={<CreditCard className="h-3 w-3" />} label="Card on file" value={`${subscription.cardBrand} •• ${subscription.cardLast4}`} sub={`exp ${subscription.cardExpiry}`} />
            </div>

            <div className="mt-6 flex items-center justify-between p-3 rounded-lg bg-secondary/50 hairline">
              <div>
                <div className="text-sm font-medium">Auto-renew</div>
                <div className="text-[11px] text-muted-foreground">Charge card automatically before the period ends.</div>
              </div>
              <Switch checked={subscription.autoRenew} onCheckedChange={(v) => updateSubscription({ autoRenew: v })} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Dialog open={cardOpen} onOpenChange={setCardOpen}>
                <DialogTrigger asChild><Button variant="secondary" className="h-9"><CreditCard className="h-4 w-4 mr-1" /> Update card</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Payment method</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Card number</Label><Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Expiry</Label><Input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" /></div>
                      <div><Label>CVV</Label><Input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} maxLength={4} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      const last4 = card.number.replace(/\D/g, "").slice(-4) || subscription.cardLast4;
                      updateSubscription({ cardLast4: last4, cardExpiry: card.expiry, cardBrand: card.brand });
                      setCardOpen(false);
                      toast({ title: "Card updated" });
                    }}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" className="h-9 text-destructive hover:text-destructive" onClick={() => updateSubscription({ status: "canceled", autoRenew: false })}>Cancel subscription</Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="text-sm font-medium mb-3">Billing health</div>
          <Stat label="MTD spend" value={`$${subscription.priceMonthly}`} delta="this period" />
          <div className="mt-3 space-y-2">
            <Row label="Subscription start" value={format(parseISO(subscription.startedAt), "MMM d, yyyy")} />
            <Row label="Renews on" value={format(parseISO(subscription.renewsAt), "MMM d, yyyy")} />
            <Row label="Plan price" value={`$${subscription.priceMonthly}/mo`} />
            <Row label="Status" value={subscription.status} />
          </div>
        </Panel>
      </div>

      <div className="text-sm font-medium mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Choose a plan</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.id === subscription.plan;
          return (
            <Panel key={p.id} className={`relative ${p.popular ? "ring-1 ring-[hsl(var(--stage-progress))]" : ""}`}>
              {p.popular && <div className="absolute -top-2 right-3 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[hsl(var(--stage-progress))] text-background font-semibold">Popular</div>}
              <div className="text-sm font-semibold">{p.id}</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-semibold">${p.price}</span>
                <span className="text-xs text-muted-foreground mb-1">/mo</span>
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs"><Check className="h-3.5 w-3.5 mt-0.5 text-[hsl(var(--stage-completed))]" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full mt-5 h-9" variant={isCurrent ? "secondary" : "default"} disabled={isCurrent}
                onClick={() => { updateSubscription({ plan: p.id, priceMonthly: p.price, status: "active" }); toast({ title: `Switched to ${p.id}` }); }}>
                {isCurrent ? "Current plan" : "Switch"}
              </Button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
};

const Info = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="p-3 rounded-lg bg-secondary/50 hairline">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">{icon} {label}</div>
    <div className="text-lg font-semibold mt-0.5">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs py-2 border-b border-border last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium capitalize">{value}</span>
  </div>
);

import { useRef, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Copy, Share2, Users, DollarSign, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { API } from "@/lib/config";

const BONUS_PER_REFERRAL = 15;

export const Referral = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<{ referralCode: string; bonusBalance: number; referrals: any[] } | null>(null);
  const [useOpen, setUseOpen] = useState(false);
  const [useAmount, setUseAmount] = useState("");
  const linkRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50, active: false });

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/auth/referral?userId=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.referralCode) setData(d); });
  }, [user?.id]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = linkRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, active: true });
  };

  const code = data?.referralCode ?? "—";
  const link = `${window.location.origin}/?ref=${code}`;
  const totalEarned = (data?.referrals ?? []).reduce((s: number, r: any) => s + (r.reward || 0), 0);
  const bonusBalance = data?.bonusBalance ?? 0;

  const handleUseBonus = async () => {
    const amount = Number(useAmount);
    if (!amount || amount <= 0 || amount > bonusBalance || !user?.id) return;
    const res = await fetch(`${API}/auth/referral/use-bonus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, amount }),
    }).then(r => r.json());
    if (res.success) {
      setData(prev => prev ? { ...prev, bonusBalance: res.remaining } : prev);
      setUseOpen(false);
      setUseAmount("");
      toast({ title: `$${amount} applied to your account` });
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader title="Referral" subtitle="Share MBE, earn $15 per sign-up. Use bonus on subscription." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Bonus balance" value={`$${bonusBalance.toFixed(0)}`} delta="available to use" tone={bonusBalance > 0 ? "pos" : "neutral"} />
        <Stat label="Total earned" value={`$${totalEarned}`} delta="lifetime" tone={totalEarned > 0 ? "pos" : "neutral"} />
        <Stat label="Referrals" value={`${(data?.referrals ?? []).length}`} delta={`${(data?.referrals ?? []).filter((r: any) => r.status === "active").length} active`} />
        <Stat label="Per sign-up" value={`$${BONUS_PER_REFERRAL}`} delta="credited instantly" />
      </div>

      {/* Bonus usage banner */}
      {bonusBalance > 0 && (
        <div className="mb-4 p-4 rounded-xl hairline flex items-center justify-between gap-4" style={{ background: "hsl(var(--stage-completed)/0.08)", border: "1px solid hsl(var(--stage-completed)/0.2)" }}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0" style={{ color: "hsl(var(--stage-completed))" }} />
            <div>
              <div className="text-sm font-medium">You have <span style={{ color: "hsl(var(--stage-completed))" }}>${bonusBalance.toFixed(0)}</span> in bonus credits</div>
              <div className="text-xs text-muted-foreground">Apply to reduce your next subscription payment</div>
            </div>
          </div>
          <Button className="h-9 shrink-0" onClick={() => setUseOpen(true)}>Use bonus</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Referral link card */}
        <div
          ref={linkRef}
          onMouseMove={onMove}
          onMouseEnter={() => setMouse((m) => ({ ...m, active: true }))}
          onMouseLeave={() => setMouse((m) => ({ ...m, active: false }))}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-card hairline p-5"
        >
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[hsl(var(--stage-completed)/0.15)] blur-2xl pointer-events-none" />
          <div
            className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(480px circle at ${mouse.x}% ${mouse.y}%, hsl(var(--stage-completed) / 0.25), transparent 65%)`,
              opacity: mouse.active ? 1 : 0,
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2" style={{ color: "hsl(var(--stage-completed))" }}>
              <Gift className="h-5 w-5" />
              <span className="text-[11px] uppercase tracking-widest font-semibold">Your link</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Input readOnly value={data ? link : "Loading…"} className="font-mono text-xs" />
              <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(link); toast({ title: "Link copied!" }); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigator.share?.({ url: link, title: "Try MBE — Business Management" }).catch(() => {})}>
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Code: <span className="font-mono text-foreground">{code}</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Step n={1} title="Share" desc="Send your link to business owners." />
              <Step n={2} title="They sign up" desc={`Register using your code.`} />
              <Step n={3} title="You earn $15" desc="Credited to your balance instantly." />
            </div>
          </div>
        </div>

        {/* Referrals list */}
        <Panel>
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Your referrals</div>
          <div className="space-y-2">
            {(data?.referrals ?? []).length === 0 && (
              <div className="text-xs text-muted-foreground py-8 text-center">No referrals yet. Share your link!</div>
            )}
            {(data?.referrals ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hairline">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{r.email}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    {format(parseISO(r.joinedAt), "MMM d, yyyy")} ·
                    <span className="flex items-center gap-1" style={{ color: r.status === "active" ? "hsl(var(--stage-completed))" : "hsl(var(--muted-foreground))" }}>
                      {r.status === "active" && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {r.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--stage-completed))" }}>
                  <DollarSign className="h-3 w-3" />{r.reward}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Use bonus dialog */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Use bonus credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/40 hairline text-sm">
              Available: <span className="font-semibold" style={{ color: "hsl(var(--stage-completed))" }}>${bonusBalance.toFixed(0)}</span>
            </div>
            <div>
              <Label>Amount to apply ($)</Label>
              <Input
                type="number"
                min={1}
                max={bonusBalance}
                value={useAmount}
                onChange={(e) => setUseAmount(e.target.value)}
                placeholder={`Max $${bonusBalance.toFixed(0)}`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              This will deduct from your bonus balance and apply as a discount on your next subscription payment.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUseOpen(false)}>Cancel</Button>
            <Button onClick={handleUseBonus} disabled={!useAmount || Number(useAmount) > bonusBalance}>
              Apply ${useAmount || 0}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
  <div className="p-3 rounded-lg bg-secondary/40 hairline">
    <div className="h-6 w-6 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-semibold">{n}</div>
    <div className="mt-2 text-sm font-medium">{title}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
  </div>
);

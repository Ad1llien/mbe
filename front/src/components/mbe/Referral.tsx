import { useRef, useState } from "react";
import { Panel, SectionHeader, Stat } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Share2, Users, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SAMPLE_REFERRALS = [
  { name: "Nora Coffee", joined: "Apr 12, 2026", status: "active", reward: 49 },
  { name: "BeanLab Roasters", joined: "Mar 28, 2026", status: "active", reward: 49 },
  { name: "Steam & Foam", joined: "Mar 02, 2026", status: "trial", reward: 0 },
];

export const Referral = () => {
  const [code] = useState("MBE-ALEX-7Q4K");
  const link = `https://mbe.app/?ref=${code}`;
  const totalEarned = SAMPLE_REFERRALS.reduce((s, r) => s + r.reward, 0);
  const linkRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50, active: false });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = linkRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, active: true });
  };

  return (
    <div className="fade-in">
      <SectionHeader title="Referral" subtitle="Share MBE, earn 30% recurring commission for 12 months." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Earned" value={`$${totalEarned}`} delta="lifetime" />
        <Stat label="Active referrals" value={`${SAMPLE_REFERRALS.filter(r => r.status === "active").length}`} delta="paying" />
        <Stat label="On trial" value={`${SAMPLE_REFERRALS.filter(r => r.status === "trial").length}`} delta="14-day" />
        <Stat label="Commission" value="30%" delta="for 12 months" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              background: `radial-gradient(480px circle at ${mouse.x}% ${mouse.y}%, hsl(var(--stage-completed) / 0.30), hsl(var(--stage-completed) / 0.06) 35%, transparent 65%)`,
              opacity: mouse.active ? 1 : 0,
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-[hsl(var(--stage-completed))]"><Gift className="h-5 w-5" /><span className="text-[11px] uppercase tracking-widest font-semibold">Your link</span></div>
            <div className="mt-3 flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" />
              <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(link); toast({ title: "Link copied" }); }}><Copy className="h-4 w-4" /></Button>
              <Button onClick={() => navigator.share?.({ url: link, title: "Try MBE" }).catch(() => {})}><Share2 className="h-4 w-4 mr-1" /> Share</Button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Code: <span className="font-mono text-foreground">{code}</span></div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Step n={1} title="Share" desc="Send your link to business owners." />
              <Step n={2} title="They sign up" desc="Get 14-day free trial via your code." />
              <Step n={3} title="You earn" desc="30% of their bill for 12 months." />
            </div>
          </div>
        </div>

        <Panel>
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Your referrals</div>
          <div className="space-y-2">
            {SAMPLE_REFERRALS.map((r) => (
              <div key={r.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hairline">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">since {r.joined} · {r.status}</div>
                </div>
                <div className="text-xs font-semibold flex items-center gap-1"><DollarSign className="h-3 w-3" />{r.reward}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
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

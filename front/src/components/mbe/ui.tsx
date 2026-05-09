import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Panel = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-2xl bg-card hairline p-5", className)}>{children}</div>
);

export const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex items-end justify-between mb-6 slide-up">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Stat = ({
  label, value, delta, tone,
}: { label: string; value: string; delta?: string; tone?: "pos" | "neg" | "neutral" | "auto"; }) => {
  const toneClass =
    tone === "pos" ? "text-[hsl(var(--stage-completed))]" :
    tone === "neg" ? "text-[hsl(var(--stage-new))]" :
    tone === "neutral" ? "text-foreground" : "";
  return (
    <Panel>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", toneClass)}>{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
    </Panel>
  );
};

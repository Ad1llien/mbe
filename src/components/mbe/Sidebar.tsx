import { Logo } from "./Logo";
import { LayoutGrid, Wallet, Boxes, Users, ListChecks, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Section = "finance" | "inventory" | "crm" | "tasks" | "profile" | "settings";

const items: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "crm", label: "CRM", icon: Users },
  { id: "tasks", label: "Task List", icon: ListChecks },
];

const bottom: typeof items = [
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ active, onChange }: { active: Section; onChange: (s: Section) => void }) => {
  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 panel border-r border-border flex flex-col">
      <div className="px-6 pt-7 pb-5 border-b border-border flex items-center justify-center">
        <Logo />
      </div>

      <div className="px-3 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Workspace</div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-elegant"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium tracking-tight">{it.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-border space-y-1">
        {bottom.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{it.label}</span>
            </button>
          );
        })}
        <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">AM</div>
          <div className="leading-tight">
            <div className="text-xs font-medium">Alex Mercer</div>
            <div className="text-[10px] text-muted-foreground">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

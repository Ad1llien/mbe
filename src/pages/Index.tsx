import { useState, useEffect } from "react";
import { Sidebar, Section } from "@/components/mbe/Sidebar";
import { Dashboard } from "@/components/mbe/Dashboard";
import { POS } from "@/components/mbe/POS";
import { Finance } from "@/components/mbe/Finance";
import { Inventory } from "@/components/mbe/Inventory";
import { CRM } from "@/components/mbe/CRM";
import { TaskList } from "@/components/mbe/TaskList";
import { StaffPage } from "@/components/mbe/Staff";
import { Premium } from "@/components/mbe/Premium";
import { Referral } from "@/components/mbe/Referral";
import { Reports } from "@/components/mbe/Reports";
import { Profile, SettingsPage } from "@/components/mbe/Misc";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CalendarPage } from "@/components/mbe/CalendarPage";

const Index = () => {
  const [active, setActive] = useState<Section>("dashboard");
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar active={active} onChange={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center gap-3 px-6 panel">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search deals, items, transactions…" className="pl-9 h-9 bg-secondary border-transparent" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              className="h-9 w-9 rounded-lg bg-secondary grid place-items-center hover:bg-accent transition-colors"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="h-9 w-9 rounded-lg bg-secondary grid place-items-center hover:bg-accent transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">AM</div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {active === "dashboard" && <Dashboard onGoto={(s) => setActive(s as Section)} />}
          {active === "pos" && <POS />}
          {active === "finance" && <Finance />}
          {active === "inventory" && <Inventory />}
          {active === "crm" && <CRM />}
          {active === "calendar" && <CalendarPage />}
          {active === "tasks" && <TaskList />}
          {active === "staff" && <StaffPage />}
          {active === "premium" && <Premium />}
          {active === "referral" && <Referral />}
          {active === "reports" && <Reports />}
          {active === "profile" && <Profile />}
          {active === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default Index;
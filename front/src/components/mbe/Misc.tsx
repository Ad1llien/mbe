import { useState, useEffect } from "react";
import { Panel, SectionHeader } from "./ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, RefreshCw } from "lucide-react";
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { API } from "@/lib/config";

export const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();
  return(
    <div className="fade-in max-w-3xl">
    <SectionHeader title="Profile" subtitle="Your account information." />
    <Panel>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center text-xl font-semibold">
          {initials}
        </div>
        <div>
          <div className="font-medium">{email}</div>
          <div className="text-xs text-muted-foreground">Owner • MBE Workspace</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Email</Label><Input defaultValue={email} /></div>
      </div>
    </Panel>
  </div>
  )
};

export const SettingsPage = () => {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API}/leads/business/my?userId=${user.id}`)
        .then(r => r.json())
        .then(data => { if (data?.id) setBusiness(data); });
    }
  }, [user?.id, refreshKey]);

  const webhookUrl = business
    ? `${API}/leads/webhook?businessId=${business.id}&secret=${business.webhookSecret}`
    : null;

  const handleCopy = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    await fetch(
      `${API}/leads/business/regenerate-secret?userId=${user?.id}`,
      { method: 'POST' }
    );
    setBusiness(null);
    const biz = await fetch(
      `${API}/leads/business/my?userId=${user?.id}`
    ).then(r => r.json());
    setBusiness(biz);
    setConfirmOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fade-in max-w-3xl">
      <SectionHeader title="Settings" subtitle="Workspace preferences." />
      <Panel>
        <div className="space-y-4">
          {[
            ["Email notifications", "Get notified about deals and low stock"],
            ["Auto-sync CRM to Finance", "Issue receipts when deals are completed"],
            ["Show overdue task badges", "Highlight overdue items prominently"],
          ].map(([t, d]) => (
            <div key={t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-medium">{t}</div>
                <div className="text-xs text-muted-foreground">{d}</div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
        <button onClick={handleLogout} className="...">Выйти</button>
      </Panel>

      {webhookUrl && (
        <Panel className="mt-4">
          <div className="text-sm font-medium mb-1">Webhook URL для заявок</div>
          <div className="text-xs text-muted-foreground mb-3">
            Вставь эту ссылку в Facebook / Instagram Ads → Lead Forms → Webhook
          </div>
          <div className="flex items-center gap-2">
            <Input value={webhookUrl} readOnly className="text-xs font-mono" />
            <Button size="icon" variant="secondary" onClick={handleCopy} title={copied ? "Скопировано!" : "Скопировать"}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setConfirmOpen(true)} title="Пересоздать ссылку">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {copied && <div className="text-xs text-green-500 mt-1">Скопировано!</div>}

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Пересоздать webhook ссылку?</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Текущая ссылка станет <span className="text-destructive font-medium">недействительной</span>.</p>
                <p>Если эта ссылка была подключена к Facebook / Instagram Ads — заявки перестанут приходить до тех пор, пока вы не обновите ссылку в рекламном кабинете.</p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Отмена</Button>
                <Button variant="destructive" onClick={handleRegenerate}>Пересоздать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Panel>
      )}
    </div>
  );
};

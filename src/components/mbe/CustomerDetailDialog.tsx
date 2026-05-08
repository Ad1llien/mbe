import { useMemo, useState } from "react";
import { useStore, type Customer } from "./store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageCircle, Instagram, MapPin, Cake, Tag, DollarSign, Receipt as ReceiptIcon, Save, X } from "lucide-react";
import { format, parseISO } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  customer?: Customer | null;
  /** Fallback display name when no customer record exists (e.g. CRM deal client). */
  fallbackName?: string;
};

export const CustomerDetailDialog = ({ open, onOpenChange, customer, fallbackName }: Props) => {
  const { receipts, deals, updateCustomer } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Customer>>(customer ?? {});

  // sync draft when customer changes
  useMemo(() => { setDraft(customer ?? {}); setEditing(false); }, [customer?.id]);

  const name = customer?.name ?? fallbackName ?? "Unknown client";

  const clientReceipts = useMemo(
    () => (customer ? receipts.filter((r) => r.customerId === customer.id && !r.voided) : []),
    [receipts, customer],
  );
  const clientDeals = useMemo(
    () => deals.filter((d) => d.client.toLowerCase() === name.toLowerCase()),
    [deals, name],
  );

  const ltv =
    clientReceipts.reduce((s, r) => s + r.total, 0) +
    clientDeals.filter((d) => d.stageId === "completed").reduce((s, d) => s + d.amount, 0);

  const phoneClean = (customer?.phone ?? "").replace(/[^\d+]/g, "");
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">{initials}</div>
            <div>
              <div className="text-base">{name}</div>
              {customer?.status && (
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{customer.status}</div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {!customer ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            No CRM customer record. Deal stats below are pulled from the pipeline.
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {customer.phone && (
                <>
                  <a href={`tel:${phoneClean}`}><Button size="sm" variant="secondary" className="h-8"><Phone className="h-3.5 w-3.5 mr-1" /> Call</Button></a>
                  <a href={`https://wa.me/${phoneClean.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary" className="h-8"><MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp</Button>
                  </a>
                </>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`}><Button size="sm" variant="secondary" className="h-8"><Mail className="h-3.5 w-3.5 mr-1" /> Email</Button></a>
              )}
              {customer.socialHandle && (
                <a href={`https://instagram.com/${customer.socialHandle.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary" className="h-8"><Instagram className="h-3.5 w-3.5 mr-1" /> {customer.socialHandle}</Button>
                </a>
              )}
              <div className="ml-auto">
                {!editing ? (
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setDraft(customer); setEditing(false); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" className="h-8" onClick={() => { updateCustomer(customer.id, draft); setEditing(false); }}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Mini icon={<DollarSign className="h-3 w-3" />} label="Lifetime value" value={`$${ltv.toLocaleString()}`} />
              <Mini icon={<ReceiptIcon className="h-3 w-3" />} label="Receipts" value={`${clientReceipts.length}`} />
              <Mini icon={<Tag className="h-3 w-3" />} label="Deals" value={`${clientDeals.length}`} />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Phone" icon={<Phone className="h-3 w-3" />} value={customer.phone}
                editing={editing} onChange={(v) => setDraft({ ...draft, phone: v })} draft={draft.phone} />
              <Field label="Email" icon={<Mail className="h-3 w-3" />} value={customer.email}
                editing={editing} onChange={(v) => setDraft({ ...draft, email: v })} draft={draft.email} />
              <Field label="Source" value={customer.source}
                editing={editing} onChange={(v) => setDraft({ ...draft, source: v })} draft={draft.source}
                placeholder="Instagram, TikTok, Referral…" />
              <Field label="Social handle" icon={<Instagram className="h-3 w-3" />} value={customer.socialHandle}
                editing={editing} onChange={(v) => setDraft({ ...draft, socialHandle: v })} draft={draft.socialHandle}
                placeholder="@username" />
              <Field label="City" icon={<MapPin className="h-3 w-3" />} value={customer.city}
                editing={editing} onChange={(v) => setDraft({ ...draft, city: v })} draft={draft.city} />
              <Field label="Birthday" icon={<Cake className="h-3 w-3" />} value={customer.birthday}
                editing={editing} onChange={(v) => setDraft({ ...draft, birthday: v })} draft={draft.birthday}
                placeholder="YYYY-MM-DD" />
            </div>

            {/* Tags */}
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {customer.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">#{t}</span>
                ))}
              </div>
            )}

            {/* Note */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Notes</Label>
              {editing ? (
                <Textarea value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={3} />
              ) : (
                <div className="text-xs p-2.5 rounded-md bg-secondary/50 min-h-[40px] whitespace-pre-wrap">
                  {customer.note ?? <span className="text-muted-foreground">No notes yet.</span>}
                </div>
              )}
            </div>

            {/* Recent deals */}
            {clientDeals.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Deals</div>
                <div className="space-y-1 max-h-[140px] overflow-auto">
                  {clientDeals.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-secondary/40">
                      <div className="truncate">{d.title}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{format(parseISO(d.createdAt), "MMM d")}</span>
                        <span className="font-semibold">${d.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground">
              Customer since {format(parseISO(customer.createdAt), "MMM d, yyyy")}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Mini = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="p-2.5 rounded-lg bg-secondary/50 hairline">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">{icon} {label}</div>
    <div className="text-sm font-semibold mt-0.5 tabular-nums">{value}</div>
  </div>
);

const Field = ({
  label, icon, value, editing, draft, onChange, placeholder,
}: {
  label: string; icon?: React.ReactNode; value?: string; editing: boolean;
  draft?: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <div>
    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">{icon} {label}</Label>
    {editing ? (
      <Input value={draft ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" placeholder={placeholder} />
    ) : (
      <div className="text-xs h-8 flex items-center px-2 rounded-md bg-secondary/40">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    )}
  </div>
);

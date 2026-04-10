import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Crown, ExternalLink, CreditCard, Lock } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

const GREENN_PORTAL = import.meta.env.VITE_GREENN_PORTAL || "#";

interface PrinterRow {
  id: string; nome: string;
}

export default function SettingsPage() {
  const { user, isPro, profile } = useAuth();
  const { isAnual } = useAuth();
  const [settings, setSettings] = useState({ defaultTariff: 0.85, defaultMargin: 50, defaultTaxRate: 6 });
  const [pixDiscount, setPixDiscount] = useState(0);
  const [cardFeePercent, setCardFeePercent] = useState(4.99);
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [defaultPrinterId, setDefaultPrinterId] = useState<string>("");
  const [defaultState, setDefaultState] = useState<string>("");
  const [defaultCity, setDefaultCity] = useState<string>("");
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("impressoras").select("id, nome")
      .or(`user_id.eq.${user.id},is_precadastrada.eq.true`)
      .then(({ data }) => { if (data) setPrinters(data as any); });

    supabase.from("user_settings").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setSettings({ defaultTariff: data.default_tariff, defaultMargin: data.default_margin, defaultTaxRate: data.default_tax_rate });
          setDefaultPrinterId((data as any).default_printer_id || "");
          setDefaultState((data as any).default_state || "");
          setDefaultCity((data as any).default_city || "");
        }
      });
  }, [user]);

  // Load cities when default state changes
  useEffect(() => {
    if (!defaultState) { setCities([]); return; }
    setCitiesLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${defaultState}/municipios`)
      .then(r => r.json())
      .then((data: { id: number; nome: string }[]) => setCities(data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [defaultState]);

  const update = (k: string, v: number) => setSettings(s => ({ ...s, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    const payload = {
      default_tariff: settings.defaultTariff,
      default_margin: settings.defaultMargin,
      default_tax_rate: settings.defaultTaxRate,
      default_printer_id: defaultPrinterId || null,
      default_state: defaultState || null,
      default_city: defaultCity || null,
    };
    const { data: existing } = await supabase.from("user_settings").select("id").eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("user_settings").update(payload as any).eq("user_id", user.id);
    } else {
      await supabase.from("user_settings").insert({ user_id: user.id, ...payload } as any);
    }
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Valores padrão e assinatura</p>
      </div>

      {/* Subscription */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground">Assinatura</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium">Plano atual</p>
              <Badge variant="outline" className={isPro ? "border-primary/50 text-primary mt-1" : "border-border text-muted-foreground mt-1"}>
                {isPro ? <><Crown size={12} className="mr-1" /> Pro</> : "Free"}
              </Badge>
            </div>
            {isPro && profile?.plano_expiracao && (
              <p className="text-xs text-muted-foreground">
                Renova em: {new Date(profile.plano_expiracao).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          {isPro ? (
            <a href={GREENN_PORTAL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full border-border">
                <ExternalLink size={14} className="mr-2" /> Gerenciar minha assinatura
              </Button>
            </a>
          ) : (
            <Button onClick={() => setUpgradeOpen(true)} className="w-full bg-primary text-primary-foreground neon-glow">
              <Crown size={14} className="mr-2" /> Fazer Upgrade para Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground">Padrões para Precificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-foreground">Impressora padrão</Label>
            <Select value={defaultPrinterId} onValueChange={setDefaultPrinterId}>
              <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {printers.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Estado padrão</Label>
              <Select value={defaultState} onValueChange={v => { setDefaultState(v); setDefaultCity(""); }}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{BRAZILIAN_STATES.map(s => <SelectItem key={s.uf} value={s.uf}>{s.uf} — {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Cidade padrão</Label>
              {citiesLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select value={defaultCity} onValueChange={setDefaultCity} disabled={!defaultState}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div>
            <Label className="text-foreground">Tarifa de energia padrão (R$/kWh)</Label>
            <Input type="number" step={0.01} value={settings.defaultTariff} onChange={e => update('defaultTariff', +e.target.value)} className="bg-muted border-border" />
          </div>
          <div>
            <Label className="text-foreground">Margem de lucro padrão (%)</Label>
            <Input type="number" value={settings.defaultMargin} onChange={e => update('defaultMargin', +e.target.value)} className="bg-muted border-border" />
          </div>
          <div>
            <Label className="text-foreground">Taxa de imposto padrão (%)</Label>
            <Input type="number" value={settings.defaultTaxRate} onChange={e => update('defaultTaxRate', +e.target.value)} className="bg-muted border-border" />
          </div>
          <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground neon-glow">Salvar Configurações</Button>
        </CardContent>
      </Card>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Package, Wrench, DollarSign, Plus, Trash2, Info, RefreshCw, Loader2, Lock, Share2, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import type { FilamentEntry } from "@/lib/types";
import { FILAMENT_TYPES, PACKAGING_TYPES } from "@/lib/types";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(173,80%,50%)", "hsl(200,100%,60%)", "hsl(160,100%,50%)", "hsl(280,80%,60%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)", "hsl(30,80%,50%)", "hsl(310,60%,55%)"];
const FILAMENT_COLORS = ["#00ccaa", "#3399ff", "#ff6633", "#cc33ff", "#ffcc00", "#00ff88", "#ff3366", "#6633ff"];

const CATEGORY_EMOJI: Record<string, string> = {
  decorativo: "🎨",
  funcional: "⚙️",
  miniatura: "🎭",
  customizado: "✨",
};

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><Info size={14} className="text-muted-foreground inline ml-1 cursor-help" /></TooltipTrigger>
      <TooltipContent className="max-w-[250px] text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function createFilament(index: number): FilamentEntry {
  return { id: crypto.randomUUID(), color: FILAMENT_COLORS[index % FILAMENT_COLORS.length], type: 'PLA', brand: '', costPerKg: 0, weightUsed: 0, computedCost: 0 };
}

interface PrinterRow {
  id: string; name: string; kinematics: string; acquisition_cost: number;
  lifespan: number; power_consumption: number; maintenance_cost_monthly: number;
  monthly_usage_hours: number; max_filaments: number;
}

interface MarginSuggestion {
  categoria: string;
  margem_minima: number;
  margem_sugerida: number;
  margem_maxima: number;
  justificativa: string;
  fallback?: boolean;
}

export default function NewPricing() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const { canCreateQuote, quotesThisMonth, refresh } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [settings, setSettings] = useState({ defaultTariff: 0.85, defaultMargin: 150, defaultTaxRate: 6 });

  useEffect(() => {
    if (!user) return;
    supabase.from("printers").select("*").eq("user_id", user.id)
      .then(({ data }) => { if (data) setPrinters(data); });
    supabase.from("user_settings").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) setSettings({ defaultTariff: data.default_tariff, defaultMargin: data.default_margin, defaultTaxRate: data.default_tax_rate });
      });
  }, [user]);

  const [pieceName, setPieceName] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [filaments, setFilaments] = useState<FilamentEntry[]>([createFilament(0)]);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [tariff, setTariff] = useState(settings.defaultTariff);
  const [distributor, setDistributor] = useState("");
  const [tariffRef, setTariffRef] = useState("");
  const [tariffLoading, setTariffLoading] = useState(false);
  const [laborMode, setLaborMode] = useState<"auto" | "manual">("auto");
  const [laborRate, setLaborRate] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  const [laborAutoPct, setLaborAutoPct] = useState(15);
  const [pkgType, setPkgType] = useState("none");
  const [pkgCost, setPkgCost] = useState(0);
  const [margin, setMargin] = useState(settings.defaultMargin);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);

  // AI margin suggestion
  const [marginSuggestion, setMarginSuggestion] = useState<MarginSuggestion | null>(null);
  const [marginLoading, setMarginLoading] = useState(false);
  const marginFetchRef = useRef<string>("");

  const printer = useMemo(() => printers.find(p => p.id === printerId), [printerId, printers]);
  const printTimeH = hours + minutes / 60;

  // Fetch cities
  useEffect(() => {
    if (!state) { setCities([]); setCity(""); return; }
    setCitiesLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
      .then(r => r.json())
      .then((data: { id: number; nome: string }[]) => setCities(data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
    setCity("");
  }, [state]);

  // Fetch tariff via AI
  useEffect(() => {
    if (!city || !state) return;
    setTariffLoading(true);
    const fetchTariff = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('energy-tariff', {
          body: { city, state },
        });
        if (error) throw error;
        if (data && data.tarifa) {
          setTariff(data.tarifa);
          setDistributor(data.distribuidora || "Distribuidora local");
          setTariffRef(data.referencia || "");
          if (data.fallback) {
            toast.info("Tarifa padrão aplicada. Ajuste manualmente se necessário.");
          }
        }
      } catch {
        setTariff(settings.defaultTariff);
        setDistributor("Distribuidora local");
        setTariffRef("padrão");
        toast.info("Tarifa padrão aplicada. Ajuste manualmente se necessário.");
      } finally {
        setTariffLoading(false);
      }
    };
    fetchTariff();
  }, [city, state]);

  // Fetch margin suggestion via AI
  useEffect(() => {
    const firstFilamentType = filaments[0]?.type;
    if (!pieceName.trim() || !firstFilamentType) return;
    const key = `${pieceName}|${firstFilamentType}`;
    if (key === marginFetchRef.current) return;

    const timer = setTimeout(async () => {
      marginFetchRef.current = key;
      setMarginLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('margin-suggestion', {
          body: { pieceName, filamentType: firstFilamentType },
        });
        if (error) throw error;
        if (data) {
          setMarginSuggestion(data as MarginSuggestion);
          if (!data.fallback) {
            setMargin(data.margem_sugerida);
          }
        }
      } catch {
        setMarginSuggestion({
          categoria: "decorativo",
          margem_minima: 80,
          margem_sugerida: 150,
          margem_maxima: 250,
          justificativa: "Margem padrão aplicada. Ajuste conforme sua experiência.",
          fallback: true,
        });
      } finally {
        setMarginLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [pieceName, filaments[0]?.type]);

  const handlePrinterChange = (id: string) => {
    const hasData = filaments.some(f => f.weightUsed > 0 || f.brand || f.costPerKg > 0);
    if (hasData) setConfirmReset(id);
    else { setPrinterId(id); setFilaments([createFilament(0)]); }
  };

  const confirmPrinterChange = () => {
    if (confirmReset) { setPrinterId(confirmReset); setFilaments([createFilament(0)]); setConfirmReset(null); }
  };

  const updateFilament = (id: string, updates: Partial<FilamentEntry>) => {
    setFilaments(fs => fs.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      updated.computedCost = (updated.costPerKg / 1000) * updated.weightUsed;
      return updated;
    }));
  };

  const addFilament = () => {
    if (printer && filaments.length < printer.max_filaments) setFilaments(fs => [...fs, createFilament(fs.length)]);
  };

  const removeFilament = (id: string) => setFilaments(fs => fs.filter(f => f.id !== id));

  const totalWeight = filaments.reduce((s, f) => s + f.weightUsed, 0);
  const totalFilamentCost = filaments.reduce((s, f) => s + f.computedCost, 0);
  const energyCost = printer ? (printer.power_consumption / 1000) * printTimeH * tariff : 0;
  const manualLaborCost = laborRate * laborHours;
  const maintPerHour = printer && printer.monthly_usage_hours > 0 ? printer.maintenance_cost_monthly / printer.monthly_usage_hours : 0;
  const depPerHour = printer && printer.lifespan > 0 ? printer.acquisition_cost / printer.lifespan : 0;
  const maintenanceCost = maintPerHour * printTimeH;
  const depreciationCost = depPerHour * printTimeH;

  const productionBase = totalFilamentCost + energyCost + maintenanceCost + depreciationCost + pkgCost;
  const autoLaborCost = productionBase * (laborAutoPct / 100);
  const laborCost = laborMode === "manual" ? manualLaborCost : autoLaborCost;

  const totalCost = totalFilamentCost + energyCost + laborCost + maintenanceCost + depreciationCost + pkgCost;
  const taxAmount = totalCost * (taxRate / 100);
  const minimumPrice = totalCost + taxAmount;
  const suggestedPrice = minimumPrice * (1 + margin / 100);
  const profit = suggestedPrice - minimumPrice;

  const calcPriceForMargin = (m: number) => minimumPrice * (1 + m / 100);
  const calcProfitForMargin = (m: number) => calcPriceForMargin(m) - minimumPrice;

  const pieData = [
    { name: "Filamento", value: +totalFilamentCost.toFixed(2) },
    { name: "Energia", value: +energyCost.toFixed(2) },
    { name: "Mão de obra", value: +laborCost.toFixed(2) },
    { name: "Manutenção", value: +maintenanceCost.toFixed(2) },
    { name: "Depreciação", value: +depreciationCost.toFixed(2) },
    { name: "Embalagem", value: +pkgCost.toFixed(2) },
    { name: "Margem", value: +profit.toFixed(2) },
    { name: "Impostos", value: +taxAmount.toFixed(2) },
  ].filter(d => d.value > 0);

  const handleSave = async () => {
    if (!pieceName.trim()) { toast.error("Nome da peça é obrigatório"); return; }
    if (!printer) { toast.error("Selecione uma impressora"); return; }
    if (!user) return;
    if (!canCreateQuote) { setUpgradeOpen(true); return; }

    await supabase.from("quotes").insert({
      user_id: user.id,
      piece_name: pieceName, printer_id: printerId, printer_name: printer.name,
      print_time_hours: hours, print_time_minutes: minutes,
      filaments: filaments as any, total_weight: totalWeight, total_filament_cost: totalFilamentCost,
      state, city, distributor, tariff, energy_cost: energyCost,
      labor_rate: laborMode === "manual" ? laborRate : 0, labor_hours: laborMode === "manual" ? laborHours : 0, labor_cost: laborCost, labor_percentage: laborMode === "auto" ? laborAutoPct : 0,
      maintenance_cost: maintenanceCost, depreciation_cost: depreciationCost,
      packaging_type: pkgType, packaging_cost: pkgCost,
      profit_margin: margin, tax_rate: taxRate,
      total_cost: totalCost, suggested_price: suggestedPrice, minimum_price: minimumPrice,
    });
    toast.success("Orçamento salvo com sucesso!");
    refresh();
  };

  const handleExportPDF = () => {
    if (!isPro) { setUpgradeOpen(true); return; }
    toast.info("Exportação PDF em breve!");
  };

  const handleExportCSV = () => {
    if (!isPro) { setUpgradeOpen(true); return; }
    if (!pieceName || !printer) return;
    const rows = [
      ["Item", "Valor (R$)"],
      ["Filamento", totalFilamentCost.toFixed(2)],
      ["Energia", energyCost.toFixed(2)],
      ["Mão de obra", laborCost.toFixed(2)],
      ["Manutenção", maintenanceCost.toFixed(2)],
      ["Depreciação", depreciationCost.toFixed(2)],
      ["Embalagem", pkgCost.toFixed(2)],
      ["Custo Total", totalCost.toFixed(2)],
      ["Impostos", taxAmount.toFixed(2)],
      ["Preço Mínimo", minimumPrice.toFixed(2)],
      [`Margem ${margin}%`, profit.toFixed(2)],
      ["Preço Sugerido", suggestedPrice.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${pieceName}-orcamento.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Precificação</h1>
        <p className="text-muted-foreground text-sm mt-1">Calcule o preço ideal da sua peça 3D</p>
      </div>

      {/* SECTION A */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Package size={16} className="text-primary" />Dados da Impressão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-foreground">Nome da peça</Label><Input value={pieceName} onChange={e => setPieceName(e.target.value)} placeholder="Ex: Vaso decorativo" className="bg-muted border-border" /></div>
          <div>
            <Label className="text-foreground">Impressora</Label>
            <Select value={printerId} onValueChange={handlePrinterChange}>
              <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{printers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            {printer && (
              <div className="flex gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{printer.kinematics}</Badge>
                <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Até {printer.max_filaments} filamento{printer.max_filaments > 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{printer.power_consumption}W</Badge>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground">Horas</Label><Input type="number" min={0} value={hours || ''} onChange={e => setHours(+e.target.value)} className="bg-muted border-border" /></div>
            <div><Label className="text-foreground">Minutos</Label><Input type="number" min={0} max={59} value={minutes || ''} onChange={e => setMinutes(+e.target.value)} className="bg-muted border-border" /></div>
          </div>
          <div className="text-xs text-muted-foreground">Peso total: <span className="font-mono text-primary">{totalWeight.toFixed(1)}g</span></div>
        </CardContent>
      </Card>

      {/* SECTION B */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">🎨 Filamentos</CardTitle>
            {printer && printer.max_filaments > 1 && filaments.length < printer.max_filaments && (
              <Button size="sm" variant="outline" onClick={addFilament} className="border-primary/30 text-primary text-xs">
                <Plus size={14} className="mr-1" /> Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filaments.map((f, i) => (
            <div key={f.id} className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: f.color }} />
                  <span className="text-xs font-medium text-foreground">Filamento {i + 1}</span>
                </div>
                {i > 0 && <button onClick={() => removeFilament(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-foreground">Tipo</Label>
                  <Select value={f.type} onValueChange={v => updateFilament(f.id, { type: v })}>
                    <SelectTrigger className="bg-background border-border text-xs h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{FILAMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-foreground">Marca</Label><Input value={f.brand} onChange={e => updateFilament(f.id, { brand: e.target.value })} className="bg-background border-border text-xs h-8" /></div>
                <div><Label className="text-xs text-foreground">Custo/kg (R$)</Label><Input type="number" value={f.costPerKg || ''} onChange={e => updateFilament(f.id, { costPerKg: +e.target.value })} className="bg-background border-border text-xs h-8" /></div>
                <div><Label className="text-xs text-foreground">Peso usado (g)</Label><Input type="number" value={f.weightUsed || ''} onChange={e => updateFilament(f.id, { weightUsed: +e.target.value })} className="bg-background border-border text-xs h-8" /></div>
              </div>
              <div className="text-xs text-right text-muted-foreground">Custo: <span className="font-mono text-primary">R$ {f.computedCost.toFixed(2)}</span></div>
            </div>
          ))}
          <div className="flex justify-between text-xs border-t border-border pt-3">
            <span className="text-muted-foreground">Total filamentos</span>
            <span className="font-mono text-primary font-bold">R$ {totalFilamentCost.toFixed(2)} · {totalWeight.toFixed(1)}g</span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION C */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Zap size={16} className="text-primary" />Energia<Tip text="Tarifa estimada com base na distribuidora da sua região. Verifique sua fatura para maior precisão." /></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Estado</Label>
              <Select value={state} onValueChange={v => { setState(v); setCity(""); }}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{BRAZILIAN_STATES.map(s => <SelectItem key={s.uf} value={s.uf}>{s.uf} — {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Cidade</Label>
              {citiesLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select value={city} onValueChange={setCity} disabled={!state}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
          {tariffLoading ? <Skeleton className="h-16 w-full" /> : city && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{distributor}</p>
                <p className="font-mono text-sm text-foreground">R$ {tariff.toFixed(2)}/kWh <span className="text-[10px] text-muted-foreground ml-1">{tariffRef}</span></p>
              </div>
              <RefreshCw size={14} className="text-muted-foreground cursor-pointer hover:text-primary" onClick={() => { setTariffLoading(true); supabase.functions.invoke('energy-tariff', { body: { city, state } }).then(({ data }) => { if (data?.tarifa) { setTariff(data.tarifa); setDistributor(data.distribuidora || ""); setTariffRef(data.referencia || ""); } setTariffLoading(false); }).catch(() => setTariffLoading(false)); }} />
            </div>
          )}
          <div><Label className="text-foreground">Tarifa (R$/kWh)</Label><Input type="number" step={0.01} value={tariff} onChange={e => setTariff(+e.target.value)} className="bg-muted border-border" /></div>
          {printer && (
            <div className="text-xs text-muted-foreground">
              Consumo: <span className="font-mono text-primary">{printer.power_consumption}W — {printer.name}</span>
              <br />Custo energia: <span className="font-mono text-primary">R$ {energyCost.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION D */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Wrench size={16} className="text-accent" />Mão de Obra</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              className={`flex-1 py-2 text-xs font-medium transition-colors ${laborMode === "auto" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              onClick={() => setLaborMode("auto")}
            >
              Calcular automaticamente
            </button>
            <button
              className={`flex-1 py-2 text-xs font-medium transition-colors ${laborMode === "manual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              onClick={() => setLaborMode("manual")}
            >
              Informar meu valor/hora
            </button>
          </div>

          {laborMode === "manual" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-foreground">Valor/hora (R$)</Label><Input type="number" value={laborRate || ''} onChange={e => setLaborRate(+e.target.value)} className="bg-muted border-border" /></div>
                <div><Label className="text-foreground">Horas de trabalho manual</Label><Input type="number" step={0.5} value={laborHours || ''} onChange={e => setLaborHours(+e.target.value)} className="bg-muted border-border" /></div>
              </div>
              <div className="text-xs text-muted-foreground">Custo de Mão de Obra: <span className="font-mono text-primary">R$ {laborCost.toFixed(2)}</span></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Utilizamos <span className="font-mono text-foreground">{laborAutoPct}%</span> sobre o custo total de produção como referência de mercado</p>
              </div>
              <div>
                <Label className="text-foreground">Percentual de mão de obra (%)</Label>
                <Input type="number" value={laborAutoPct || ''} onChange={e => setLaborAutoPct(+e.target.value)} className="bg-muted border-border" />
              </div>
              <div className="text-xs text-muted-foreground">
                Custo de Mão de Obra estimado: <span className="font-mono text-primary font-bold">R$ {laborCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground/60 italic">Baseado na média de R$ 45/hora para trabalho técnico de impressão 3D no Brasil</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION E */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2">🔧 Manutenção e Depreciação</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Manutenção ({printTimeH.toFixed(1)}h)</span><span className="font-mono text-primary">R$ {maintenanceCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Depreciação ({printTimeH.toFixed(1)}h)</span><span className="font-mono text-primary">R$ {depreciationCost.toFixed(2)}</span></div>
        </CardContent>
      </Card>

      {/* SECTION F */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Package size={16} className="text-muted-foreground" />Embalagem</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={pkgType} onValueChange={v => { setPkgType(v); if (v === 'none') setPkgCost(0); }}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{PACKAGING_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          {pkgType !== 'none' && <div><Label className="text-foreground">Custo (R$)</Label><Input type="number" value={pkgCost || ''} onChange={e => setPkgCost(+e.target.value)} className="bg-muted border-border" /></div>}
        </CardContent>
      </Card>

      {/* SECTION G — Resultado e Precificação Inteligente */}
      <Card className="border-border bg-card neon-glow">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><DollarSign size={16} className="text-primary" />Resultado e Precificação Inteligente</CardTitle></CardHeader>
        <CardContent className="space-y-6">

          {/* BLOCK 1 — AI Margin Suggestion */}
          {marginLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : marginSuggestion && (
            <div className="p-4 rounded-lg bg-muted/50 border border-primary/30 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Sugestão da IA</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {CATEGORY_EMOJI[marginSuggestion.categoria] || "📦"} {marginSuggestion.categoria}
                </Badge>
                {marginSuggestion.fallback && (
                  <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Padrão</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Mercado pratica entre <span className="font-mono text-foreground">{marginSuggestion.margem_minima}%</span> e <span className="font-mono text-foreground">{marginSuggestion.margem_maxima}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-primary">
                Sugerimos {marginSuggestion.margem_sugerida}%
              </div>
              <p className="text-xs text-muted-foreground italic">{marginSuggestion.justificativa}</p>
              <Button size="sm" variant="outline" className="border-primary/30 text-primary text-xs" onClick={() => setMargin(marginSuggestion.margem_sugerida)}>
                Aplicar sugestão
              </Button>
            </div>
          )}

          {/* BLOCK 2 — Margin & Tax Controls */}
          <div>
            <div className="flex justify-between mb-2"><Label className="text-foreground">Margem de lucro</Label><span className="font-mono text-primary text-sm">{margin}%</span></div>
            <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={300} step={1} className="[&>span:first-child]:bg-muted [&_[role=slider]]:bg-primary" />
          </div>
          <div>
            <Label className="text-foreground">Impostos/Taxas (%)<Tip text="Inclua MEI, Simples Nacional ou outras taxas aplicáveis" /></Label>
            <Input type="number" value={taxRate || ''} onChange={e => setTaxRate(+e.target.value)} className="bg-muted border-border" />
          </div>

          {/* BLOCK 3 — Result Panel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-[10px] text-muted-foreground mb-1">💸 Custo Total</p>
              <p className="text-lg font-bold font-mono text-foreground">R$ {totalCost.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-[10px] text-muted-foreground mb-1">🏷️ Preço Mínimo</p>
              <p className="text-lg font-bold font-mono text-foreground">R$ {minimumPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center col-span-2">
              <p className="text-[10px] text-muted-foreground mb-1">✅ Preço Sugerido de Venda</p>
              <p className="text-3xl font-bold font-mono text-primary neon-text">R$ {suggestedPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center col-span-2">
              <p className="text-[10px] text-muted-foreground mb-1">💰 Lucro Líquido por Peça</p>
              <p className="text-lg font-bold font-mono text-primary">R$ {profit.toFixed(2)} <span className="text-xs text-muted-foreground">({margin}%)</span></p>
            </div>
          </div>

          {/* BLOCK 4 — Breakdown Chart */}
          {pieData.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Breakdown de Custos</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie data={pieData}>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </RePie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-foreground">R$ {d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BLOCK 5 — Scenario Simulator */}
          {marginSuggestion && totalCost > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Simulador de Cenários</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium"></th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Conservador</th>
                      <th className="text-center py-2 text-primary font-medium">Sugerido</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Agressivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">Margem</td>
                      <td className="py-2 text-center font-mono text-foreground">{marginSuggestion.margem_minima}%</td>
                      <td className="py-2 text-center font-mono text-primary font-bold">{marginSuggestion.margem_sugerida}%</td>
                      <td className="py-2 text-center font-mono text-foreground">{marginSuggestion.margem_maxima}%</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">Preço de venda</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {calcPriceForMargin(marginSuggestion.margem_minima).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-primary font-bold">R$ {calcPriceForMargin(marginSuggestion.margem_sugerida).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {calcPriceForMargin(marginSuggestion.margem_maxima).toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">Lucro/peça</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {calcProfitForMargin(marginSuggestion.margem_minima).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-primary font-bold">R$ {calcProfitForMargin(marginSuggestion.margem_sugerida).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {calcProfitForMargin(marginSuggestion.margem_maxima).toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">Lucro 10 peças</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {(calcProfitForMargin(marginSuggestion.margem_minima) * 10).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-primary font-bold">R$ {(calcProfitForMargin(marginSuggestion.margem_sugerida) * 10).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {(calcProfitForMargin(marginSuggestion.margem_maxima) * 10).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">Lucro 50 peças</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {(calcProfitForMargin(marginSuggestion.margem_minima) * 50).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-primary font-bold">R$ {(calcProfitForMargin(marginSuggestion.margem_sugerida) * 50).toFixed(2)}</td>
                      <td className="py-2 text-center font-mono text-foreground">R$ {(calcProfitForMargin(marginSuggestion.margem_maxima) * 50).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs border-border flex-1" onClick={() => setMargin(marginSuggestion.margem_minima)}>
                  Aplicar {marginSuggestion.margem_minima}%
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary flex-1" onClick={() => setMargin(marginSuggestion.margem_sugerida)}>
                  Aplicar {marginSuggestion.margem_sugerida}%
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-border flex-1" onClick={() => setMargin(marginSuggestion.margem_maxima)}>
                  Aplicar {marginSuggestion.margem_maxima}%
                </Button>
              </div>
            </div>
          )}

          {/* BLOCK 6 — Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground neon-glow">
              Salvar Orçamento
            </Button>
            <Button variant="outline" className="border-border" onClick={handleExportPDF}>
              {!isPro && <Lock size={14} className="mr-1" />} Exportar PDF
            </Button>
            <Button variant="outline" className="border-border" onClick={handleExportCSV}>
              {!isPro && <Lock size={14} className="mr-1" />} Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmReset} onOpenChange={() => setConfirmReset(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Trocar impressora?</AlertDialogTitle>
            <AlertDialogDescription>Você tem dados preenchidos nos filamentos. Ao trocar de impressora, os filamentos serão resetados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPrinterChange} className="bg-primary text-primary-foreground">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

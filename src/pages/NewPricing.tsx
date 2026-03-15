import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Zap, Package, Wrench, DollarSign, PieChart, Plus, Trash2, Info, RefreshCw, Loader2,
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
import type { Printer, FilamentEntry, Quote } from "@/lib/types";
import { FILAMENT_TYPES, PACKAGING_TYPES } from "@/lib/types";
import { getPrinters, addQuote, getSettings } from "@/lib/store";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

const COLORS = ["hsl(173,80%,50%)", "hsl(200,100%,60%)", "hsl(160,100%,50%)", "hsl(280,80%,60%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)"];
const FILAMENT_COLORS = ["#00ccaa", "#3399ff", "#ff6633", "#cc33ff", "#ffcc00", "#00ff88", "#ff3366", "#6633ff"];

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

export default function NewPricing() {
  const settings = getSettings();
  const printers = getPrinters();

  // A - Print data
  const [pieceName, setPieceName] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // B - Filaments
  const [filaments, setFilaments] = useState<FilamentEntry[]>([createFilament(0)]);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  // C - Energy
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [tariff, setTariff] = useState(settings.defaultTariff);
  const [distributor, setDistributor] = useState("");
  const [tariffRef, setTariffRef] = useState("");
  const [tariffLoading, setTariffLoading] = useState(false);

  // D - Labor
  const [laborRate, setLaborRate] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  const [laborPct, setLaborPct] = useState(0);

  // F - Packaging
  const [pkgType, setPkgType] = useState("none");
  const [pkgCost, setPkgCost] = useState(0);

  // G - Margin
  const [margin, setMargin] = useState(settings.defaultMargin);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);

  const printer = useMemo(() => printers.find(p => p.id === printerId), [printerId, printers]);
  const printTimeH = hours + minutes / 60;

  // Fetch cities
  useEffect(() => {
    if (!state) { setCities([]); setCity(""); return; }
    setCitiesLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
      .then(r => r.json())
      .then((data: { id: number; nome: string }[]) => {
        setCities(data.sort((a, b) => a.nome.localeCompare(b.nome)));
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
    setCity("");
  }, [state]);

  // Fetch tariff when city changes
  useEffect(() => {
    if (!city || !state) return;
    setTariffLoading(true);
    // Simulate tariff lookup — in production this would call an AI API
    const timer = setTimeout(() => {
      // Use default tariff as fallback
      setTariff(settings.defaultTariff);
      setDistributor("Distribuidora local");
      setTariffRef("Março/2026");
      setTariffLoading(false);
      toast.info("Tarifa padrão aplicada. Ajuste manualmente se necessário.");
    }, 1000);
    return () => clearTimeout(timer);
  }, [city, state, settings.defaultTariff]);

  // Printer change handler
  const handlePrinterChange = (id: string) => {
    const hasData = filaments.some(f => f.weightUsed > 0 || f.brand || f.costPerKg > 0);
    if (hasData) {
      setConfirmReset(id);
    } else {
      setPrinterId(id);
      setFilaments([createFilament(0)]);
    }
  };

  const confirmPrinterChange = () => {
    if (confirmReset) {
      setPrinterId(confirmReset);
      setFilaments([createFilament(0)]);
      setConfirmReset(null);
    }
  };

  // Filament ops
  const updateFilament = (id: string, updates: Partial<FilamentEntry>) => {
    setFilaments(fs => fs.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      updated.computedCost = (updated.costPerKg / 1000) * updated.weightUsed;
      return updated;
    }));
  };

  const addFilament = () => {
    if (printer && filaments.length < printer.maxFilaments) {
      setFilaments(fs => [...fs, createFilament(fs.length)]);
    }
  };

  const removeFilament = (id: string) => {
    setFilaments(fs => fs.filter(f => f.id !== id));
  };

  // Calculations
  const totalWeight = filaments.reduce((s, f) => s + f.weightUsed, 0);
  const totalFilamentCost = filaments.reduce((s, f) => s + f.computedCost, 0);
  const energyCost = printer ? (printer.powerConsumption / 1000) * printTimeH * tariff : 0;
  const laborCost = laborRate * laborHours;
  const maintenanceCost = printer ? printer.maintenanceCostPerHour * printTimeH : 0;
  const depreciationCost = printer ? printer.depreciationPerHour * printTimeH : 0;

  const subtotal = totalFilamentCost + energyCost + laborCost + maintenanceCost + depreciationCost + pkgCost;
  const laborPctCost = subtotal * (laborPct / 100);
  const totalCost = subtotal + laborPctCost;
  const taxAmount = totalCost * (taxRate / 100);
  const minimumPrice = totalCost + taxAmount;
  const suggestedPrice = minimumPrice * (1 + margin / 100);

  const pieData = [
    { name: "Filamento", value: +totalFilamentCost.toFixed(2) },
    { name: "Energia", value: +energyCost.toFixed(2) },
    { name: "Mão de obra", value: +(laborCost + laborPctCost).toFixed(2) },
    { name: "Manutenção", value: +maintenanceCost.toFixed(2) },
    { name: "Depreciação", value: +depreciationCost.toFixed(2) },
    { name: "Embalagem", value: +pkgCost.toFixed(2) },
  ].filter(d => d.value > 0);

  const handleSave = () => {
    if (!pieceName.trim()) { toast.error("Nome da peça é obrigatório"); return; }
    if (!printer) { toast.error("Selecione uma impressora"); return; }
    const quote: Quote = {
      id: crypto.randomUUID(),
      pieceName, printerId, printerName: printer.name,
      printTimeHours: hours, printTimeMinutes: minutes,
      filaments, totalWeight, totalFilamentCost,
      state, city, distributor, tariff, energyCost,
      laborRate, laborHours, laborCost: laborCost + laborPctCost, laborPercentage: laborPct,
      maintenanceCost, depreciationCost,
      packagingType: pkgType, packagingCost: pkgCost,
      profitMargin: margin, taxRate,
      totalCost, suggestedPrice, minimumPrice,
      createdAt: new Date().toISOString(),
    };
    addQuote(quote);
    toast.success("Orçamento salvo com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Precificação</h1>
        <p className="text-muted-foreground text-sm mt-1">Calcule o preço ideal da sua peça 3D</p>
      </div>

      {/* SECTION A - Print Data */}
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
                <Badge variant="outline" className="text-[10px] border-neon-blue/30 text-neon-blue">Até {printer.maxFilaments} filamento{printer.maxFilaments > 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-[10px] border-neon-green/30 text-neon-green">{printer.powerConsumption}W</Badge>
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

      {/* SECTION B - Filaments */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">🎨 Filamentos</CardTitle>
            {printer && printer.maxFilaments > 1 && filaments.length < printer.maxFilaments && (
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

      {/* SECTION C - Energy */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Zap size={16} className="text-neon-green" />Energia<Tip text="Tarifa estimada com base na distribuidora da sua região. Verifique sua fatura para maior precisão." /></CardTitle></CardHeader>
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
          {tariffLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : city && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{distributor}</p>
                <p className="font-mono text-sm text-foreground">R$ {tariff.toFixed(2)}/kWh <span className="text-[10px] text-muted-foreground ml-1">{tariffRef}</span></p>
              </div>
              <RefreshCw size={14} className="text-muted-foreground cursor-pointer hover:text-primary" />
            </div>
          )}
          <div>
            <Label className="text-foreground">Tarifa (R$/kWh)</Label>
            <Input type="number" step={0.01} value={tariff} onChange={e => setTariff(+e.target.value)} className="bg-muted border-border" />
          </div>
          {printer && (
            <div className="text-xs text-muted-foreground">
              Consumo: <span className="font-mono text-neon-green">{printer.powerConsumption}W — {printer.name}</span>
              <br />Custo energia: <span className="font-mono text-primary">R$ {energyCost.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION D - Labor */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Wrench size={16} className="text-accent" />Mão de Obra</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground">Valor/hora (R$)</Label><Input type="number" value={laborRate || ''} onChange={e => setLaborRate(+e.target.value)} className="bg-muted border-border" /></div>
            <div><Label className="text-foreground">Horas manuais</Label><Input type="number" step={0.5} value={laborHours || ''} onChange={e => setLaborHours(+e.target.value)} className="bg-muted border-border" /></div>
          </div>
          <div><Label className="text-foreground">Adicional sobre custo total (%)<Tip text="Percentual adicional opcional sobre o custo total" /></Label><Input type="number" value={laborPct || ''} onChange={e => setLaborPct(+e.target.value)} className="bg-muted border-border" /></div>
          <div className="text-xs text-muted-foreground">Custo mão de obra: <span className="font-mono text-primary">R$ {(laborCost + laborPctCost).toFixed(2)}</span></div>
        </CardContent>
      </Card>

      {/* SECTION E - Maintenance */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2">🔧 Manutenção e Depreciação</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Manutenção ({printTimeH.toFixed(1)}h)</span><span className="font-mono text-primary">R$ {maintenanceCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Depreciação ({printTimeH.toFixed(1)}h)</span><span className="font-mono text-primary">R$ {depreciationCost.toFixed(2)}</span></div>
        </CardContent>
      </Card>

      {/* SECTION F - Packaging */}
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

      {/* SECTION G - Margin & Result */}
      <Card className="border-border bg-card neon-glow">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><DollarSign size={16} className="text-primary" />Margem e Resultado</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2"><Label className="text-foreground">Margem de lucro</Label><span className="font-mono text-primary text-sm">{margin}%</span></div>
            <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={200} step={1} className="[&>span:first-child]:bg-muted [&_[role=slider]]:bg-primary" />
          </div>
          <div><Label className="text-foreground">Impostos/Taxas (%)</Label><Input type="number" value={taxRate || ''} onChange={e => setTaxRate(+e.target.value)} className="bg-muted border-border" /></div>

          {/* Pie chart */}
          {pieData.length > 0 && (
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
          )}

          {/* Result */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custo total</span><span className="font-mono text-foreground">R$ {totalCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Impostos</span><span className="font-mono text-foreground">R$ {taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Preço mínimo</span><span className="font-mono text-foreground">R$ {minimumPrice.toFixed(2)}</span></div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-foreground font-medium">Preço sugerido</span>
              <span className="text-3xl font-bold font-mono text-primary neon-text">R$ {suggestedPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground neon-glow">Salvar Orçamento</Button>
            <Button variant="outline" className="border-border" onClick={() => toast.info("Exportação PDF em breve!")}>Exportar PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm printer change */}
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
    </div>
  );
}

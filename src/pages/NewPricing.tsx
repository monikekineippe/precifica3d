import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CHECKOUT_MENSAL, CHECKOUT_ANUAL } from "@/lib/checkout-links";
import { getTariffByState, getDistributorsByState } from "@/lib/energy-tariffs";
import { useNavigate } from "react-router-dom";
import {
  Zap, Package, Wrench, DollarSign, Plus, Trash2, Info, Loader2, Lock, Share2, Sparkles, CreditCard, QrCode, ShoppingBag, Search, AlertCircle, CheckCircle2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import type { FilamentEntry } from "@/lib/types";
import { FILAMENT_TYPES, PACKAGING_TYPES } from "@/lib/types";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  id: string; nome: string; cinematica: string; custo_aquisicao: number;
  vida_util_horas: number; consumo_watts: number; custo_manutencao_mensal: number;
  horas_uso_mensal: number; max_filamentos: number;
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
  const { user, isPro, isAnual } = useAuth();
  const { canCreateQuote, quotesThisMonth, refresh } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [settings, setSettings] = useState({ defaultTariff: 0.85, defaultMargin: 150, defaultTaxRate: 6 });
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [pixDiscount, setPixDiscount] = useState(0);
  const [cardFeePercent, setCardFeePercent] = useState(4.99);
  const [maxInstallments, setMaxInstallments] = useState(12);

  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Printers
    supabase.from("impressoras").select("*")
      .or(`user_id.eq.${user.id},is_precadastrada.eq.true`)
      .then(({ data }) => {
        if (data) setPrinters(data as any);
        // Load user settings and apply defaults after printers are loaded
        supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
          .then(({ data: settingsData }) => {
            if (settingsData) {
              setSettings({ defaultTariff: settingsData.default_tariff, defaultMargin: settingsData.default_margin, defaultTaxRate: settingsData.default_tax_rate });
              setMargin(settingsData.default_margin);
              setTaxRate(settingsData.default_tax_rate);
              // Apply saved defaults
              if (!defaultsApplied) {
                if (settingsData.default_printer_id && data?.some((p: any) => p.id === settingsData.default_printer_id)) {
                  setPrinterId(settingsData.default_printer_id);
                }
                if (settingsData.default_state) {
                  setState(settingsData.default_state);
                }
                if (settingsData.default_city) {
                  setDefaultCity(settingsData.default_city);
                }
                setDefaultsApplied(true);
              }
              // Load payment settings
              setPixDiscount(settingsData.pix_discount ?? 0);
              setCardFeePercent(settingsData.card_fee_percent ?? 4.99);
              setMaxInstallments(settingsData.max_installments ?? 12);
            }
          });
      });

    // Fetch Inventory
    const fetchInventory = async () => {
      setInventoryLoading(true);
      try {
        const { data, error } = await supabase.from("inventory")
          .select("*")
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        if (data) {
          console.log("Inventory data loaded:", data);
          setInventory(data);
        }
      } catch (err) {
        console.error("Error loading inventory:", err);
        toast.error("Erro ao carregar itens do estoque.");
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const [pieceName, setPieceName] = useState("");
  const [printerId, setPrinterId] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [filaments, setFilaments] = useState<FilamentEntry[]>([createFilament(0)]);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [pkgQty, setPkgQty] = useState(1);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [saveInventoryOpen, setSaveInventoryOpen] = useState(false);
  const [addToInventory, setAddToInventory] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    quantity: 1,
    variation: "",
    costPerUnit: 0
  });
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [defaultCity, setDefaultCity] = useState("");
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [tariff, setTariff] = useState(settings.defaultTariff);
  const [distributor, setDistributor] = useState("");
  const [tariffRef, setTariffRef] = useState("");
  
  const [laborMode, setLaborMode] = useState<"auto" | "manual">("auto");
  const [laborRate, setLaborRate] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  const [laborAutoPct, setLaborAutoPct] = useState(15);
  const [pkgType, setPkgType] = useState("none");
  const [pkgCost, setPkgCost] = useState(0);
  const [margin, setMargin] = useState(settings.defaultMargin);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);
  const [failureRate, setFailureRate] = useState(5);
  const [finishHours, setFinishHours] = useState(0);
  const [finishMinutes, setFinishMinutes] = useState(0);
  const [finishRate, setFinishRate] = useState<number | "">("");

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
      .then((data: { id: number; nome: string }[]) => {
        const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
        setCities(sorted);
        // If there's a pending default city, apply it
        if (defaultCity && sorted.some(c => c.nome === defaultCity)) {
          setCity(defaultCity);
          setDefaultCity("");
        } else if (!defaultCity) {
          setCity("");
        }
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [state]);

  // Apply tariff from static table when state changes
  useEffect(() => {
    if (!state) return;
    const info = getTariffByState(state);
    setTariff(info.tarifa);
    setDistributor(info.distribuidora);
    setTariffRef(info.referencia);
  }, [state]);

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

  const handlePrinterChange = async (id: string) => {
    const hasData = filaments.some(f => f.weightUsed > 0 || f.brand || f.costPerKg > 0);
    if (hasData) {
      setConfirmReset(id);
    } else {
      setPrinterId(id);
      setFilaments([createFilament(0)]);
      // Save as default
      if (user) {
        await supabase.from("user_settings").upsert({ 
          user_id: user.id, 
          default_printer_id: id 
        }, { onConflict: 'user_id' });
      }
    }
  };

  const confirmPrinterChange = async () => {
    if (confirmReset) {
      setPrinterId(confirmReset);
      setFilaments([createFilament(0)]);
      // Save as default
      if (user) {
        await supabase.from("user_settings").upsert({ 
          user_id: user.id, 
          default_printer_id: confirmReset 
        }, { onConflict: 'user_id' });
      }
      setConfirmReset(null);
    }
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
    if (printer && filaments.length < printer.max_filamentos) setFilaments(fs => [...fs, createFilament(fs.length)]);
  };

  const removeFilament = (id: string) => setFilaments(fs => fs.filter(f => f.id !== id));

  const totalWeight = filaments.reduce((s, f) => s + f.weightUsed, 0);
  const totalFilamentCost = filaments.reduce((s, f) => s + f.computedCost, 0);
  const totalAccessoriesCost = accessories.reduce((s, a) => s + (Number(a.unitCost || 0) * Number(a.quantity || 1)), 0);
  const totalPkgCost = pkgCost * pkgQty;
  const energyCost = printer ? (printer.consumo_watts / 1000) * printTimeH * tariff : 0;
  const manualLaborCost = laborRate * laborHours;
  const maintPerHour = printer && printer.horas_uso_mensal > 0 ? printer.custo_manutencao_mensal / printer.horas_uso_mensal : 0;
  const depPerHour = printer && printer.vida_util_horas > 0 ? printer.custo_aquisicao / printer.vida_util_horas : 0;
  const maintenanceCost = maintPerHour * printTimeH;
  const depreciationCost = depPerHour * printTimeH;

  const productionBase = totalFilamentCost + energyCost + maintenanceCost + depreciationCost + totalPkgCost + totalAccessoriesCost;
  const autoLaborCost = productionBase * (laborAutoPct / 100);
  const laborCost = laborMode === "manual" ? manualLaborCost : autoLaborCost;

  // Pós-processamento (independente da mão de obra principal)
  const finishTimeH = finishHours + finishMinutes / 60;
  const effectiveFinishRate = finishRate === "" ? (laborMode === "manual" ? laborRate : 45) : Number(finishRate);
  const postProcessCost = finishTimeH * effectiveFinishRate;

  // Custo de produção (antes da taxa de falha e da margem)
  const productionCost = totalFilamentCost + energyCost + laborCost + maintenanceCost + depreciationCost + totalPkgCost + totalAccessoriesCost + postProcessCost;

  // Taxa de falha: dilui desperdício nas peças boas
  const failureDivisor = Math.max(0.01, 1 - (failureRate || 0) / 100);
  const adjustedCost = productionCost / failureDivisor;
  const failureCost = adjustedCost - productionCost;

  const totalCost = adjustedCost;
  const taxAmount = totalCost * (taxRate / 100);
  const minimumPrice = totalCost + taxAmount;
  const suggestedPrice = minimumPrice * (1 + margin / 100);
  const profit = suggestedPrice - minimumPrice;
  const realMargin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0;

  const calcPriceForMargin = (m: number) => minimumPrice * (1 + m / 100);
  const calcProfitForMargin = (m: number) => calcPriceForMargin(m) - minimumPrice;

  const pieData = [
    { name: "Filamento", value: +totalFilamentCost.toFixed(2) },
    { name: "Energia", value: +energyCost.toFixed(2) },
    { name: "Mão de obra", value: +laborCost.toFixed(2) },
    { name: "Manutenção", value: +maintenanceCost.toFixed(2) },
    { name: "Depreciação", value: +depreciationCost.toFixed(2) },
    { name: "Embalagem", value: +totalPkgCost.toFixed(2) },
    { name: "Acessórios", value: +totalAccessoriesCost.toFixed(2) },
    { name: "Margem", value: +profit.toFixed(2) },
    { name: "Impostos", value: +taxAmount.toFixed(2) },
  ].filter(d => d.value > 0);

  const handleSave = async () => {
    if (!pieceName.trim()) { toast.error("Nome da peça é obrigatório"); return; }
    if (!printer) { toast.error("Selecione uma impressora"); return; }
    if (!user) return;
    if (!canCreateQuote) { setUpgradeOpen(true); return; }

    setInventoryForm({
      name: pieceName,
      quantity: 1,
      variation: "",
      costPerUnit: Number(totalCost.toFixed(2)) // Custo total da produção (filamento + energia + mão de obra + manutenção + depreciação + embalagem + acessórios)
    });
    setAddToInventory(false);
    setSaveInventoryOpen(true);
  };

  const confirmSave = async (withInventory: boolean) => {
    if (!user) return;
    setSaveInventoryOpen(false);

    const firstFilamentId = filaments[0]?.id?.includes('-') ? filaments[0].id : null;

    const quoteData = {
      user_id: user.id,
      nome_peca: pieceName, 
      impressora_id: printerId, 
      impressora_nome: printer?.nome,
      tempo_horas: hours, 
      tempo_minutos: minutes,
      filamentos: filaments as any,
      filamento_estoque_id: firstFilamentId,
      estado: state, 
      cidade: city, 
      distribuidora: distributor, 
      tarifa_energia: tariff, 
      custo_energia: energyCost,
      modo_mao_de_obra: laborMode,
      valor_hora_mao_de_obra: laborMode === "manual" ? laborRate : null,
      horas_mao_de_obra: laborMode === "manual" ? laborHours : null,
      custo_mao_de_obra: laborCost,
      percentual_mao_de_obra: laborMode === "auto" ? laborAutoPct : null,
      custo_manutencao: maintenanceCost, 
      custo_depreciacao: depreciationCost,
      tipo_embalagem: pkgType, 
      embalagem_estoque_id: (pkgType !== 'none' && pkgType !== 'manual' && pkgType.length > 20) ? pkgType : null,
      embalagem_custo: pkgCost,
      custo_embalagem: totalPkgCost,
      embalagem_quantidade: pkgQty,
      quantidade_embalagem: pkgQty,
      acessorios: accessories as any,
      custo_acessorios: totalAccessoriesCost,
      margem_lucro: margin, 
      percentual_impostos: taxRate,
      custo_total: totalCost, 
      preco_sugerido: suggestedPrice, 
      preco_minimo: minimumPrice,
      lucro_liquido: profit,
    };

    console.log("Saving quote to 'orcamentos' table:", quoteData);

    try {
      const { data, error } = await supabase.from("orcamentos").insert([quoteData as any]).select();
      
      if (error) {
        console.error("Error inserting quote:", error);
        toast.error(`Erro ao salvar orçamento: ${error.message}`);
        return;
      }

      console.log("Quote saved successfully:", data);

      // Track usage events (calculo + orcamento)
      try {
        await (supabase.from("eventos_uso") as any).insert([
          { user_id: user.id, tipo: "calculo" },
          { user_id: user.id, tipo: "orcamento" },
        ]);
      } catch (e) {
        console.warn("Could not log usage events", e);
      }


      if (withInventory) {
        const invData = {
          user_id: user.id,
          name: inventoryForm.name,
          type: "product",
          category: "finished_product",
          quantity: inventoryForm.quantity,
          unit: "unidade",
          cost_per_unit: inventoryForm.costPerUnit,
        };
        
        console.log("Adding to inventory:", invData);
        const { error: invError } = await supabase.from("inventory").insert([invData as any]);
        
        if (invError) {
          console.error("Error adding to inventory:", invError);
          toast.error("Orçamento salvo, mas houve erro ao adicionar ao estoque.");
        } else {
          toast.success("Orçamento salvo e peça adicionada ao estoque!");
        }
      } else {
        toast.success("Orçamento salvo com sucesso!");
      }

      refresh();
      navigate("/history");
    } catch (err) {
      console.error("Unexpected error saving quote:", err);
      toast.error("Ocorreu um erro inesperado ao salvar.");
    }
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
      ["Embalagem", totalPkgCost.toFixed(2)],
      ["Acessórios", totalAccessoriesCost.toFixed(2)],
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


  const daysUntilReset = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const isBlocked = !canCreateQuote;

  return (
    <div className="space-y-6 max-w-3xl relative">
      {isBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="text-primary" size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Você atingiu o limite do plano gratuito</h2>
            <p className="text-muted-foreground text-sm">
              Você já realizou 2 precificações este mês. Faça upgrade para o plano Pro e precifique sem limites.
            </p>
            <div className="space-y-3">
              <a href={CHECKOUT_MENSAL} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-primary text-primary-foreground font-semibold" size="lg">
                  Assinar Pro Mensal R$ 29,90/mês
                </Button>
              </a>
              <a href={CHECKOUT_ANUAL} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" size="lg">
                  Assinar Pro Anual R$ 239,90/ano
                </Button>
              </a>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate("/")}>
                Voltar ao Dashboard
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Limite reinicia em <span className="font-semibold text-foreground">{daysUntilReset} dias</span>
            </p>
          </div>
        </div>
      )}

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
               <SelectContent>{printers.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
            {printer && (
              <div className="flex gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{printer.cinematica}</Badge>
                <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Até {printer.max_filamentos} filamento{printer.max_filamentos > 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{printer.consumo_watts}W</Badge>
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
            {printer && printer.max_filamentos > 1 && filaments.length < printer.max_filamentos && (
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

              {/* Inventory Search */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Selecionar do estoque</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background border-border h-9 text-xs font-normal"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Search size={14} className="text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {(f as any).inventoryId 
                            ? inventory.find(item => item.id === (f as any).inventoryId)?.name || "Buscar no estoque..."
                            : "Buscar no estoque..."}
                        </span>
                      </div>
                      <Plus size={14} className="ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Filtrar filamentos..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum filamento encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="manual"
                            onSelect={() => {
                              updateFilament(f.id, { 
                                brand: '', 
                                costPerKg: 0,
                                ...({ inventoryId: null, fromStock: false } as any)
                              });
                            }}
                            className="text-xs"
                          >
                            <Plus size={14} className="mr-2" /> Preencher manualmente
                          </CommandItem>
                          {inventoryLoading ? (
                            <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Carregando estoque...
                            </div>
                          ) : inventory.filter(item => item.type === 'filament' || item.type === 'Filamento').length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">Nenhum filamento encontrado no estoque. Cadastre em Estoque primeiro.</div>
                          ) : inventory.filter(item => item.type === 'filament' || item.type === 'Filamento').map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={() => {
                                const matchedType = FILAMENT_TYPES.find(t => item.name.toUpperCase().includes(t.toUpperCase())) || f.type;
                                updateFilament(f.id, {
                                  type: matchedType,
                                  brand: item.brand || '',
                                  costPerKg: Number(item.cost_per_unit || 0),
                                  ...({ inventoryId: item.id, fromStock: true } as any)
                                });
                              }}
                              className="text-xs flex flex-col items-start"
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">R$ {Number(item.cost_per_unit || 0).toFixed(2)}/kg</span>
                                <Badge variant="outline" className={cn(
                                  "text-[9px] px-1 py-0 h-3.5",
                                  item.quantity <= 0 ? "border-destructive text-destructive" : "border-primary/30 text-primary"
                                )}>
                                  Qtd: {item.quantity}{item.unit === 'kg' ? 'kg' : 'g'}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Stock Warning */}
                {(f as any).inventoryId && (
                  <div className="flex flex-col gap-1 mt-1">
                    {inventory.find(item => item.id === (f as any).inventoryId)?.quantity <= 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-alert font-medium bg-alert/10 p-1.5 rounded border border-alert/20">
                        <AlertCircle size={12} />
                        Estoque zerado para este filamento
                      </div>
                    )}
                    {(f as any).fromStock && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium bg-primary/10 p-1.5 rounded border border-primary/20">
                        <CheckCircle2 size={12} />
                        Custo real do estoque aplicado
                      </div>
                    )}
                  </div>
                )}
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
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-foreground">Custo/kg (R$)</Label>
                  </div>
                  <Input type="number" value={f.costPerKg || ''} onChange={e => updateFilament(f.id, { costPerKg: +e.target.value, ...({ fromStock: false } as any) })} className="bg-background border-border text-xs h-8" />
                </div>
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
          <div>
            <Label className="text-foreground">Estado</Label>
            <Select value={state} onValueChange={async (v) => { 
              setState(v); 
              if (user) {
                await supabase.from("user_settings").upsert({ 
                  user_id: user.id, 
                  default_state: v 
                }, { onConflict: 'user_id' });
              }
            }}>
              <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>{BRAZILIAN_STATES.map(s => <SelectItem key={s.uf} value={s.uf}>{s.uf} {s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {state && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">{distributor}</p>
              <p className="font-mono text-sm text-foreground">R$ {tariff.toFixed(2)}/kWh <span className="text-[10px] text-muted-foreground ml-1">{tariffRef}</span></p>
              {getDistributorsByState(state).length > 1 && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Distribuidora</Label>
                  <Select value={distributor} onValueChange={v => {
                    const info = getDistributorsByState(state).find(d => d.distribuidora === v);
                    if (info) { setTariff(info.tarifa); setDistributor(info.distribuidora); setTariffRef(info.referencia); }
                  }}>
                    <SelectTrigger className="bg-background border-border text-xs h-8 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{getDistributorsByState(state).map(d => <SelectItem key={d.distribuidora} value={d.distribuidora}>{d.distribuidora} R$ {d.tarifa.toFixed(2)}/kWh</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <div><Label className="text-foreground">Tarifa (R$/kWh)</Label><Input type="number" step={0.01} value={tariff} onChange={e => setTariff(+e.target.value)} className="bg-muted border-border" /></div>
          {printer && (
            <div className="text-xs text-muted-foreground">
              Consumo: <span className="font-mono text-primary">{printer.consumo_watts}W {printer.nome}</span>
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

      {/* SECTION F: Embalagem */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><Package size={16} className="text-muted-foreground" />Embalagem</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Selecionar embalagem do estoque</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between bg-background border-border h-9 text-xs font-normal">
                  <div className="flex items-center gap-2 truncate">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {pkgType !== 'none' && pkgType !== 'manual' 
                        ? inventory.find(item => item.id === pkgType)?.name || "Buscar embalagem..."
                        : pkgType === 'manual' ? "Preenchimento manual" : "Sem embalagem"}
                    </span>
                  </div>
                  <Plus size={14} className="ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filtrar embalagens..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>Nenhuma embalagem encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="none" onSelect={() => { setPkgType('none'); setPkgCost(0); }} className="text-xs">
                        <Trash2 size={14} className="mr-2" /> Sem embalagem
                      </CommandItem>
                      <CommandItem value="manual" onSelect={() => { setPkgType('manual'); setPkgCost(0); }} className="text-xs">
                        <Plus size={14} className="mr-2" /> Preencher manualmente
                      </CommandItem>
                      {inventoryLoading ? (
                        <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> Carregando...
                        </div>
                      ) : inventory.filter(item => item.type === 'package' || item.type === 'Embalagem').length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground">Nenhuma embalagem encontrada.</div>
                      ) : inventory.filter(item => item.type === 'package' || item.type === 'Embalagem').map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => {
                            setPkgType(item.id);
                            setPkgCost(Number(item.cost_per_unit || 0));
                          }}
                          className="text-xs flex flex-col items-start"
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">R$ {Number(item.cost_per_unit || 0).toFixed(2)}/un</div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {pkgType !== 'none' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-foreground">Custo Unitário (R$)</Label>
                <Input type="number" value={pkgCost || ''} onChange={e => setPkgCost(+e.target.value)} className="bg-background border-border text-xs h-8" />
              </div>
              <div>
                <Label className="text-xs text-foreground">Quantidade</Label>
                <Input type="number" min={1} value={pkgQty || ''} onChange={e => setPkgQty(+e.target.value)} className="bg-background border-border text-xs h-8" />
              </div>
              <div className="col-span-2 text-xs text-right text-muted-foreground">
                Total Embalagem: <span className="font-mono text-primary font-bold">R$ {totalPkgCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION G: Acessórios */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-accent" />Acessórios</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAccessories([...accessories, { id: crypto.randomUUID(), name: '', unitCost: 0, quantity: 1, isManual: true }])} className="border-accent/30 text-accent text-xs">
              <Plus size={14} className="mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessories.map((acc, idx) => (
            <div key={acc.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-3 relative">
              <button 
                onClick={() => setAccessories(accessories.filter(a => a.id !== acc.id))} 
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
              
              <div className="space-y-1.5 pr-6">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Item do estoque</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-background border-border h-9 text-xs font-normal">
                      <div className="flex items-center gap-2 truncate">
                        <Search size={14} className="text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {acc.inventoryId 
                            ? inventory.find(i => i.id === acc.inventoryId)?.name || acc.name || "Buscar..."
                            : acc.name || "Buscar no estoque..."}
                        </span>
                      </div>
                      <Plus size={14} className="ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Filtrar acessórios..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="manual" onSelect={() => {
                            const newAccs = [...accessories];
                            newAccs[idx] = { ...newAccs[idx], inventoryId: null, isManual: true, name: '' };
                            setAccessories(newAccs);
                          }} className="text-xs">
                            <Plus size={14} className="mr-2" /> Preencher manualmente
                          </CommandItem>
                          {inventoryLoading ? (
                            <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Carregando...
                            </div>
                          ) : inventory.filter(item => item.type === 'accessory' || item.type === 'Acessório').length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">Nenhum item encontrado.</div>
                          ) : inventory.filter(item => item.type === 'accessory' || item.type === 'Acessório').map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={() => {
                                const newAccs = [...accessories];
                                newAccs[idx] = { 
                                  ...newAccs[idx], 
                                  inventoryId: item.id, 
                                  name: item.name, 
                                  unitCost: Number(item.cost_per_unit || 0), 
                                  isManual: false 
                                };
                                setAccessories(newAccs);
                              }}
                              className="text-xs flex flex-col items-start"
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-[10px] text-muted-foreground">R$ {Number(item.cost_per_unit || 0).toFixed(2)}/un</div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-foreground">Descrição</Label>
                  <Input 
                    value={acc.name} 
                    onChange={e => {
                      const newAccs = [...accessories];
                      newAccs[idx].name = e.target.value;
                      setAccessories(newAccs);
                    }} 
                    className="bg-background border-border text-xs h-8" 
                    placeholder="Ex: Ímã de neodímio"
                  />
                </div>
                <div>
                  <Label className="text-xs text-foreground">Custo Unit. (R$)</Label>
                  <Input 
                    type="number" 
                    value={acc.unitCost || ''} 
                    onChange={e => {
                      const newAccs = [...accessories];
                      newAccs[idx].unitCost = +e.target.value;
                      setAccessories(newAccs);
                    }} 
                    className="bg-background border-border text-xs h-8" 
                  />
                </div>
                <div>
                  <Label className="text-xs text-foreground">Quantidade</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={acc.quantity || ''} 
                    onChange={e => {
                      const newAccs = [...accessories];
                      newAccs[idx].quantity = +e.target.value;
                      setAccessories(newAccs);
                    }} 
                    className="bg-background border-border text-xs h-8" 
                  />
                </div>
                <div className="col-span-2 text-xs text-right text-muted-foreground">
                  Subtotal: <span className="font-mono text-accent font-bold">R$ {(Number(acc.unitCost || 0) * Number(acc.quantity || 1)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between text-xs border-t border-border pt-3">
            <span className="text-muted-foreground font-medium">Total acessórios</span>
            <span className="font-mono text-accent font-bold text-sm">R$ {totalAccessoriesCost.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION G Resultado e Precificação Inteligente */}
      <Card className="border-border bg-card neon-glow">
        <CardHeader><CardTitle className="text-sm text-foreground flex items-center gap-2"><DollarSign size={16} className="text-primary" />Resultado e Precificação Inteligente</CardTitle></CardHeader>
        <CardContent className="space-y-6">

          {/* BLOCK 1 AI Margin Suggestion */}
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

          {/* BLOCK 2 Margin & Tax Controls */}
          <div>
            <div className="flex justify-between mb-2"><Label className="text-foreground">Margem de lucro</Label><span className="font-mono text-primary text-sm">{margin}%</span></div>
            <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={300} step={1} className="[&>span:first-child]:bg-muted [&_[role=slider]]:bg-primary" />
          </div>
          <div>
            <Label className="text-foreground">Impostos/Taxas (%)<Tip text="Inclua MEI, Simples Nacional ou outras taxas aplicáveis" /></Label>
            <Input type="number" value={taxRate || ''} onChange={e => setTaxRate(+e.target.value)} className="bg-muted border-border" />
          </div>

          {/* BLOCK 3 Result Panel */}
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

          {/* BLOCK 3.5 Payment Methods */}
          {suggestedPrice > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground flex items-center gap-2">
                <CreditCard size={14} className="text-primary" /> Meios de Pagamento
              </p>
              
              {/* PIX */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">PIX</span>
                    {pixDiscount > 0 && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">-{pixDiscount}%</Badge>
                    )}
                  </div>
                  <span className="text-lg font-bold font-mono text-primary">
                    R$ {(suggestedPrice * (1 - pixDiscount / 100)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Credit Card */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">Cartão de Crédito</span>
                    <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">+{cardFeePercent}%</Badge>
                  </div>
                  <span className="text-lg font-bold font-mono text-foreground">
                    R$ {(suggestedPrice * (1 + cardFeePercent / 100)).toFixed(2)}
                  </span>
                </div>
                
                {/* Installments */}
                {maxInstallments > 1 && (
                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Parcelamento</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => {
                        const cardTotal = suggestedPrice * (1 + cardFeePercent / 100);
                        const installmentValue = cardTotal / n;
                        return (
                          <div key={n} className="flex justify-between text-xs px-2 py-1 rounded bg-background/50">
                            <span className="text-muted-foreground">{n}x</span>
                            <span className="font-mono text-foreground">R$ {installmentValue.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {!isAnual && (
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Lock size={10} /> Configure taxas e parcelas nas Configurações (plano Anual)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* BLOCK 4 Breakdown Chart */}
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

          {/* BLOCK 5 Scenario Simulator */}
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

          {/* BLOCK 6 Actions */}
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
            <Button 
              variant="outline" 
              className="border-border text-[#00D4FF] hover:bg-[#00D4FF]/10" 
              onClick={() => navigate("/marketplace", { state: { cost: totalCost } })}
            >
              <ShoppingBag size={14} className="mr-1" /> Ver preços para marketplace
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

      <Dialog open={saveInventoryOpen} onOpenChange={setSaveInventoryOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Deseja registrar esta peça no estoque de produtos prontos?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-to-inventory" className="cursor-pointer">Adicionar ao estoque</Label>
              <Switch 
                id="add-to-inventory" 
                checked={addToInventory} 
                onCheckedChange={(checked) => {
                  setAddToInventory(checked);
                  if (checked) {
                    setInventoryForm({
                      ...inventoryForm,
                      costPerUnit: Number(totalCost.toFixed(2)) // Custo total da produção, igual ao custo_total salvo no histórico
                    });
                  }
                }} 
              />
            </div>

            {addToInventory && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Nome da peça</Label>
                  <Input 
                    value={inventoryForm.name} 
                    onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })} 
                    className="bg-muted border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade produzida</Label>
                    <Input 
                      type="number" 
                      min={1}
                      value={inventoryForm.quantity} 
                      onChange={e => {
                        const qty = Number(e.target.value);
                        setInventoryForm({ 
                          ...inventoryForm, 
                          quantity: qty,
                          costPerUnit: Number(totalCost.toFixed(2)) // Custo total da produção (não divide por quantidade)
                        });
                      }} 
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo unitário (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={inventoryForm.costPerUnit} 
                      onChange={e => setInventoryForm({ ...inventoryForm, costPerUnit: Number(e.target.value) })} 
                      className="bg-muted border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor/Variação (opcional)</Label>
                  <Input 
                    placeholder="Ex: Vermelho, Grande, etc."
                    value={inventoryForm.variation} 
                    onChange={e => setInventoryForm({ ...inventoryForm, variation: e.target.value })} 
                    className="bg-muted border-border"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => confirmSave(false)} className="flex-1">
              Salvar sem estoque
            </Button>
            <Button onClick={() => confirmSave(addToInventory)} className="flex-1 bg-primary text-primary-foreground">
              {addToInventory ? "Salvar e adicionar ao estoque" : "Salvar Orçamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

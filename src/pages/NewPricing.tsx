import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// Antes de realizar qualquer ação, entenda o contexto e instrução recente do usuário, comando mais recente enviado por ele: Quero adicionar 5 melhorias na calculadora de precificação (tela /new). Não altere os cálculos que já funcionam (filamento, energia, mão de obra, manutenção, depreciação, pós-processamento, embalagem, acessórios, impostos, margem). Apenas some os itens abaixo e garanta que todos entrem no Custo Total, no Preço Mínimo, no Preço Sugerido, no Lucro Líquido e nos preços de marketplace. 1. RETRABALHO / TAXA DE FALHA (%) Se ainda não existir, adicione um campo "Retrabalho / Taxa de falha (%)", padrão 5%. Ele infla o custo de produção pela fórmula: custo_ajustado = custo_de_producao / (1 - taxa/100). A ideia: peças que falham consomem material, energia e desgaste, e esse desperdício é diluído nas peças boas. Mostre o valor de "custo de falha" embutido. 2. URGÊNCIA (%) Adicione um campo "Urgência (%)", padrão 0. Quando preenchido, aplica um acréscimo percentual sobre o preço final de venda (pedido com prazo apertado custa mais). Deixe claro no resultado quanto do preço veio da urgência. 3. AQUISIÇÃO DE MODELO (R$) Adicione um campo "Aquisição de modelo (R$)", padrão 0, para quando eu compro o arquivo/STL em vez de modelar. Esse valor entra no custo de produção. Se a mesma compra rende várias peças, dividir pelo número de peças (usar a quantidade do orçamento). 4. TAXA DE CARTÃO (%) Adicione um campo "Taxa de cartão (%)", padrão 0. Assim como já acontece com impostos e comissão de marketplace, essa taxa deve ser considerada no cálculo para que o Preço Sugerido preserve a margem líquida depois de descontada. Ou seja: o preço sobe o suficiente para que, após a taxa de cartão, sobre a margem que defini. 5. PESO COM SUPORTE E PURGA No campo de peso do filamento, deixe uma dica curta: "use o peso que o fatiador mostra, já com suporte e purga". Adicione também um campo opcional "Desperdício de suporte/purga (%)", padrão 0, que aumenta o peso considerado do filamento por esse percentual (para quem informa só o peso da peça limpa). Regras: - Use dados reais, sem mock. - Mantenha layout, identidade visual e os cálculos existentes. - NÃO use travessão (—). Use vírgula, ponto ou dois-pontos. - Português do Brasil.

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
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
import PricingResultPanel from "@/components/PricingResultPanel";


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

const HIGH_TEMP_FACTOR = 1.35;
const HIGH_TEMP_MATERIALS = new Set(['ABS', 'ASA', 'PC', 'Nylon', 'HIPS', 'Carbon Fiber']);

interface PrinterRow {
  id: string; nome: string; cinematica: string; custo_aquisicao: number;
  vida_util_horas: number; consumo_watts: number; custo_manutencao_mensal: number;
  horas_uso_mensal: number; max_filamentos: number; is_active?: boolean;
  consumo_medio_watts?: number | null;
  potencia_nominal_watts?: number | null;
  origem_consumo?: string | null;
  origem_custo?: string | null;
  preco_referencia_data?: string | null;
  catalogo_id?: string | null;
  is_precadastrada?: boolean;
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
  const { user, profile, isPro, isAnual } = useAuth();
  const { canCreateQuote, quotesThisMonth, refresh } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [catalogPrinters, setCatalogPrinters] = useState<PrinterRow[]>([]);
  const [catalogSelection, setCatalogSelection] = useState<string>("");
  const [activating, setActivating] = useState(false);
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
          if (data) {
            // Filter printers to only include user's active printers
            // Plus any preset that might be set as primary (though ideally primary should be a copy)
            const filtered = data.filter((p: any) => 
              (p.user_id === user.id && p.is_active) || 
              (p.is_precadastrada && profile?.primary_printer_id === p.id)
            );
            setPrinters(filtered as any);
            setCatalogPrinters(data.filter((p: any) => p.is_precadastrada === true) as any);
          }
        // Load user settings and apply defaults after printers are loaded
        supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
          .then(({ data: settingsData }) => {
            if (settingsData) {
              setSettings({ defaultTariff: settingsData.default_tariff, defaultMargin: settingsData.default_margin, defaultTaxRate: settingsData.default_tax_rate });
              setMargin(settingsData.default_margin);
              setTaxRate(settingsData.default_tax_rate);
              // Apply saved defaults
              if (!defaultsApplied) {
                if (profile?.primary_printer_id && data?.some((p: any) => p.id === profile.primary_printer_id)) {
                  setPrinterId(profile.primary_printer_id);
                } else if (settingsData.default_printer_id && data?.some((p: any) => p.id === settingsData.default_printer_id)) {
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
  const [laborMinutes, setLaborMinutes] = useState(0);
  const [laborAutoPct, setLaborAutoPct] = useState(15);
  const [pkgType, setPkgType] = useState("none");
  const [pkgCost, setPkgCost] = useState(0);
  const [margin, setMargin] = useState(settings.defaultMargin);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);
  const [failureRate, setFailureRate] = useState(5);
  // Modo de precificação: margem (padrão) ou preço reverso
  const [priceMode, setPriceMode] = useState<"margem" | "preco">("margem");
  const [manualPrice, setManualPrice] = useState("");
  const [marketplaceFee, setMarketplaceFee] = useState("");
  const [applyCardFee, setApplyCardFee] = useState(false);
  const [finishHours, setFinishHours] = useState(0);
  const [finishMinutes, setFinishMinutes] = useState(0);
  const [finishRate, setFinishRate] = useState<number | "">("");

  // AI margin suggestion
  const [marginSuggestion, setMarginSuggestion] = useState<MarginSuggestion | null>(null);
  const [marginLoading, setMarginLoading] = useState(false);
  const marginFetchRef = useRef<string>("");

  const activePrinters = useMemo(() => printers, [printers]);

  const catalogByBrand = useMemo(() => {
    const groups: Record<string, PrinterRow[]> = {};
    catalogPrinters.forEach(p => {
      const marca = (p.nome || "").trim().split(" ")[0] || "Outros";
      (groups[marca] ||= []).push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map(marca => ({
        marca,
        modelos: groups[marca].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      }));
  }, [catalogPrinters]);

  const handleActivateCatalogPrinter = async () => {
    if (!user || !catalogSelection || activating) return;
    const model = catalogPrinters.find(p => p.id === catalogSelection);
    if (!model) return;
    setActivating(true);
    try {
      const { data, error } = await supabase.from("impressoras").insert({
        user_id: user.id,
        nome: model.nome,
        cinematica: model.cinematica,
        custo_aquisicao: model.custo_aquisicao,
        vida_util_horas: model.vida_util_horas,
        consumo_watts: model.consumo_watts,
        consumo_medio_watts: model.consumo_medio_watts ?? null,
        potencia_nominal_watts: model.potencia_nominal_watts ?? null,
        origem_consumo: model.origem_consumo ?? null,
        custo_manutencao_mensal: model.custo_manutencao_mensal,
        horas_uso_mensal: model.horas_uso_mensal,
        max_filamentos: model.max_filamentos,
        is_precadastrada: false,
        is_active: true,
        catalogo_id: model.id,
        origem_custo: 'media_mercado',
      } as any).select().single();

      if (error || !data) {
        console.error("ativar impressora", error);
        toast.error("Erro ao ativar: " + (error?.message || "sem detalhes"));
        return;
      }

      setPrinters(prev => [...prev, data as any]);
      setPrinterId((data as any).id);
      toast.success("Impressora ativada! O custo veio da média de mercado: se você sabe quanto pagou, ajuste na tela Impressoras.");
    } finally {
      setActivating(false);
    }
  };

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
  const effectiveWatts = printer ? (printer.consumo_medio_watts ?? printer.consumo_watts) : 0;
  const highTempFactor = filaments.some(f => HIGH_TEMP_MATERIALS.has(f.type)) ? HIGH_TEMP_FACTOR : 1;
  const energyCost = printer ? (effectiveWatts / 1000) * highTempFactor * printTimeH * tariff : 0;
  const manualLaborCost = laborRate * (laborHours + laborMinutes / 60);
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

  // Modo preço reverso: parte do preço informado e desconta impostos, comissão e cartão
  const manualPriceValue = Number(String(manualPrice).replace(",", ".")) || 0;
  const marketplaceFeeValue = Number(String(marketplaceFee).replace(",", ".")) || 0;
  const reverseTaxAmount = manualPriceValue * (taxRate / 100);
  const reverseMarketplaceAmount = manualPriceValue * (marketplaceFeeValue / 100);
  const reverseCardAmount = applyCardFee ? manualPriceValue * (cardFeePercent / 100) : 0;
  const reverseDeductions = [
    { label: `Impostos (${taxRate}%)`, value: reverseTaxAmount },
    { label: `Comissão de marketplace (${marketplaceFeeValue}%)`, value: reverseMarketplaceAmount },
    { label: `Taxa de cartão (${cardFeePercent}%)`, value: reverseCardAmount },
  ].filter(d => d.value > 0);
  const reverseProfit = manualPriceValue - totalCost - reverseTaxAmount - reverseMarketplaceAmount - reverseCardAmount;
  const reverseMargin = manualPriceValue > 0 ? (reverseProfit / manualPriceValue) * 100 : 0;
  const minMarkup = marginSuggestion?.margem_minima ?? settings.defaultMargin;
  // Converte markup sobre custo em margem sobre o preço, pra comparar com a margem real
  const minMarginPct = minMarkup > 0 ? (minMarkup / (100 + minMarkup)) * 100 : 0;

  const calcPriceForMargin = (m: number) => minimumPrice * (1 + m / 100);
  const calcProfitForMargin = (m: number) => calcPriceForMargin(m) - minimumPrice;

  const pieData = [
    { name: "Filamento", value: +totalFilamentCost.toFixed(2) },
    { name: "Energia", value: +energyCost.toFixed(2) },
    { name: "Mão de obra", value: +laborCost.toFixed(2) },
    { name: "Pós-processamento", value: +postProcessCost.toFixed(2) },
    { name: "Manutenção", value: +maintenanceCost.toFixed(2) },
    { name: "Depreciação", value: +depreciationCost.toFixed(2) },
    { name: "Embalagem", value: +totalPkgCost.toFixed(2) },
    { name: "Acessórios", value: +totalAccessoriesCost.toFixed(2) },
    { name: "Custo de falha", value: +failureCost.toFixed(2) },
    { name: "Margem", value: +profit.toFixed(2) },
    { name: "Impostos", value: +taxAmount.toFixed(2) },
  ].filter(d => d.value > 0);

  const FREE_MONTHLY_QUOTE_LIMIT = 10;

  const handleSave = async () => {
    if (!pieceName.trim()) { toast.error("Nome da peça é obrigatório"); return; }
    if (!printer) { toast.error("Selecione uma impressora"); return; }
    if (!user) return;

    // Plano free: máximo de 10 orçamentos salvos no mês atual
    if (!isPro) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { count, error: countError } = await supabase
        .from("orcamentos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth)
        .lt("created_at", startOfNextMonth);

      if (countError) {
        console.error("contar orçamentos do mês", countError);
      } else if ((count || 0) >= FREE_MONTHLY_QUOTE_LIMIT) {
        toast.error("Você chegou aos 10 orçamentos do mês no plano gratuito. Faça upgrade pra continuar sem limite.");
        setUpgradeOpen(true);
        return;
      }
    }


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
      margem_lucro: priceMode === "preco" ? Number(reverseMargin.toFixed(2)) : margin,
      percentual_impostos: taxRate,
      custo_total: totalCost, 
      preco_sugerido: priceMode === "preco" ? manualPriceValue : suggestedPrice, 
      preco_minimo: minimumPrice,
      lucro_liquido: priceMode === "preco" ? Number(reverseProfit.toFixed(2)) : profit,
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


      // Sincronizar preço de venda com o estoque (produto finalizado).
      // Sempre grava o Preço Sugerido de Venda calculado no registro correspondente,
      // criando o item se ainda não existir. Vinculo pelo nome da peça (case-insensitive).
      try {
        const targetName = (withInventory ? inventoryForm.name : pieceName).trim();
        const targetCost = withInventory
          ? Number(inventoryForm.costPerUnit)
          : Number(totalCost.toFixed(2));
        const targetSalePrice = Number(Number(suggestedPrice).toFixed(2));

        const { data: existing } = await supabase
          .from("inventory")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("category", "finished_product")
          .ilike("name", targetName)
          .limit(1);

        const existingItem = existing && existing[0];

        if (existingItem) {
          const addedQty = withInventory ? Number(inventoryForm.quantity) : 0;
          const updatePayload: any = {
            sale_price: targetSalePrice,
            cost_per_unit: targetCost,
          };
          if (addedQty > 0) {
            updatePayload.quantity = Number(existingItem.quantity || 0) + addedQty;
          }
          const { error: updErr } = await supabase
            .from("inventory")
            .update(updatePayload)
            .eq("id", existingItem.id);
          if (updErr) {
            console.error("Error updating inventory sale price:", updErr);
            toast.error("Orçamento salvo, mas houve erro ao atualizar o preço no estoque.");
          } else if (withInventory) {
            toast.success("Orçamento salvo, estoque e preço de venda atualizados!");
          } else {
            toast.success("Orçamento salvo e preço de venda sincronizado no estoque!");
          }
        } else {
          const invData: any = {
            user_id: user.id,
            name: targetName,
            type: "product",
            category: "finished_product",
            quantity: withInventory ? Number(inventoryForm.quantity) : 0,
            unit: "unidade",
            cost_per_unit: targetCost,
            sale_price: targetSalePrice,
          };
          const { error: invError } = await supabase.from("inventory").insert([invData]);
          if (invError) {
            console.error("Error creating inventory item:", invError);
            toast.error("Orçamento salvo, mas houve erro ao registrar no estoque.");
          } else if (withInventory) {
            toast.success("Orçamento salvo e peça adicionada ao estoque!");
          } else {
            toast.success("Orçamento salvo e preço de venda sincronizado no estoque!");
          }
        }
      } catch (e) {
        console.error("Inventory sync error:", e);
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

  const panelMissing = useMemo(() => {
    const m: string[] = [];
    if (!pieceName.trim()) m.push("Nome da peça");
    if (!printer) m.push("Impressora");
    if (printTimeH <= 0) m.push("Tempo de impressão");
    if (totalWeight <= 0) m.push("Peso do filamento");
    if (totalFilamentCost <= 0) m.push("Custo do filamento por kg");
    return m;
  }, [pieceName, printer, printTimeH, totalWeight, totalFilamentCost]);

  const panelLines = useMemo(() => ([
    { label: "Material", value: totalFilamentCost },
    { label: "Energia", value: energyCost },
    { label: "Depreciação da impressora", value: depreciationCost },
    { label: "Manutenção", value: maintenanceCost },
    { label: "Mão de obra", value: laborCost + postProcessCost },
    { label: "Falha e risco", value: failureCost },
    { label: "Custos extras", value: totalPkgCost + totalAccessoriesCost },
  ]), [totalFilamentCost, energyCost, depreciationCost, maintenanceCost, laborCost, postProcessCost, failureCost, totalPkgCost, totalAccessoriesCost]);

  return (
    <div className="relative pb-24 lg:pb-0">
      <div className="lg:flex lg:gap-6 lg:items-start">
      <div className="space-y-6 flex-1 min-w-0 max-w-3xl">

      {isBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="text-primary" size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Você atingiu o limite do plano gratuito</h2>
            <p className="text-muted-foreground text-sm">
              Você já salvou 10 orçamentos este mês. Faça upgrade para o plano Pro e precifique sem limites.
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
            {activePrinters.length === 0 ? (
              <div className="space-y-2">
                <Select value={catalogSelection} onValueChange={setCatalogSelection}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Escolha um modelo do catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogByBrand.map(g => (
                      <SelectGroup key={g.marca}>
                        <SelectLabel>{g.marca}</SelectLabel>
                        {g.modelos.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleActivateCatalogPrinter}
                  disabled={!catalogSelection || activating}
                  className="bg-primary text-primary-foreground"
                >
                  {activating ? "Ativando..." : "Ativar impressora"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Você ainda não tem impressoras ativas. Ative um modelo do catálogo para continuar.
                </p>
              </div>
            ) : (
            <Select value={printerId} onValueChange={handlePrinterChange}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Selecione a impressora" />
              </SelectTrigger>
              <SelectContent>
                {activePrinters.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} {p.id === profile?.primary_printer_id && "(Principal)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
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
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-foreground">Valor/hora (R$)</Label><Input type="number" value={laborRate || ''} onChange={e => setLaborRate(+e.target.value)} className="bg-muted border-border" /></div>
                <div><Label className="text-foreground">Horas de trabalho manual</Label><Input type="number" min={0} step={1} value={laborHours || ''} onChange={e => setLaborHours(+e.target.value)} className="bg-muted border-border" /></div>
                <div><Label className="text-foreground">Minutos</Label><Input type="number" min={0} max={59} step={1} value={laborMinutes || ''} onChange={e => setLaborMinutes(+e.target.value)} className="bg-muted border-border" /></div>
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

          {/* Pós-processamento (independente da impressão) */}
          <div className="pt-4 border-t border-border space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                ✨ Pós-processamento, acabamento
                <Tip text="Tempo de trabalho manual após a impressão: limpeza, lixamento, pintura, montagem. É separado das horas de impressão." />
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Trabalho manual após a impressão. Somado ao custo de produção, antes da taxa de falha e da margem.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-foreground">Horas</Label>
                <Input type="number" min={0} value={finishHours || ''} onChange={e => setFinishHours(+e.target.value)} className="bg-muted border-border h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-foreground">Minutos</Label>
                <Input type="number" min={0} max={59} value={finishMinutes || ''} onChange={e => setFinishMinutes(+e.target.value)} className="bg-muted border-border h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-foreground">Valor/hora (R$)</Label>
                <Input
                  type="number"
                  value={finishRate === "" ? (laborMode === "manual" ? (laborRate || '') : 45) : finishRate}
                  onChange={e => setFinishRate(e.target.value === "" ? "" : +e.target.value)}
                  className="bg-muted border-border h-8 text-xs"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Custo de pós-processamento: <span className="font-mono text-primary font-bold">R$ {postProcessCost.toFixed(2)}</span>
              <span className="text-muted-foreground/60"> ({finishTimeH.toFixed(2)}h x R$ {effectiveFinishRate.toFixed(2)}/h)</span>
            </div>
          </div>
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

          {/* BLOCK 2 Markup & Tax Controls */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-foreground">
                Markup (%)
                <Tip text="Markup é o multiplicador aplicado sobre o custo. Diferente de margem real, que é o lucro sobre o preço de venda." />
              </Label>
              <span className="font-mono text-primary text-sm">{margin}%</span>
            </div>
            <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={300} step={1} className="[&>span:first-child]:bg-muted [&_[role=slider]]:bg-primary" />
            <p className="text-[11px] text-muted-foreground mt-2">
              Margem real sobre o preço de venda: <span className="font-mono text-primary font-bold">{realMargin.toFixed(1)}%</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">Impostos/Taxas (%)<Tip text="Inclua MEI, Simples Nacional ou outras taxas aplicáveis" /></Label>
              <Input type="number" value={taxRate || ''} onChange={e => setTaxRate(+e.target.value)} className="bg-muted border-border" />
            </div>
            <div>
              <Label className="text-foreground">
                Taxa de falha (%)
                <Tip text="Percentual de peças que falham na impressão. O desperdício é diluído nas peças boas: custo_ajustado = custo / (1 - taxa/100)." />
              </Label>
              <Input type="number" min={0} max={95} value={failureRate} onChange={e => setFailureRate(+e.target.value)} className="bg-muted border-border" />
            </div>
          </div>
          {failureCost > 0 && (
            <p className="text-[11px] text-muted-foreground -mt-2">
              Custo de falha embutido: <span className="font-mono text-primary font-bold">R$ {failureCost.toFixed(2)}</span>
              <span className="text-muted-foreground/60"> (produção R$ {productionCost.toFixed(2)}, ajustado R$ {adjustedCost.toFixed(2)})</span>
            </p>
          )}

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
              <p className="text-lg font-bold font-mono text-primary">
                R$ {profit.toFixed(2)}
                <span className="text-xs text-muted-foreground"> (markup {margin}%, margem real {realMargin.toFixed(1)}%)</span>
              </p>
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

      <PricingResultPanel
        suggestedPrice={suggestedPrice}
        profit={profit}
        realMargin={realMargin}
        totalCost={totalCost}
        margin={margin}
        onMarginChange={setMargin}
        lines={panelLines}
        missing={panelMissing}
        mode={priceMode}
        onModeChange={setPriceMode}
        manualPrice={manualPrice}
        onManualPriceChange={setManualPrice}
        marketplaceFee={marketplaceFee}
        onMarketplaceFeeChange={setMarketplaceFee}
        applyCardFee={applyCardFee}
        onApplyCardFeeChange={setApplyCardFee}
        cardFeePercent={cardFeePercent}
        taxRate={taxRate}
        reverseDeductions={reverseDeductions}
        reverseProfit={reverseProfit}
        reverseMargin={reverseMargin}
        minMargin={minMarginPct}
      />
      </div>
    </div>
  );
}


import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Calculator, Info, Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceConfig {
  name: string;
  commission: number;
  fixedFee: number;
  color: string;
}

const MARKETPLACES: MarketplaceConfig[] = [
  { name: "Shopee", commission: 14, fixedFee: 3, color: "#EE4D2D" },
  { name: "Mercado Livre", commission: 13, fixedFee: 6, color: "#FFE600" },
  { name: "Amazon", commission: 12, fixedFee: 0, color: "#FF9900" },
  { name: "TikTok Shop", commission: 5, fixedFee: 0, color: "#000000" },
];

const CATEGORIES = [
  { name: "Personalizados & Impressão 3D", commissions: { Shopee: 14, "Mercado Livre": 13, Amazon: 12, "TikTok Shop": 5 } },
  { name: "Decoração", commissions: { Shopee: 14, "Mercado Livre": 13, Amazon: 12, "TikTok Shop": 5 } },
  { name: "Brinquedos", commissions: { Shopee: 14, "Mercado Livre": 14, Amazon: 13, "TikTok Shop": 6 } },
  { name: "Eletrônicos", commissions: { Shopee: 15, "Mercado Livre": 16, Amazon: 15, "TikTok Shop": 8 } },
];

export default function MarketplacePage() {
  const location = useLocation();
  const initialCost = location.state?.cost || 0;

  const [productName, setProductName] = useState("");
  const [baseCost, setBaseCost] = useState(initialCost);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [targetMargin, setTargetMargin] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysis = useMemo(() => {
    const category = CATEGORIES.find(c => c.name === selectedCategory);
    
    return MARKETPLACES.map(mp => {
      const commission = category?.commissions[mp.name as keyof typeof category.commissions] || mp.commission;
      
      // Cálculo: Preço = (Custo + Taxa Fixa) / (1 - (Comissão + Margem)/100)
      // Simplificado: Preço Sugerido com margem alvo
      const commissionDecimal = commission / 100;
      const marginDecimal = targetMargin / 100;
      
      const suggestedPrice = (baseCost + mp.fixedFee) / (1 - commissionDecimal - marginDecimal);
      const totalFees = suggestedPrice * commissionDecimal + mp.fixedFee;
      const profit = suggestedPrice - baseCost - totalFees;

      return {
        ...mp,
        commission,
        suggestedPrice: Math.max(0, suggestedPrice),
        totalFees,
        profit,
        roi: (profit / baseCost) * 100
      };
    });
  }, [baseCost, selectedCategory, targetMargin]);

  const handleAIAnalysis = async () => {
    if (!productName) {
      toast.error("Informe o nome do produto para análise por IA");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('margin-suggestion', {
        body: { pieceName: productName, marketplaceAnalysis: true },
      });

      if (error) throw error;
      
      if (data?.margem_sugerida) {
        setTargetMargin(data.margem_sugerida);
        toast.success("IA analisou o mercado e sugeriu uma margem ideal!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao consultar IA. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="text-[#00D4FF]" />
          Calculadora de Marketplace
        </h1>
        <p className="text-gray-400 text-sm">Otimize seus preços para vender em diferentes plataformas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-[#111827] border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Calculator size={16} className="text-[#00D4FF]" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Nome do Produto</Label>
              <div className="relative">
                <Input 
                  placeholder="Ex: Vaso Articulado"
                  className="bg-[#0B1020] border-white/10 text-white"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-8 w-8 text-[#7C3AED] hover:text-[#7C3AED]/80 hover:bg-transparent"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Custo de Produção (R$)</Label>
              <Input 
                type="number"
                className="bg-[#0B1020] border-white/10 text-white"
                value={baseCost}
                onChange={(e) => setBaseCost(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-[#0B1020] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10 text-white">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-gray-400">Margem Alvo (%)</Label>
                <span className="text-xs text-[#00D4FF] font-mono">{targetMargin}%</span>
              </div>
              <Input 
                type="range"
                min="10"
                max="200"
                step="5"
                className="accent-[#7C3AED]"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
              />
            </div>
            
            <div className="p-3 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex gap-3 mt-4">
              <Info className="text-[#7C3AED] shrink-0" size={18} />
              <p className="text-[11px] text-gray-300 leading-relaxed">
                As taxas incluem comissão da plataforma + taxas fixas por venda. A calculadora sugere o preço ideal para atingir sua margem de lucro líquida.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.map((mp) => (
            <Card key={mp.name} className="bg-[#111827] border-white/10 overflow-hidden relative group">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: mp.color }}
              />
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-white">{mp.name}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1 border-white/10 text-gray-400">
                      Taxa: {mp.commission}% {mp.fixedFee > 0 && `+ R$ ${mp.fixedFee.toFixed(2)}`}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Preço Sugerido</p>
                    <p className="text-xl font-bold text-[#00D4FF] font-mono">
                      R$ {mp.suggestedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#0B1020] p-2 rounded border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase">Lucro Líquido</p>
                    <p className="text-sm font-semibold text-green-400">R$ {mp.profit.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#0B1020] p-2 rounded border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase">ROI / Retorno</p>
                    <p className="text-sm font-semibold text-white">{mp.roi.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Comissão ({mp.commission}%)</span>
                    <span className="text-gray-300">R$ {(mp.suggestedPrice * mp.commission / 100).toFixed(2)}</span>
                  </div>
                  {mp.fixedFee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Taxa Fixa</span>
                      <span className="text-gray-300">R$ {mp.fixedFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Custo do Produto</span>
                    <span className="text-gray-300">R$ {baseCost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="md:col-span-2 bg-gradient-to-r from-[#111827] to-[#0B1020] border-dashed border-white/20">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
                <TrendingUp className="text-[#00D4FF]" />
              </div>
              <h4 className="text-white font-semibold">Análise de Canal de Venda</h4>
              <p className="text-sm text-gray-400 max-w-lg">
                O {analysis.reduce((prev, current) => (prev.profit > current.profit) ? prev : current).name} oferece o melhor retorno para este produto com as configurações atuais.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

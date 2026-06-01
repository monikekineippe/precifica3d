import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const COLORS = ["hsl(173,80%,50%)", "hsl(200,100%,60%)", "hsl(160,100%,50%)", "hsl(280,80%,60%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)"];

export default function ReportsPage() {
  const { isPro, user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (isPro && user) {
      supabase.from("orcamentos").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
        .then(({ data }) => { if (data) setQuotes(data); });
    }
  }, [isPro, user]);

  if (!isPro) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <div className="relative">
          <div className="filter blur-sm pointer-events-none opacity-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border bg-card h-64" />
              <Card className="border-border bg-card h-64" />
              <Card className="border-border bg-card h-64" />
              <Card className="border-border bg-card h-64" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Lock size={40} className="text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Recurso exclusivo Pro</p>
            <p className="text-muted-foreground text-sm mb-4">Acesse relatórios e gráficos avançados</p>
            <Button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground neon-glow">
              <Crown size={16} className="mr-2" /> Fazer Upgrade
            </Button>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </div>
    );
  }

  const filamentCosts: Record<string, { total: number; count: number }> = {};
  const monthlyData: Record<string, { month: string; count: number; revenue: number }> = {};
  const costBreakdown = { filament: 0, energy: 0, labor: 0, maintenance: 0, depreciation: 0, packaging: 0 };
  let topPieces: { name: string; margin: number; price: number }[] = [];

  quotes.forEach(q => {
    const filaments = Array.isArray(q.filamentos) ? q.filamentos : [];
    filaments.forEach((f: any) => {
      if (!filamentCosts[f.type]) filamentCosts[f.type] = { total: 0, count: 0 };
      filamentCosts[f.type].total += f.computedCost || 0;
      filamentCosts[f.type].count += 1;
    });

    const month = new Date(q.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!monthlyData[month]) monthlyData[month] = { month, count: 0, revenue: 0 };
    monthlyData[month].count += 1;
    monthlyData[month].revenue += q.preco_sugerido || 0;

    const totalFilamentCost = filaments.reduce((c: number, f: any) => c + (f.computedCost || 0), 0);
    costBreakdown.filament += totalFilamentCost;
    costBreakdown.energy += q.custo_energia || 0;
    costBreakdown.labor += q.custo_mao_de_obra || 0;
    costBreakdown.maintenance += q.custo_manutencao || 0;
    costBreakdown.depreciation += q.custo_depreciacao || 0;
    costBreakdown.packaging += q.custo_embalagem || 0;

    topPieces.push({ name: q.nome_peca, margin: q.margem_lucro, price: q.preco_sugerido });
  });

  topPieces = topPieces.sort((a, b) => b.margin - a.margin).slice(0, 5);

  const filamentChartData = Object.entries(filamentCosts).map(([type, d]) => ({
    name: type, value: +(d.total / Math.max(d.count, 1)).toFixed(2),
  }));

  const costPieData = [
    { name: "Filamento", value: +costBreakdown.filament.toFixed(2) },
    { name: "Energia", value: +costBreakdown.energy.toFixed(2) },
    { name: "Mão de obra", value: +costBreakdown.labor.toFixed(2) },
    { name: "Manutenção", value: +costBreakdown.maintenance.toFixed(2) },
    { name: "Depreciação", value: +costBreakdown.depreciation.toFixed(2) },
    { name: "Embalagem", value: +costBreakdown.packaging.toFixed(2) },
  ].filter(d => d.value > 0);

  const lineData = Object.values(monthlyData);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
      <p className="text-muted-foreground text-sm">Análise detalhada dos seus orçamentos</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm text-foreground">Distribuição de Custos</CardTitle></CardHeader>
          <CardContent>
            {costPieData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie data={costPieData}>
                    <Pie data={costPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {costPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </RePie>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm text-foreground">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                    <XAxis dataKey="month" fontSize={10} stroke="hsl(210,10%,55%)" />
                    <YAxis fontSize={10} stroke="hsl(210,10%,55%)" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(222,25%,11%)", border: "1px solid hsl(222,15%,18%)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="hsl(173,80%,50%)" name="Orçamentos" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(200,100%,60%)" name="Receita (R$)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm text-foreground">Peças Mais Lucrativas</CardTitle></CardHeader>
          <CardContent>
            {topPieces.length > 0 ? (
              <div className="space-y-2">
                {topPieces.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                    <span className="text-foreground truncate">{p.name}</span>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono text-primary">R$ {p.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.margin}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm text-foreground">Custo Médio por Filamento</CardTitle></CardHeader>
          <CardContent>
            {filamentChartData.length > 0 ? (
              <div className="space-y-2">
                {filamentChartData.map((f, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                    <span className="text-foreground">{f.name}</span>
                    <span className="font-mono text-primary">R$ {f.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

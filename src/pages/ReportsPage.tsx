import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PieChart as RePie, Pie, Cell, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ReferenceLine,
} from "recharts";

const COLORS = ["hsl(173,80%,50%)", "hsl(200,100%,60%)", "hsl(160,100%,50%)", "hsl(280,80%,60%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)"];

type PeriodPreset = "month" | "3months" | "year";

export default function ReportsPage() {
  const { isPro, user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [period, setPeriod] = useState<PeriodPreset>("month");

  useEffect(() => {
    if (isPro && user) {
      supabase.from("orcamentos").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
        .then(({ data }) => { if (data) setQuotes(data); });
      supabase.from("sales").select("*, orcamentos(nome_peca, preco_sugerido, margem_lucro)").eq("user_id", user.id).order("created_at", { ascending: true })
        .then(({ data }) => { if (data) setSales(data); });
      supabase.from("user_settings").select("monthly_revenue_goal").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data) setMonthlyGoal(Number(data.monthly_revenue_goal) || 0); });
    }
  }, [isPro, user]);

  const { periodStart, periodEnd } = useMemo(() => {
    const now = new Date();
    const end = now;
    let start: Date;
    if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "3months") {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
    }
    return { periodStart: start, periodEnd: end };
  }, [period]);

  const inPeriod = (d: string) => {
    const dt = new Date(d);
    return dt >= periodStart && dt <= periodEnd;
  };

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

  // ===== Existing aggregations =====
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

  // ===== Desempenho Real (period-filtered) =====
  const periodQuotes = quotes.filter(q => inPeriod(q.created_at));
  const periodSales = sales.filter(s => inPeriod(s.created_at));

  // Quote aggregations by product name
  const quoteByProduct: Record<string, { count: number; priceSum: number; marginSum: number }> = {};
  periodQuotes.forEach(q => {
    const name = (q.nome_peca || "Sem nome").trim();
    if (!quoteByProduct[name]) quoteByProduct[name] = { count: 0, priceSum: 0, marginSum: 0 };
    quoteByProduct[name].count += 1;
    quoteByProduct[name].priceSum += Number(q.preco_sugerido) || 0;
    quoteByProduct[name].marginSum += Number(q.margem_lucro) || 0;
  });

  // Sale aggregations by product name (via linked orcamento)
  const saleByProduct: Record<string, { count: number; revenue: number; priceSum: number; marginSum: number; marginCount: number }> = {};
  periodSales.forEach(s => {
    const name = (s.orcamentos?.nome_peca || "Sem produto").trim();
    if (!saleByProduct[name]) saleByProduct[name] = { count: 0, revenue: 0, priceSum: 0, marginSum: 0, marginCount: 0 };
    const total = Number(s.total_amount) || 0;
    saleByProduct[name].count += 1;
    saleByProduct[name].revenue += total;
    saleByProduct[name].priceSum += total;
    if (s.profit_margin_percent !== null && s.profit_margin_percent !== undefined) {
      saleByProduct[name].marginSum += Number(s.profit_margin_percent) || 0;
      saleByProduct[name].marginCount += 1;
    }
  });

  // Comparativo (only products with both quote and sale)
  const comparativo = Object.keys(quoteByProduct)
    .filter(name => saleByProduct[name])
    .map(name => {
      const q = quoteByProduct[name];
      const s = saleByProduct[name];
      const avgQuoted = q.priceSum / q.count;
      const avgSold = s.priceSum / s.count;
      const avgQuotedMargin = q.marginSum / q.count;
      const avgRealMargin = s.marginCount > 0 ? s.marginSum / s.marginCount : 0;
      return {
        name,
        avgQuoted,
        avgSold,
        diff: avgSold - avgQuoted,
        quotedMargin: avgQuotedMargin,
        realMargin: avgRealMargin,
      };
    });

  const topSold = Object.entries(saleByProduct)
    .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topQuoted = Object.entries(quoteByProduct)
    .map(([name, d]) => ({ name, count: d.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Revenue chart: week or month buckets depending on period
  const revenueBuckets: Record<string, { label: string; revenue: number; order: number }> = {};
  periodSales.forEach(s => {
    const dt = new Date(s.created_at);
    let key: string;
    let label: string;
    let order: number;
    if (period === "month") {
      // weekly within month
      const day = dt.getDate();
      const week = Math.floor((day - 1) / 7) + 1;
      key = `${dt.getFullYear()}-${dt.getMonth()}-W${week}`;
      label = `Sem ${week}`;
      order = week;
    } else {
      // monthly
      key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, "0")}`;
      label = dt.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      order = dt.getFullYear() * 12 + dt.getMonth();
    }
    if (!revenueBuckets[key]) revenueBuckets[key] = { label, revenue: 0, order };
    revenueBuckets[key].revenue += Number(s.total_amount) || 0;
  });
  const revenueData = Object.values(revenueBuckets).sort((a, b) => a.order - b.order)
    .map(b => ({ label: b.label, revenue: +b.revenue.toFixed(2) }));

  // Goal calc: monthlyGoal scaled by number of months in period
  const monthsInPeriod = period === "month" ? 1 : period === "3months" ? 3 : (new Date().getMonth() + 1);
  const targetTotal = monthlyGoal * monthsInPeriod;
  const realizedTotal = periodSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const diffGoal = realizedTotal - targetTotal;
  // Per-bucket goal line
  const bucketGoal = revenueData.length > 0 ? targetTotal / revenueData.length : 0;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2)}`;

  const periodLabel = period === "month" ? "Este mês" : period === "3months" ? "Últimos 3 meses" : "Este ano";

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

      {/* ====== DESEMPENHO REAL ====== */}
      <div className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Desempenho Real</h2>
            <p className="text-xs text-muted-foreground">Comparativo entre orçamentos e vendas reais</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { v: "month", label: "Este mês" },
              { v: "3months", label: "Últimos 3 meses" },
              { v: "year", label: "Este ano" },
            ] as { v: PeriodPreset; label: string }[]).map(opt => (
              <Button
                key={opt.v}
                size="sm"
                variant={period === opt.v ? "default" : "outline"}
                onClick={() => setPeriod(opt.v)}
                className={period === opt.v ? "bg-primary text-primary-foreground" : ""}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Exibindo: {periodLabel}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 — Comparativo */}
          <Card className="border-border bg-card md:col-span-2">
            <CardHeader><CardTitle className="text-sm text-foreground">Comparativo Orçado x Vendido</CardTitle></CardHeader>
            <CardContent>
              {comparativo.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-right">Orçado (méd.)</TableHead>
                        <TableHead className="text-xs text-right">Vendido (méd.)</TableHead>
                        <TableHead className="text-xs text-right">Diferença</TableHead>
                        <TableHead className="text-xs text-right">Margem orç.</TableHead>
                        <TableHead className="text-xs text-right">Margem real</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparativo.map((r, i) => {
                        const negative = r.diff < 0;
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-sm text-foreground">{r.name}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{formatBRL(r.avgQuoted)}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{formatBRL(r.avgSold)}</TableCell>
                            <TableCell className={`text-sm text-right font-mono ${negative ? "text-destructive" : "text-primary"}`}>
                              {negative ? "-" : "+"}{formatBRL(Math.abs(r.diff))}
                            </TableCell>
                            <TableCell className="text-sm text-right font-mono text-muted-foreground">{r.quotedMargin.toFixed(1)}%</TableCell>
                            <TableCell className={`text-sm text-right font-mono ${r.realMargin < r.quotedMargin ? "text-destructive" : "text-primary"}`}>
                              {r.realMargin.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto com orçamento e venda no período</p>}
            </CardContent>
          </Card>

          {/* Card 2 — Top vendidos */}
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm text-foreground">Top 5 Produtos Mais Vendidos</CardTitle></CardHeader>
            <CardContent>
              {topSold.length > 0 ? (
                <div className="space-y-2">
                  {topSold.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                      <span className="text-foreground truncate">{p.name}</span>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-mono text-primary">{p.count}x</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatBRL(p.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sem vendas no período</p>}
            </CardContent>
          </Card>

          {/* Card 3 — Top orçados */}
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm text-foreground">Top 5 Produtos Mais Orçados</CardTitle></CardHeader>
            <CardContent>
              {topQuoted.length > 0 ? (
                <div className="space-y-2">
                  {topQuoted.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                      <span className="text-foreground truncate">{p.name}</span>
                      <span className="font-mono text-primary">{p.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sem orçamentos no período</p>}
            </CardContent>
          </Card>

          {/* Card 4 — Receita com meta */}
          <Card className="border-border bg-card md:col-span-2">
            <CardHeader><CardTitle className="text-sm text-foreground">Receita do Período</CardTitle></CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,15%,18%)" />
                        <XAxis dataKey="label" fontSize={10} stroke="hsl(210,10%,55%)" />
                        <YAxis fontSize={10} stroke="hsl(210,10%,55%)" />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(222,25%,11%)", border: "1px solid hsl(222,15%,18%)", fontSize: 12 }} />
                        <Bar dataKey="revenue" fill="hsl(173,80%,50%)" name="Receita" />
                        {monthlyGoal > 0 && (
                          <ReferenceLine y={bucketGoal} stroke="hsl(40,90%,55%)" strokeDasharray="4 4" label={{ value: "Meta", fill: "hsl(40,90%,55%)", fontSize: 10, position: "right" }} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {monthlyGoal > 0 ? (
                    <div className="mt-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Meta: <span className="font-mono text-foreground">{formatBRL(targetTotal)}</span></span>
                      <span className="text-muted-foreground">Realizado: <span className="font-mono text-foreground">{formatBRL(realizedTotal)}</span></span>
                      <span className="text-muted-foreground">
                        Diferença:{" "}
                        <span className={`font-mono ${diffGoal < 0 ? "text-destructive" : "text-primary"}`}>
                          {diffGoal < 0 ? "-" : "+"}{formatBRL(Math.abs(diffGoal))}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Configure uma meta mensal em Configurações para visualizar a linha de meta.</p>
                  )}
                </>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sem receita no período</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

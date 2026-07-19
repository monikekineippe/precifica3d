import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  PlusCircle, 
  Printer, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Target, 
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Wallet,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

const formatBRL = (v: number) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toDateKey = (value?: string | null) => {
  if (!value) return "";
  const key = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : "";
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyGrossProfit: 0,
    monthlyGoal: 0,
    monthlySalesCount: 0,
    ticketMedio: 0,
    criticalStock: 0,
    operationalExpenses: 0,
    materialExpenses: 0,
    investmentExpenses: 0,
    printersCount: 0,
    activePrinter: null as any,
    cashBalance: 0,
    cashInflowsMonth: 0,
    cashOutflowsMonth: 0,
    aReceber: 0,
    stockForecast: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<{ produto: string; quantidade: number; valor: number }[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (isManual = false) => {
    if (!user) return;
    
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();
      const firstDay = startOfMonth(now);
      const lastDay = endOfMonth(now);

      // 0. Get Active Printer and Printers Count
      const { data: profileData } = await supabase
        .from("profiles")
        .select("primary_printer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get all printers to find the name of the primary one (even if it's a preset)
      const { data: allAvailablePrinters } = await supabase
        .from("impressoras")
        .select("*")
        .or(`user_id.eq.${user.id},is_precadastrada.eq.true`);

      const activePrinter = allAvailablePrinters ? allAvailablePrinters.find((p: any) => p.id === profileData?.primary_printer_id) : null;
      
      // Contagem de impressoras: 
      // Se houver uma impressora ativa selecionada (mesmo que seja pré-cadastrada), ela conta como 1.
      // Somamos isso à quantidade de impressoras personalizadas (não pré-cadastradas) do usuário.
      const userCustomPrinters = allAvailablePrinters ? allAvailablePrinters.filter((p: any) => !p.is_precadastrada && p.user_id === user.id) : [];
      
      // Se a impressora ativa for uma pré-cadastrada, contamos ela.
      // Se não, ela já está na lista de customizadas.
      const isActivePrinterPreset = activePrinter?.is_precadastrada;
      const printersCount = userCustomPrinters.length + (isActivePrinterPreset ? 1 : 0);

      // 2. Get Revenue Goal
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("monthly_revenue_goal")
        .eq("user_id", user.id)
        .maybeSingle();

      // 3. Get Critical Stock
      const { data: inventory } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id);
      
      const criticalCount = inventory ? inventory.filter((i: any) => i.category === 'raw_material' && Number(i.min_stock) > 0 && Number(i.quantity) <= Number(i.min_stock)).length : 0;

      // 4. Get Monthly Expenses (Other Movements)
      const { data: expenses } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "outflow")
        .gte("created_at", firstDay.toISOString())
        .lte("created_at", lastDay.toISOString());

      // 4b. Cash summary: all-time balance and month totals
      const { data: allCash } = await supabase
        .from("cash_transactions")
        .select("type, amount, created_at")
        .eq("user_id", user.id);

      let cashBalance = 0;
      let cashInflowsMonth = 0;
      let cashOutflowsMonth = 0;
      if (allCash) {
        for (const t of allCash as any[]) {
          const amt = Number(t.amount || 0);
          if (t.type === "inflow") cashBalance += amt;
          else if (t.type === "outflow") cashBalance -= amt;
          const d = new Date(t.created_at);
          if (d >= firstDay && d <= lastDay) {
            if (t.type === "inflow") cashInflowsMonth += amt;
            else if (t.type === "outflow") cashOutflowsMonth += amt;
          }
        }
      }

      // 4c. A receber: encomendas com saldo pendente
      const { data: encomendas } = await supabase
        .from("encomendas")
        .select("id, valor_total")
        .eq("user_id", user.id);
      const { data: pagamentos } = await supabase
        .from("encomenda_pagamentos")
        .select("encomenda_id, valor")
        .eq("user_id", user.id);
      const paidByOrder: Record<string, number> = {};
      (pagamentos || []).forEach((p: any) => {
        paidByOrder[p.encomenda_id] = (paidByOrder[p.encomenda_id] || 0) + Number(p.valor || 0);
      });
      let aReceber = 0;
      (encomendas || []).forEach((e: any) => {
        const total = Number(e.valor_total || 0);
        const paid = paidByOrder[e.id] || 0;
        const pending = total - paid;
        if (pending > 0.005) aReceber += pending;
      });


      // 5. Encomendas quitadas: usadas como "vendas" para os widgets
      const { data: encRows } = await supabase
        .from("encomendas")
        .select("id, cliente_nome, produto, quantidade, valor_total, created_at, inventory_item_id")
        .eq("user_id", user.id);
      const { data: pagRows } = await supabase
        .from("encomenda_pagamentos")
        .select("encomenda_id, valor, data_pagamento, created_at")
        .eq("user_id", user.id);

      // Custos unitários vindos do módulo de precificação (inventory.cost_per_unit)
      const { data: invRows } = await supabase
        .from("inventory")
        .select("id, cost_per_unit")
        .eq("user_id", user.id);
      const costByInv: Record<string, number> = {};
      (invRows || []).forEach((i: any) => {
        costByInv[i.id] = Number(i.cost_per_unit || 0);
      });

      const pagosMap: Record<string, { total: number; lastDateKey: string }> = {};
      (pagRows || []).forEach((p: any) => {
        const key = p.encomenda_id as string;
        const cur = pagosMap[key] || { total: 0, lastDateKey: "" };
        cur.total += Number(p.valor || 0);
        const paymentDateKey = toDateKey(p.data_pagamento || p.created_at);
        if (paymentDateKey && (!cur.lastDateKey || paymentDateKey > cur.lastDateKey)) {
          cur.lastDateKey = paymentDateKey;
        }
        pagosMap[key] = cur;
      });

      const quitadas = (encRows || [])
        .map((e: any) => {
          const total = Number(e.valor_total || 0);
          const info = pagosMap[e.id] || { total: 0, lastDateKey: "" };
          const pago = info.total;
          const isQuitado = total > 0 && pago + 0.001 >= total && Boolean(info.lastDateKey);
          return { ...e, _pago: pago, _quitadoEm: info.lastDateKey, _isQuitado: isQuitado };
        })
        .filter((e: any) => e._isQuitado);

      const recent = [...quitadas]
        .sort((a, b) => (a._quitadoEm < b._quitadoEm ? 1 : -1))
        .slice(0, 10);

      // Encomendas quitadas no mês atual (data de quitação dentro do mês)
      const quitadasMes = quitadas.filter((e: any) => {
        if (!e._quitadoEm) return false;
        const d = new Date(`${e._quitadoEm}T00:00:00`);
        return d >= firstDay && d <= lastDay;
      });
      const monthlyRevenueEncomendas = quitadasMes.reduce(
        (sum: number, e: any) => sum + Number(e.valor_total || 0),
        0
      );
      const monthlySalesCountEnc = quitadasMes.length;
      const ticketMedioEnc = monthlySalesCountEnc > 0 ? monthlyRevenueEncomendas / monthlySalesCountEnc : 0;
      const monthlyCogsEnc = quitadasMes.reduce((sum: number, e: any) => {
        const qty = Number(e.quantidade || 0);
        const unitCost = e.inventory_item_id ? (costByInv[e.inventory_item_id] || 0) : 0;
        return sum + qty * unitCost;
      }, 0);
      const monthlyGrossProfitEnc = monthlyRevenueEncomendas - monthlyCogsEnc;

      const topAgg: Record<string, { produto: string; quantidade: number; valor: number }> = {};
      quitadas.forEach((e: any) => {
        const nome = (e.produto || "Sem nome").trim();
        const cur = topAgg[nome] || { produto: nome, quantidade: 0, valor: 0 };
        cur.quantidade += Number(e.quantidade || 0);
        cur.valor += Number(e.valor_total || 0);
        topAgg[nome] = cur;
      });
      const topList = Object.values(topAgg)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);


      // 6. Evolução (últimos 30 dias): encomendas quitadas por data de quitação
      // Normalização: chave "yyyy-MM-dd" no fuso local, tanto para cada
      // coluna do eixo X quanto para _quitadoEm. Evita deslocamento por fuso
      // e agrupamento em índice errado.
      const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
      const last30Days: Date[] = [];
      for (let i = 29; i >= 0; i--) {
        last30Days.push(subDays(now, i));
      }
      const chartTotalsByDate: Record<string, number> = {};
      quitadas.forEach((e: any) => {
        const key = e._quitadoEm;
        if (!key) return;
        chartTotalsByDate[key] = (chartTotalsByDate[key] || 0) + Number(e.valor_total || 0);
      });
      const chartDataFormatted = last30Days.map((day) => {
        const key = dayKey(day);
        return {
          date: format(day, "dd/MM"),
          dateKey: key,
          valor: chartTotalsByDate[key] || 0,
        };
      });

      // Processing Expenses
      let operational = 0;
      let material = 0;
      let investment = 0;

      if (expenses) {
        expenses.forEach((e: any) => {
          if (e.category === "despesa_fixa" || e.category === "despesa_variavel" || e.category === "retirada") {
            operational += Number(e.amount || 0);
          } else if (e.category === "insumo_estoque") {
            material += Number(e.amount || 0);
          } else if (e.category === "investimento_equipamento") {
            investment += Number(e.amount || 0);
          }
        });
      }

      setStats({
        monthlyRevenue: monthlyRevenueEncomendas,
        monthlyGrossProfit: monthlyGrossProfitEnc,
        monthlyGoal: userSettings?.monthly_revenue_goal || 0,
        monthlySalesCount: monthlySalesCountEnc,
        ticketMedio: ticketMedioEnc,
        criticalStock: criticalCount,
        operationalExpenses: operational,
        materialExpenses: material,
        investmentExpenses: investment,
        printersCount: printersCount,
        activePrinter: activePrinter,
        cashBalance,
        cashInflowsMonth,
        cashOutflowsMonth,
        aReceber,
      });
      setRecentSales(recent || []);
      setTopItems(topList);
      setChartData(chartDataFormatted);

      if (isManual) {
        toast.success("Dashboard atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (isManual) {
        toast.error("Erro ao atualizar dados.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goalCompletion = stats.monthlyGoal > 0 
    ? Math.min(Math.round((stats.monthlyRevenue / stats.monthlyGoal) * 100), 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão real do seu negócio 3D</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCcw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild size="sm" variant="outline" className="border-border hidden sm:flex">
            <Link to="/settings"><Target size={14} className="mr-2" /> Ajustar Meta</Link>
          </Button>
        </div>
      </div>

      {/* Cash & Receivables Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/caixa">
          <Card className="bg-card border-border border-t-4 border-primary p-6 hover:border-primary/60 transition-colors cursor-pointer h-full">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                Saldo do Caixa
                <Wallet size={14} className="text-primary/60" />
              </p>
              <div className={`text-3xl font-bold font-mono tracking-tight ${stats.cashBalance < 0 ? 'text-alert' : 'text-foreground'}`}>
                {formatBRL(stats.cashBalance)}
              </div>
              <p className="text-[10px] text-muted-foreground">Saldo atual acumulado</p>
            </div>
          </Card>
        </Link>

        <Card className="bg-card border-border border-t-4 border-profit p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Entradas (Mês)
              <ArrowUpRight size={14} className="text-profit/60" />
            </p>
            <div className="text-3xl font-bold font-mono text-profit tracking-tight">
              {formatBRL(stats.cashInflowsMonth)}
            </div>
            <p className="text-[10px] text-muted-foreground">Total recebido no mês</p>
          </div>
        </Card>

        <Card className="bg-card border-border border-t-4 border-alert p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Saídas (Mês)
              <ArrowDownRight size={14} className="text-alert/60" />
            </p>
            <div className="text-3xl font-bold font-mono text-alert tracking-tight">
              {formatBRL(stats.cashOutflowsMonth)}
            </div>
            <p className="text-[10px] text-muted-foreground">Total pago no mês</p>
          </div>
        </Card>

        <Link to="/orders">
          <Card className="bg-card border-border border-t-4 border-primary/40 p-6 hover:border-primary/60 transition-colors cursor-pointer h-full">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                A Receber
                <Clock size={14} className="text-primary/60" />
              </p>
              <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                {formatBRL(stats.aReceber)}
              </div>
              <p className="text-[10px] text-muted-foreground">Saldo pendente de encomendas</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Stats (Line 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border border-t-4 border-white/40 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Faturamento (Mês)
              <DollarSign size={14} className="text-primary/40" />
            </p>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {formatBRL(stats.monthlyRevenue)}
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border border-t-4 border-profit p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Lucro Bruto (Mês)
              <TrendingUp size={14} className="text-profit/40" />
            </p>
            <div className="text-3xl font-bold font-mono text-profit tracking-tight">
              {formatBRL(stats.monthlyGrossProfit)}
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border border-t-4 border-primary p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Meta Mensal
              <span className="text-[10px] text-primary">{goalCompletion}%</span>
            </p>
            <div className="space-y-3">
              <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                {formatBRL(stats.monthlyGoal)}
              </div>
              <Progress value={goalCompletion} className="h-1.5" />
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border border-t-4 border-primary/40 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Ticket Médio
              <ArrowUpRight size={14} className="text-primary/40" />
            </p>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {formatBRL(stats.ticketMedio)}
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats (Line 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/printers">
          <Card className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Impressoras</p>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold font-mono text-foreground">{stats.printersCount}</div>
                <Printer size={24} className="text-muted-foreground opacity-20" />
              </div>
              {stats.activePrinter ? (
                <p className="text-[10px] text-primary truncate mt-1">Ativa: {stats.activePrinter.nome}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground truncate mt-1">Nenhuma selecionada</p>
              )}
            </div>
          </Card>
        </Link>

        <Card className="border-border bg-card p-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendas no Mês</p>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold font-mono text-foreground">{stats.monthlySalesCount}</div>
              <ShoppingCart size={24} className="text-muted-foreground opacity-20" />
            </div>
          </div>
        </Card>

        <Link to="/inventory">
          <Card className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer p-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estoque Crítico</p>
              <div className="flex items-center justify-between">
                <div className={`text-3xl font-bold font-mono ${stats.criticalStock > 0 ? 'text-alert' : 'text-foreground'}`}>
                  {stats.criticalStock}
                </div>
                <AlertTriangle size={24} className={stats.criticalStock > 0 ? 'text-alert' : 'text-muted-foreground opacity-20'} />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="border-border bg-card p-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas do Mês</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Operacional:</span>
                <span className="font-mono text-alert">{formatBRL(stats.operationalExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Material/Estoque:</span>
                <span className="font-mono text-alert">{formatBRL(stats.materialExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Investimento:</span>
                <span className="font-mono text-alert">{formatBRL(stats.investmentExpenses)}</span>
              </div>
              <div className="pt-2 border-t border-border mt-1.5 flex justify-between text-xs font-bold">
                <span className="text-foreground">Total:</span>
                <span className="font-mono text-alert">{formatBRL(stats.operationalExpenses + stats.materialExpenses + stats.investmentExpenses)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-primary text-[#0B1020] font-bold hover:bg-primary/90 neon-glow">
          <Link to="/new"><PlusCircle size={16} className="mr-2" />Nova Precificação</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/sales"><ShoppingCart size={16} className="mr-2" />Nova Venda</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link to="/inventory"><Package size={16} className="mr-2" />Estoque</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link to="/caixa"><Wallet size={16} className="mr-2" />Caixa</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Evolução (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#666', fontSize: 10}}
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#666', fontSize: 10}}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#00D4FF' }}
                />
                <Line 
                  type="linear" 
                  dataKey="valor" 
                  stroke="#00D4FF" 
                  strokeWidth={2} 
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!payload || Number(payload.valor || 0) <= 0) {
                      return <g key={`empty-${index}`} />;
                    }
                    return (
                      <circle key={`dot-${index}`} cx={cx} cy={cy} r={3.5} fill="#00D4FF" stroke="#00D4FF" />
                    );
                  }}
                  activeDot={{ r: 5, fill: '#00D4FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Sales List (Encomendas Quitadas) */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" /> Vendas Recentes
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-primary">
              <Link to="/orders">Ver encomendas <ChevronRight size={12} className="ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma encomenda quitada ainda.</p>
                <Button asChild variant="link" className="text-primary text-xs mt-2">
                  <Link to="/orders">Ir para Encomendas</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{sale.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-profit/30 text-profit uppercase shrink-0">
                          Quitado
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {sale.produto}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold font-mono text-primary text-sm">{formatBRL(Number(sale.valor_total || 0))}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {sale._quitadoEm ? format(new Date(sale._quitadoEm), "dd/MM/yyyy") : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens mais vendidos */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Package size={16} className="text-primary" /> Itens mais vendidos
          </CardTitle>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Somente encomendas quitadas</span>
        </CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">Nenhum item vendido ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, idx) => (
                <div key={item.produto} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-primary/70 w-5">#{idx + 1}</span>
                    <p className="font-medium text-sm text-foreground truncate">{item.produto}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold font-mono text-foreground text-sm">{item.quantidade} un.</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{formatBRL(item.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

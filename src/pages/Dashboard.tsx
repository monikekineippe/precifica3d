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
  // Se for ISO string com T ou espaço, pega a parte da data
  const key = String(value).split(/[T ]/)[0];
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

      // Get all printers (user's + presets)
      const { data: allAvailablePrinters } = await supabase
        .from("impressoras")
        .select("*")
        .or(`user_id.eq.${user.id},is_precadastrada.eq.true`);

      const activePrinter = allAvailablePrinters ? allAvailablePrinters.find((p: any) => p.id === profileData?.primary_printer_id) : null;
      
      // Contagem de impressoras ATIVAS (salvas no banco)
      const activePrintersCount = allAvailablePrinters ? allAvailablePrinters.filter((p: any) => p.is_active).length : 0;
      const printersCount = activePrintersCount;

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

      const stockForecast = inventory
        ? inventory
            .filter((i: any) => i.category === 'finished_product' && Number(i.quantity) > 0)
            .reduce((sum: number, i: any) => sum + Number(i.sale_price || 0) * Number(i.quantity || 0), 0)
        : 0;

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


      // 5. Unificação de Encomendas Quitadas e Vendas Diretas
      const { data: encRows } = await supabase
        .from("encomendas")
        .select("id, cliente_nome, produto, quantidade, valor_total, created_at, inventory_item_id")
        .eq("user_id", user.id);
      
      const { data: pagRows } = await supabase
        .from("encomenda_pagamentos")
        .select("encomenda_id, valor, data_pagamento, created_at")
        .eq("user_id", user.id);

      // Vendas Diretas (Gestão de Caixa) que representam faturamento
      // Mantendo exatamente a mesma fonte de dados que a Gestão de Caixa usa para faturamento
      const { data: directSales } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "inflow")
        .or("category.eq.venda_estoque,category.eq.venda_direta,category.eq.venda");

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

      // Vendas de Encomendas Quitadas
      const quitadas = (encRows || [])
        .map((e: any) => {
          const total = Number(e.valor_total || 0);
          const info = pagosMap[e.id] || { total: 0, lastDateKey: "" };
          const pago = info.total;
          const isQuitado = total > 0 && pago + 0.05 >= total && Boolean(info.lastDateKey);
          
          const qty = Number(e.quantidade || 0);
          const unitCost = e.inventory_item_id ? (costByInv[e.inventory_item_id] || 0) : 0;
          const profit = total - (qty * unitCost);

          return { 
            id: e.id,
            cliente_nome: e.cliente_nome,
            produto: e.produto,
            quantidade: qty,
            valor_total: total,
            lucro: profit,
            _dateKey: info.lastDateKey, 
            _isQuitado: isQuitado,
            _source: 'encomenda',
            is_refunded: e.is_refunded
          };
        })
        .filter((e: any) => e._isQuitado && !e.is_refunded);

      // Vendas Diretas (Gestão de Caixa)
      const vendasDiretas = (directSales || [])
        .map((t: any) => {
          const dateKey = toDateKey(t.transaction_date || t.created_at);
          return {
            id: t.id,
            cliente_nome: t.customer_name || "Venda Direta",
            produto: t.description || "Produto",
            quantidade: t.quantity || 1,
            valor_total: Number(t.amount || 0),
            lucro: Number(t.net_profit || t.amount || 0),
            _dateKey: dateKey,
            _isQuitado: true,
            _source: 'caixa'
          };
        });

      // Unificação das duas fontes
      const allSales = [...quitadas, ...vendasDiretas];

      const recent = [...allSales]
        .sort((a, b) => (a._dateKey < b._dateKey ? 1 : -1))
        .slice(0, 10);

      // Filtragem para o mês atual
      const salesMes = allSales.filter((s: any) => {
        if (!s._dateKey) return false;
        const saleDate = new Date(s._dateKey + 'T12:00:00');
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      });

      const monthlyRevenue = salesMes.reduce((sum: number, s: any) => sum + s.valor_total, 0);
      const monthlySalesCount = salesMes.length;
      const ticketMedio = monthlySalesCount > 0 ? monthlyRevenue / monthlySalesCount : 0;
      const monthlyGrossProfit = salesMes.reduce((sum: number, s: any) => sum + s.lucro, 0);

      // Itens mais vendidos (Top 5)
      const topAgg: Record<string, { produto: string; quantidade: number; valor: number }> = {};
      allSales.forEach((s: any) => {
        const nome = (s.produto || "Sem nome").trim();
        const cur = topAgg[nome] || { produto: nome, quantidade: 0, valor: 0 };
        cur.quantidade += Number(s.quantidade || 0);
        cur.valor += Number(s.valor_total || 0);
        topAgg[nome] = cur;
      });
      const topList = Object.values(topAgg)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // 6. Evolução (últimos 30 dias): Unificado
      const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
      const last30Days: Date[] = [];
      for (let i = 29; i >= 0; i--) {
        last30Days.push(subDays(now, i));
      }
      const chartTotalsByDate: Record<string, number> = {};
      allSales.forEach((s: any) => {
        const key = s._dateKey;
        if (!key) return;
        chartTotalsByDate[key] = (chartTotalsByDate[key] || 0) + s.valor_total;
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
        monthlyRevenue: monthlyRevenue,
        monthlyGrossProfit: monthlyGrossProfit,
        monthlyGoal: userSettings?.monthly_revenue_goal || 0,
        monthlySalesCount: monthlySalesCount,
        ticketMedio: ticketMedio,
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
        stockForecast,
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

  const currentMonthName = format(new Date(), "MMMM", { locale: ptBR });
  const currentMonthCapitalized = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão real do seu negócio 3D</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border h-9"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCcw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild size="sm" variant="outline" className="border-border h-9 hidden sm:flex">
            <Link to="/settings"><Target size={14} className="mr-2" /> Ajustar Meta</Link>
          </Button>
          <Button asChild className="bg-primary text-[#0B1020] font-bold hover:bg-primary/90 neon-glow h-9">
            <Link to="/new"><PlusCircle size={16} className="mr-2" />Nova Precificação</Link>
          </Button>
        </div>
      </div>

      {/* Financeiro Section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-1">Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/caixa" className="lg:col-span-2">
            <Card className="bg-card border-border border-t-4 border-primary p-6 hover:border-primary/60 transition-all cursor-pointer h-full shadow-lg shadow-primary/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Saldo do Caixa</p>
                  <Wallet size={16} className="text-primary" />
                </div>
                <div className={`text-4xl font-bold font-mono tracking-tight ${stats.cashBalance < 0 ? 'text-alert' : 'text-foreground'}`}>
                  {formatBRL(stats.cashBalance)}
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.cashBalance < 0 ? 'bg-alert' : 'bg-primary'}`} />
                  Saldo atual acumulado
                </p>
              </div>
            </Card>
          </Link>

          <Card className="bg-card border-border border-t-4 border-white/60 p-6 shadow-md">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex flex-wrap gap-1">
                  Faturamento <span className="text-primary/70">· {currentMonthCapitalized}</span>
                </p>
                <DollarSign size={16} className="text-primary/60" />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                {formatBRL(stats.monthlyRevenue)}
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border border-t-4 border-profit p-6 shadow-md">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex flex-wrap gap-1">
                  Lucro Bruto <span className="text-profit/70">· {currentMonthCapitalized}</span>
                </p>
                <TrendingUp size={16} className="text-profit/60" />
              </div>
              <div className="text-3xl font-bold font-mono text-profit tracking-tight">
                {formatBRL(stats.monthlyGrossProfit)}
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Entradas: {currentMonthCapitalized}</p>
                <ArrowUpRight size={14} className="text-profit/60" />
              </div>
              <div className="text-2xl font-bold font-mono text-profit tracking-tight">
                {formatBRL(stats.cashInflowsMonth)}
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Saídas: {currentMonthCapitalized}</p>
                <ArrowDownRight size={14} className="text-alert/60" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Operacional:</span>
                  <span className="font-mono text-alert">{formatBRL(stats.operationalExpenses)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Insumos:</span>
                  <span className="font-mono text-alert">{formatBRL(stats.materialExpenses)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Investimento:</span>
                  <span className="font-mono text-alert">{formatBRL(stats.investmentExpenses)}</span>
                </div>
                <div className="pt-1.5 border-t border-border mt-1.5 flex justify-between text-[11px] font-bold">
                  <span className="text-foreground">Total:</span>
                  <span className="font-mono text-alert">{formatBRL(stats.operationalExpenses + stats.materialExpenses + stats.investmentExpenses)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Link to="/orders">
            <Card className="bg-card border-border p-6 hover:border-primary/40 transition-colors cursor-pointer h-full shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">A Receber</p>
                  <Clock size={16} className="text-primary/60" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {formatBRL(stats.aReceber)}
                </div>
                <p className="text-[10px] text-muted-foreground">Saldo de encomendas</p>
              </div>
            </Card>
          </Link>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex flex-wrap gap-1">
                  Ticket Médio <span className="text-primary/70">· {currentMonthCapitalized}</span>
                </p>
                <ShoppingCart size={14} className="text-primary/60" />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                {formatBRL(stats.ticketMedio)}
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm lg:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex flex-wrap gap-1">
                  Meta <span className="text-primary/70">· {currentMonthCapitalized}</span>
                </p>
                <span className="text-[10px] font-bold text-primary">{goalCompletion}%</span>
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {formatBRL(stats.monthlyGoal)}
                </div>
                <Progress value={goalCompletion} className="h-1.5" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Operação Section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-1">Operação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border bg-card p-6 shadow-sm h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex flex-wrap gap-1">
                  Vendas <span className="text-primary/70">· {currentMonthCapitalized}</span>
                </p>
                <ShoppingCart size={18} className="text-primary/40" />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{stats.monthlySalesCount}</div>
              <p className="text-[10px] text-muted-foreground">Vendas e encomendas no mês</p>
            </div>
          </Card>

          <Link to="/inventory">
            <Card className="border-border bg-card hover:border-primary/40 transition-colors cursor-pointer p-6 h-full shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estoque Crítico</p>
                  <AlertTriangle size={18} className={stats.criticalStock > 0 ? 'text-alert' : 'text-primary/40'} />
                </div>
                <div className={`text-3xl font-bold font-mono ${stats.criticalStock > 0 ? 'text-alert' : 'text-foreground'}`}>
                  {stats.criticalStock}
                </div>
                <p className="text-[10px] text-muted-foreground">Insumos abaixo do mínimo</p>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Visual Charts and Lists Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Sales Chart */}
        <Card className="border-border bg-card shadow-md flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Evolução (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-4 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#666', fontSize: 10}}
                  minTickGap={25}
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
                  formatter={(val: number) => [formatBRL(val), 'Valor']}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#00D4FF" 
                  strokeWidth={2.5} 
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!payload || Number(payload.valor || 0) <= 0) {
                      return <g key={`empty-${index}`} />;
                    }
                    return (
                      <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#00D4FF" stroke="#0B1020" strokeWidth={1} />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#00D4FF', stroke: '#0B1020', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Sales List */}
        <Card className="border-border bg-card shadow-md flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
              <ShoppingCart size={14} className="text-primary" /> Vendas Recentes
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-muted-foreground hover:text-primary uppercase tracking-tighter">
              <Link to="/orders">Ver todas <ChevronRight size={12} className="ml-0.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow">
            {recentSales.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma venda realizada.</p>
                <Button asChild variant="link" className="text-primary text-xs mt-2">
                  <Link to="/orders">Gerenciar encomendas</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40 hover:border-primary/30 transition-all group">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{sale.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-muted-foreground truncate uppercase tracking-tighter bg-muted/40 px-1.5 py-0.5 rounded">
                          {sale.produto}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold font-mono text-primary text-sm">{formatBRL(Number(sale.valor_total || 0))}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {sale._dateKey ? format(new Date(sale._dateKey + 'T12:00:00'), "dd/MM/yy") : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Itens mais vendidos */}
      <Card className="border-border bg-card shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
            <Package size={14} className="text-primary" /> Itens mais vendidos
          </CardTitle>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Dados Reais unificados</span>
        </CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">Sem dados de venda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topItems.map((item, idx) => (
                <div key={item.produto} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-primary/40">0{idx + 1}</span>
                    <p className="font-medium text-sm text-foreground truncate">{item.produto}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold font-mono text-foreground text-sm">{item.quantidade} un.</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{formatBRL(item.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground py-4 border-t border-border/30">
        <Link to="/sales" className="text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Nova Venda</Link>
        <span className="text-border/40">•</span>
        <Link to="/inventory" className="text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Estoque</Link>
        <span className="text-border/40">•</span>
        <Link to="/caixa" className="text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Caixa</Link>
        <span className="text-border/40">•</span>
        <Link to="/reports" className="text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Relatórios</Link>
      </div>
    </div>
  );
}

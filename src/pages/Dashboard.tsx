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
  RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

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
    activePrinter: null as any
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
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

      // 1. Get Monthly Sales
      const { data: sales } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", firstDay.toISOString())
        .lte("created_at", lastDay.toISOString());

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
      
      const criticalCount = inventory ? inventory.filter((i: any) => i.quantity <= i.min_stock).length : 0;

      // 4. Get Monthly Expenses (Other Movements)
      const { data: expenses } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "outflow")
        .gte("created_at", firstDay.toISOString())
        .lte("created_at", lastDay.toISOString());

      // 5. Recent 5 Sales
      const { data: recent } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // 6. Last 30 days evolution
      const last30Days = eachDayOfInterval({
        start: subDays(now, 29),
        end: now
      });

      const { data: last30Sales } = await supabase
        .from("sales")
        .select("created_at, net_value")
        .eq("user_id", user.id)
        .gte("created_at", subDays(now, 29).toISOString());

      const chartDataFormatted = last30Days.map(day => {
        const daySales = last30Sales ? last30Sales.filter(s => isSameDay(new Date(s.created_at), day)) : [];
        const total = daySales.reduce((sum, s) => sum + Number(s.net_value || 0), 0);
        return {
          date: format(day, "dd/MM"),
          valor: total
        };
      });

      // Processing Sales Stats
      const revenue = sales ? sales.reduce((sum, s) => sum + Number(s.gross_value || 0), 0) : 0;
      const profit = sales ? sales.reduce((sum, s) => sum + Number(s.profit_amount || 0), 0) : 0;
      const count = sales ? sales.length : 0;
      const ticket = count > 0 ? revenue / count : 0;

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
        monthlyRevenue: revenue,
        monthlyGrossProfit: profit,
        monthlyGoal: userSettings?.monthly_revenue_goal || 0,
        monthlySalesCount: count,
        ticketMedio: ticket,
        criticalStock: criticalCount,
        operationalExpenses: operational,
        materialExpenses: material,
        investmentExpenses: investment,
        printersCount: printersCount,
        activePrinter: activePrinter
      });
      setRecentSales(recent || []);
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

      {/* Main Stats (Line 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border border-t-4 border-white/40 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
              Faturamento (Mês)
              <DollarSign size={14} className="text-primary/40" />
            </p>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              R$ {stats.monthlyGrossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                R$ {stats.monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
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
              R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <span className="font-mono text-alert">R$ {stats.operationalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Material/Estoque:</span>
                <span className="font-mono text-alert">R$ {stats.materialExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Investimento:</span>
                <span className="font-mono text-alert">R$ {stats.investmentExpenses.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border mt-1.5 flex justify-between text-xs font-bold">
                <span className="text-foreground">Total:</span>
                <span className="font-mono text-alert">R$ {(stats.operationalExpenses + stats.materialExpenses + stats.investmentExpenses).toFixed(2)}</span>
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
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#00D4FF" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: '#00D4FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Sales List */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" /> Últimas 5 Vendas
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-primary">
              <Link to="/sales">Ver todas <ChevronRight size={12} className="ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma venda registrada ainda.</p>
                <Button asChild variant="link" className="text-primary text-xs mt-2">
                  <Link to="/sales">Registrar minha primeira venda</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{sale.customer_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 text-primary uppercase">
                          {sale.origin_channel || 'Geral'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(sale.created_at), "dd/MM")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-primary text-sm">R$ {Number(sale.gross_value || 0).toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-profit font-medium">
                        <ArrowUpRight size={10} />
                        R$ {Number(sale.profit_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

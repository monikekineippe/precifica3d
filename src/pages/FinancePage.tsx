import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfYear, endOfYear, eachMonthOfInterval, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Encomenda {
  id: string;
  codigo: string;
  cliente_nome: string;
  produto: string;
  valor_total: number;
  status: string;
  created_at: string;
  data_entrega: string | null;
  is_refunded: boolean;
}

interface Pagamento {
  id: string;
  encomenda_id: string;
  valor: number;
  data_pagamento: string;
}

interface Transaction {
  id: string;
  type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  category: string | null;
  created_at: string;
  transaction_date: string | null;
}

const formatBRL = (v: number) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_LABELS: Record<string, string> = {
  venda: "Venda",
  encomenda: "Encomenda",
  insumo_estoque: "Insumo / Estoque",
  despesa_fixa: "Despesa Fixa",
  despesa_variavel: "Despesa Variável",
  investimento_equipamento: "Investimento / Equipamento",
  retirada: "Retirada",
  outros: "Outros"
};

export default function FinancePage() {
  const { user } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [enc, pag, trans] = await Promise.all([
        supabase.from("encomendas").select("*").eq("user_id", user.id),
        supabase.from("encomenda_pagamentos").select("*").eq("user_id", user.id),
        supabase.from("cash_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setEncomendas((enc.data || []) as Encomenda[]);
      setPagamentos((pag.data || []) as Pagamento[]);
      setTransactions((trans.data || []) as Transaction[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const dateInterval = useMemo(() => {
    const now = new Date();
    if (period === "total") return null;
    let start: Date, end: Date;

    if (period === "month") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (period === "year") {
      start = startOfYear(now);
      end = endOfYear(now);
    } else if (period === "custom" && customStart && customEnd) {
      start = startOfDay(parseISO(customStart));
      end = endOfDay(parseISO(customEnd));
    } else {
      return null;
    }
    return { start, end };
  }, [period, customStart, customEnd]);

  const filterByDate = (dateStr: string | null) => {
    if (!dateStr) return false;
    if (!dateInterval) return true;
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, dateInterval);
    } catch {
      return false;
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => filterByDate(t.transaction_date || t.created_at));
  }, [transactions, dateInterval]);

  const filteredPagamentos = useMemo(() => {
    return pagamentos.filter(p => filterByDate(p.data_pagamento));
  }, [pagamentos, dateInterval]);

  const totalInflows = useMemo(() => filteredTransactions.filter(t => t.type === 'inflow').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const totalOutflows = useMemo(() => filteredTransactions.filter(t => t.type === 'outflow').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const netFlow = totalInflows - totalOutflows;
  const margemContribuicao = totalInflows > 0 ? (netFlow / totalInflows) * 100 : 0;

  // Recebimentos Pendentes (Baseado em TODAS as encomendas que ainda têm saldo, mas respeitando o filtro de data da encomenda se aplicado?)
  // A instrução diz: "respeitar o período selecionado". Para recebimentos pendentes, faz sentido mostrar encomendas criadas no período que ainda estão pendentes.
  const pendingOrders = useMemo(() => {
    return encomendas
      .filter(e => e.status !== "cancelada" && !e.is_refunded && filterByDate(e.created_at))
      .map(e => {
        const total = Number(e.valor_total);
        const pago = pagamentos.filter(p => p.encomenda_id === e.id).reduce((s, p) => s + Number(p.valor), 0);
        return { ...e, pago, saldo: total - pago };
      })
      .filter(e => e.saldo > 0.01);
  }, [encomendas, pagamentos, dateInterval]);

  const totalAReceber = useMemo(() => pendingOrders.reduce((s, e) => s + e.saldo, 0), [pendingOrders]);

  // Fluxo de Caixa Chart Data
  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(subMonths(new Date(), 11)),
      end: new Date()
    });

    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const inMonth = (d: string) => isWithinInterval(parseISO(d), { start, end });
      
      const inflows = transactions.filter(t => t.type === 'inflow' && inMonth(t.transaction_date || t.created_at)).reduce((s, t) => s + Number(t.amount), 0);
      const outflows = transactions.filter(t => t.type === 'outflow' && inMonth(t.transaction_date || t.created_at)).reduce((s, t) => s + Number(t.amount), 0);
      
      return {
        name: format(m, "MMM/yy", { locale: ptBR }),
        entradas: inflows,
        saidas: outflows,
        saldo: inflows - outflows
      };
    });
  }, [transactions]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Caixa</h1>
          <p className="text-muted-foreground text-sm">Controle financeiro e fluxo de caixa</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
             <Label className="text-[10px] uppercase">Período</Label>
             <Select value={period} onValueChange={setPeriod}>
               <SelectTrigger className="w-32 h-9 border-border bg-card">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="total">Total</SelectItem>
                 <SelectItem value="month">Mensal</SelectItem>
                 <SelectItem value="year">Anual</SelectItem>
                 <SelectItem value="custom">Personalizado</SelectItem>
               </SelectContent>
             </Select>
          </div>

          {period === "custom" && (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase">Início</Label>
                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-9 w-36" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase">Fim</Label>
                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-9 w-36" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border border-t-4 border-primary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Saldo no Período</p>
              <Wallet size={14} className="text-primary/60" />
            </div>
            <p className={`text-2xl font-bold font-mono ${netFlow >= 0 ? 'text-primary' : 'text-red-400'}`}>
              {formatBRL(netFlow)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-t-4 border-emerald-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Entradas</p>
              <ArrowUpRight size={14} className="text-emerald-500/60" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {formatBRL(totalInflows)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-t-4 border-red-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Saídas</p>
              <ArrowDownRight size={14} className="text-red-500/60" />
            </div>
            <p className="text-2xl font-bold font-mono text-red-400">
              {formatBRL(totalOutflows)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-t-4 border-amber-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Margem de Contribuição</p>
              <TrendingUp size={14} className="text-amber-500/60" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-400">
              {margemContribuicao.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="pendentes">Recebimentos Pendentes</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="lancamentos">Lançamentos Reais</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4 pt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border mb-4">
              <CardTitle className="text-sm font-semibold">Resumo de Contas a Receber</CardTitle>
              <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                Total: {formatBRL(totalAReceber)}
              </Badge>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum recebimento pendente no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Cliente</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Já Pago</TableHead>
                        <TableHead className="text-right text-primary">Saldo a Receber</TableHead>
                        <TableHead className="text-center">Entrega Prevista</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map(e => (
                        <TableRow 
                          key={e.id} 
                          className="border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => window.location.href = `/orders?id=${e.id}`}
                        >
                          <TableCell className="font-medium">{e.cliente_nome}</TableCell>
                          <TableCell>{e.produto}</TableCell>
                          <TableCell className="text-right">{formatBRL(e.valor_total)}</TableCell>
                          <TableCell className="text-right text-emerald-400">{formatBRL(e.pago)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatBRL(e.saldo)}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-xs">
                            {e.data_entrega ? format(parseISO(e.data_entrega), "dd/MM/yyyy") : "Não definida"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo" className="space-y-4 pt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Evolução do Fluxo de Caixa (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                      formatter={(value: number) => [formatBRL(value), ""]}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="entradas" 
                      name="Entradas" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "#10b981" }} 
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saidas" 
                      name="Saídas" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "#ef4444" }} 
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      name="Saldo Líquido" 
                      stroke="#0ea5e9" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#0ea5e9" }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lancamentos" className="space-y-4 pt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border mb-4">
              <CardTitle className="text-sm font-semibold">Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map(t => (
                      <TableRow key={t.id} className="border-border hover:bg-muted/50 transition-colors">
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(t.transaction_date || t.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal border-border">
                            {CATEGORY_LABELS[t.category || ""] || t.category || "Outros"}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.type === 'inflow' ? '+' : '-'}{formatBRL(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum lançamento encontrado para o período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


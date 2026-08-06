import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, TrendingUp, DollarSign, Wallet } from "lucide-react";

interface Encomenda {
  id: string;
  cliente_nome: string;
  produto: string;
  valor_total: number;
  status: string;
  data_encomenda: string;
  created_at: string;
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
  category: string;
  created_at: string;
}

const formatBRL = (v: number) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancePage() {
  const { user } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month"); // total, month, year, custom

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [enc, pag, trans] = await Promise.all([
        supabase.from("encomendas").select("*").eq("user_id", user.id),
        supabase.from("encomenda_pagamentos").select("*").eq("user_id", user.id),
        supabase.from("cash_transactions").select("*").eq("user_id", user.id),
      ]);
      setEncomendas(enc.data || []);
      setPagamentos(pag.data || []);
      setTransactions(trans.data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const filterData = (items: any[]) => {
    if (period === "total") return items;
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (period === "month") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else {
      return items;
    }
    return items.filter(i => isWithinInterval(parseISO(i.created_at || i.data_pagamento), { start, end }));
  };

  const filteredEncomendas = filterData(encomendas);
  const filteredPagamentos = filterData(pagamentos);
  const filteredTransactions = filterData(transactions);

  const pendingOrders = filteredEncomendas.filter(e => {
    const total = Number(e.valor_total);
    const pago = filteredPagamentos.filter(p => p.encomenda_id === e.id).reduce((s, p) => s + Number(p.valor), 0);
    return pago < total;
  });

  const totalAReceber = pendingOrders.reduce((s, e) => {
    const total = Number(e.valor_total);
    const pago = filteredPagamentos.filter(p => p.encomenda_id === e.id).reduce((s, p) => s + Number(p.valor), 0);
    return s + (total - pago);
  }, 0);

  const totalInflows = filteredTransactions.filter(t => t.type === 'inflow').reduce((s, t) => s + Number(t.amount), 0);
  const totalOutflows = filteredTransactions.filter(t => t.type === 'outflow').reduce((s, t) => s + Number(t.amount), 0);
  const margemContribuicao = totalInflows > 0 ? ((totalInflows - totalOutflows) / totalInflows) * 100 : 0;

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão Financeira</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Total</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total a Receber</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatBRL(totalAReceber)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Margem de Contribuição</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{margemContribuicao.toFixed(1)}%</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Fluxo Líquido</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatBRL(totalInflows - totalOutflows)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Recebimentos Pendentes</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes">
          <Table>
            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Produto</TableHead><TableHead>Saldo a Receber</TableHead></TableRow></TableHeader>
            <TableBody>
              {pendingOrders.map(e => {
                const total = Number(e.valor_total);
                const pago = filteredPagamentos.filter(p => p.encomenda_id === e.id).reduce((s, p) => s + Number(p.valor), 0);
                return (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted" onClick={() => window.location.href = `/orders?id=${e.id}`}>
                    <TableCell>{e.cliente_nome}</TableCell>
                    <TableCell>{e.produto}</TableCell>
                    <TableCell>{formatBRL(total - pago)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="fluxo">
          <p>Fluxo de caixa detalhado em construção.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Search, Filter, ShoppingCart, Lock, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UpgradeModal from "@/components/UpgradeModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  orcamento_id?: string;
  notes?: string;
  created_at: string;
}

interface CashTransaction {
  id: string;
  type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

export default function SalesPage() {
  const { user, isPro } = useAuth();
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [saleForm, setSaleForm] = useState({
    customer_name: "",
    orcamento_id: "none",
    total_amount: 0,
    payment_method: "pix",
    notes: ""
  });

  const [transactionForm, setTransactionForm] = useState({
    type: "inflow" as "inflow" | "outflow",
    amount: 0,
    description: "",
    category: ""
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [salesRes, transRes, quotesRes] = await Promise.all([
      supabase.from("sales").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("cash_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orcamentos").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    ]);

    if (salesRes.data) setSales(salesRes.data as Sale[]);
    if (transRes.data) setTransactions(transRes.data as CashTransaction[]);
    if (quotesRes.data) {
      setQuotes(quotesRes.data);
      
      // Handle direct link from history
      const quoteIdFromUrl = searchParams.get("quoteId");
      if (quoteIdFromUrl && quotesRes.data.length > 0) {
        const found = quotesRes.data.find(q => q.id === quoteIdFromUrl);
        if (found) {
          setSaleForm({
            customer_name: "",
            orcamento_id: quoteIdFromUrl,
            total_amount: found.preco_sugerido,
            payment_method: "pix",
            notes: ""
          });
          setSaleDialogOpen(true);
        }
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (!isPro) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground">Gestão de Caixa</h1>
        <div className="relative">
          <div className="filter blur-sm pointer-events-none opacity-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Card key={i} className="h-32" />)}
            </div>
            <div className="mt-6 h-64 bg-card rounded-xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20 rounded-xl">
            <Lock size={40} className="text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Recurso exclusivo do Plano Pro e Anual</p>
            <p className="text-muted-foreground text-sm mb-4 text-center max-w-sm">
              Controle suas vendas, fluxo de caixa e tenha baixa automática no estoque ao realizar vendas.
            </p>
            <Button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground neon-glow">
               Fazer Upgrade agora
            </Button>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </div>
    );
  }

  const handleSaveSale = async () => {
    if (!user) return;
    if (saleForm.total_amount <= 0) {
      toast.error("O valor da venda deve ser maior que zero");
      return;
    }

    if (editingSale) {
      const { error: saleError } = await supabase
        .from("sales")
        .update({
          customer_name: saleForm.customer_name,
          total_amount: saleForm.total_amount,
          payment_method: saleForm.payment_method,
          orcamento_id: saleForm.orcamento_id === "none" ? null : saleForm.orcamento_id,
          notes: saleForm.notes,
        })
        .eq("id", editingSale.id);

      if (saleError) {
        toast.error("Erro ao atualizar venda");
        return;
      }

      // Update linked transaction if it exists
      await supabase
        .from("cash_transactions")
        .update({
          amount: saleForm.total_amount,
          description: `Venda para ${saleForm.customer_name || "Cliente"}`,
        })
        .eq("sale_id", editingSale.id);

      toast.success("Venda atualizada com sucesso!");
    } else {
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          customer_name: saleForm.customer_name,
          total_amount: saleForm.total_amount,
          payment_method: saleForm.payment_method,
          orcamento_id: saleForm.orcamento_id === "none" ? null : saleForm.orcamento_id,
          notes: saleForm.notes,
          status: 'completed'
        })
        .select()
        .single();

      if (saleError) {
        toast.error("Erro ao criar venda");
        return;
      }

      // Add to cash transactions
      await supabase.from("cash_transactions").insert({
        user_id: user.id,
        type: 'inflow',
        amount: saleForm.total_amount,
        description: `Venda para ${saleForm.customer_name || "Cliente"}`,
        category: 'venda',
        sale_id: sale.id
      });

      // Automatically manage inventory if orcamento is linked
      if (saleForm.orcamento_id !== "none") {
        const selectedQuote = quotes.find(q => q.id === saleForm.orcamento_id);
        if (selectedQuote && Array.isArray(selectedQuote.filamentos)) {
          for (const fil of selectedQuote.filamentos) {
            if (fil.id) {
              const { data: invItem } = await supabase
                .from("inventory")
                .select("quantity")
                .eq("id", fil.id)
                .single();

              if (invItem) {
                const newQty = Math.max(0, invItem.quantity - (Number(fil.weightUsed) || 0));
                await supabase
                  .from("inventory")
                  .update({ quantity: newQty })
                  .eq("id", fil.id);
              }
            }
          }
          toast.info("Estoque atualizado automaticamente!");
        }
      }
      toast.success("Venda registrada com sucesso!");
    }

    setSaleDialogOpen(false);
    setEditingSale(null);
    setSaleForm({ customer_name: "", orcamento_id: "none", total_amount: 0, payment_method: "pix", notes: "" });
    fetchData();
  };

  const handleSaveTransaction = async () => {
    if (!user) return;
    if (transactionForm.amount <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }

    if (!transactionForm.category) {
      toast.error("Por favor, selecione uma categoria");
      return;
    }

    if (editingTransaction) {
      const { error } = await supabase
        .from("cash_transactions")
        .update({
          type: transactionForm.type,
          amount: transactionForm.amount,
          description: transactionForm.description,
          category: transactionForm.category
        })
        .eq("id", editingTransaction.id);

      if (error) {
        toast.error("Erro ao atualizar transação");
        return;
      }
      toast.success("Transação atualizada!");
    } else {
      const { error } = await supabase.from("cash_transactions").insert({
        user_id: user.id,
        type: transactionForm.type,
        amount: transactionForm.amount,
        description: transactionForm.description,
        category: transactionForm.category
      });

      if (error) {
        toast.error("Erro ao registrar transação");
        return;
      }
      toast.success("Transação registrada!");
    }

    setTransactionDialogOpen(false);
    setEditingTransaction(null);
    setTransactionForm({ type: "inflow", amount: 0, description: "", category: "venda" });
    fetchData();
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta venda? As transações de caixa vinculadas também serão removidas.")) return;
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) toast.error("Erro ao remover venda");
    else {
      toast.success("Venda removida");
      fetchData();
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      customer_name: sale.customer_name || "",
      orcamento_id: sale.orcamento_id || "none",
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      notes: sale.notes || ""
    });
    setSaleDialogOpen(true);
  };

  const handleEditTransaction = (transaction: CashTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category
    });
    setTransactionDialogOpen(true);
  };

  const totalInflow = transactions.filter(t => t.type === 'inflow').reduce((acc, t) => acc + Number(t.amount), 0);
  
  // Categorize outflows
  const operationalCategories = ['despesa_fixa', 'despesa_variavel', 'retirada'];
  const investmentStockCategories = ['insumo_estoque', 'investimento_equipamento'];

  const totalOperationalOutflow = transactions
    .filter(t => t.type === 'outflow' && operationalCategories.includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalInvestmentStockOutflow = transactions
    .filter(t => t.type === 'outflow' && investmentStockCategories.includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalOutflow = totalOperationalOutflow + totalInvestmentStockOutflow + transactions
    .filter(t => t.type === 'outflow' && !operationalCategories.includes(t.category) && !investmentStockCategories.includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalInflow - totalOutflow;

  // Calculate item performance
  const itemPerformance = sales.reduce((acc: any, sale) => {
    const quote = quotes.find(q => q.id === sale.orcamento_id);
    const itemName = quote ? quote.nome_peca : (sale.notes || "Venda Direta");
    const cost = quote ? Number(quote.custo_total || 0) : 0;
    const profit = Number(sale.total_amount) - cost;

    if (!acc[itemName]) {
      acc[itemName] = {
        name: itemName,
        salesCount: 0,
        totalRevenue: 0,
        totalProfit: 0,
        description: quote ? `Orçamento: ${quote.nome_peca}` : sale.notes
      };
    }
    
    acc[itemName].salesCount += 1;
    acc[itemName].totalRevenue += Number(sale.total_amount);
    acc[itemName].totalProfit += profit;
    
    return acc;
  }, {});

  const performanceList = Object.values(itemPerformance).sort((a: any, b: any) => b.totalProfit - a.totalProfit);

  const filteredSales = sales.filter(s => 
    (s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Caixa</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle suas vendas e movimentações financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingTransaction(null); setTransactionForm({ type: "inflow", amount: 0, description: "", category: "venda" }); setTransactionDialogOpen(true); }} className="border-border">
            <ArrowDownLeft size={14} className="mr-1 text-destructive" /> Lançar Gasto
          </Button>
          <Button size="sm" onClick={() => { setEditingSale(null); setSaleForm({ customer_name: "", orcamento_id: "none", total_amount: 0, payment_method: "pix", notes: "" }); setSaleDialogOpen(true); }} className="bg-primary text-primary-foreground neon-glow">
            <ShoppingCart size={14} className="mr-1" /> Nova Venda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Saldo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              R$ {balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-500">
              R$ {totalInflow.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Saídas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase">Operacional</span>
              <span className="text-sm font-bold font-mono text-destructive">R$ {totalOperationalOutflow.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase">Estoque/Invest.</span>
              <span className="text-sm font-bold font-mono text-blue-500">R$ {totalInvestmentStockOutflow.toFixed(2)}</span>
            </div>
            <div className="pt-1 border-t border-border flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total</span>
              <span className="text-lg font-bold font-mono text-destructive">R$ {totalOutflow.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground uppercase flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary" /> Desempenho por Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-2 font-medium">Item / Descrição</th>
                      <th className="text-center pb-2 font-medium">Vendas</th>
                      <th className="text-right pb-2 font-medium">Receita</th>
                      <th className="text-right pb-2 font-medium">Lucro Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performanceList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">Nenhum dado disponível</td>
                      </tr>
                    ) : (
                      performanceList.map((item: any, i) => (
                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3">
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{item.description || "Sem descrição"}</div>
                          </td>
                          <td className="py-3 text-center">{item.salesCount}</td>
                          <td className="py-3 text-right font-mono text-foreground">R$ {item.totalRevenue.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono font-bold text-green-500">R$ {item.totalProfit.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Vendas Recentes</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Buscar por cliente..." 
                className="pl-9 bg-muted border-border" 
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredSales.length === 0 ? (
              <div className="py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <Wallet size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">Nenhuma venda registrada.</p>
              </div>
            ) : (
              filteredSales.map(sale => (
                <Card key={sale.id} className="border-border bg-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{sale.customer_name || "Cliente Final"}</p>
                          {sale.orcamento_id && (
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">
                              {quotes.find(q => q.id === sale.orcamento_id)?.nome_peca}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })} · {sale.payment_method.toUpperCase()}
                        </p>
                        {sale.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{sale.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold font-mono text-foreground text-lg">R$ {Number(sale.total_amount).toFixed(2)}</p>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase mb-1">{sale.status}</Badge>
                          {(() => {
                            const quote = quotes.find(q => q.id === sale.orcamento_id);
                            if (quote) {
                              const profit = Number(sale.total_amount) - Number(quote.custo_total || 0);
                              return (
                                <span className="text-[10px] font-bold text-green-500">
                                  Lucro: R$ {profit.toFixed(2)}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button onClick={() => handleEditSale(sale)} className="p-2 text-muted-foreground hover:text-primary">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-muted-foreground hover:text-destructive">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Outras Movimentações</h2>
          <div className="space-y-2">
            {transactions.filter(t => t.category !== 'venda').length === 0 ? (
              <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground text-sm">Nenhuma outra movimentação registrada.</p>
              </div>
            ) : (
              transactions.filter(t => t.category !== 'venda').map(transaction => (
                <Card key={transaction.id} className="border-border bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'inflow' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                          {transaction.type === 'inflow' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{transaction.description || "Sem descrição"}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`font-bold font-mono text-sm ${transaction.type === 'inflow' ? 'text-green-500' : 'text-destructive'}`}>
                          {transaction.type === 'inflow' ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
                        </p>
                        <div className="flex items-center">
                          <button onClick={() => handleEditTransaction(transaction)} className="p-1.5 text-muted-foreground hover:text-primary">
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm("Remover esta movimentação?")) {
                                await supabase.from("cash_transactions").delete().eq("id", transaction.id);
                                fetchData();
                              }
                            }} 
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex justify-end italic">
                      {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingSale ? "Editar Venda" : "Registrar Nova Venda"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Nome do Cliente</Label>
              <Input 
                id="customer" 
                value={saleForm.customer_name} 
                onChange={e => setSaleForm({...saleForm, customer_name: e.target.value})} 
                placeholder="Ex: João Silva" 
                className="bg-muted border-border" 
              />
            </div>
            <div className="grid gap-2">
              <Label>Vincular a um Orçamento</Label>
              <Select 
                value={saleForm.orcamento_id} 
                onValueChange={v => {
                  const q = quotes.find(q => q.id === v);
                  setSaleForm({
                    ...saleForm, 
                    orcamento_id: v,
                    total_amount: q ? q.preco_sugerido : saleForm.total_amount
                  });
                }}
              >
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum orçamento</SelectItem>
                  {quotes.map(q => (
                    <SelectItem key={q.id} value={q.id}>{q.nome_peca} (R$ {Number(q.preco_sugerido).toFixed(2)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Vincular um orçamento dará baixa automática no estoque dos filamentos usados.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor Total (R$)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={saleForm.total_amount} 
                  onChange={e => setSaleForm({...saleForm, total_amount: +e.target.value})} 
                  className="bg-muted border-border" 
                />
              </div>
              <div className="grid gap-2">
                <Label>Forma de Pagamento</Label>
                <Select value={saleForm.payment_method} onValueChange={v => setSaleForm({...saleForm, payment_method: v})}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Debito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas / Observações</Label>
              <Input 
                id="notes" 
                value={saleForm.notes} 
                onChange={e => setSaleForm({...saleForm, notes: e.target.value})} 
                className="bg-muted border-border" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaleDialogOpen(false); setEditingSale(null); }}>Cancelar</Button>
            <Button onClick={handleSaveSale} className="bg-primary text-primary-foreground">{editingSale ? "Salvar Alterações" : "Finalizar Venda"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTransaction ? "Editar Movimentação" : "Lançar Movimentação"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={transactionForm.type} onValueChange={(v: any) => setTransactionForm({...transactionForm, type: v})}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inflow">Entrada (+)</SelectItem>
                    <SelectItem value="outflow">Saída (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="t-amount">Valor (R$)</Label>
                <Input 
                  id="t-amount" 
                  type="number" 
                  value={transactionForm.amount} 
                  onChange={e => setTransactionForm({...transactionForm, amount: +e.target.value})} 
                  className="bg-muted border-border" 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input 
                id="desc" 
                value={transactionForm.description} 
                onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} 
                placeholder="Ex: Compra de carretel de filamento" 
                className="bg-muted border-border" 
              />
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={transactionForm.category} onValueChange={v => setTransactionForm({...transactionForm, category: v})}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="filamento">Filamento</SelectItem>
                  <SelectItem value="acessorios">Acessórios / Materiais</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="maquinario">Maquinário</SelectItem>
                  <SelectItem value="energia">Energia</SelectItem>
                  <SelectItem value="marketing">Marketing / Ads</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransactionDialogOpen(false); setEditingTransaction(null); }}>Cancelar</Button>
            <Button onClick={handleSaveTransaction} className="bg-primary text-primary-foreground">{editingTransaction ? "Salvar Alterações" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
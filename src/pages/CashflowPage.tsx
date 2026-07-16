import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft, Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface Tx {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  payment_method: string | null;
  transaction_date: string | null;
  encomenda_id: string | null;
  encomenda_pagamento_id: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "encomenda", label: "Encomenda" },
  { value: "venda", label: "Venda" },
  { value: "insumo_estoque", label: "Insumo / Estoque" },
  { value: "despesa_fixa", label: "Despesa fixa" },
  { value: "despesa_variavel", label: "Despesa variável" },
  { value: "investimento_equipamento", label: "Investimento / Equipamento" },
  { value: "retirada", label: "Retirada" },
  { value: "outros", label: "Outros" },
];

const FORMAS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
];

const emptyForm = {
  type: "inflow" as "inflow" | "outflow",
  amount: 0,
  description: "",
  category: "outros",
  payment_method: "pix",
  transaction_date: new Date().toISOString().slice(0, 10),
};

export default function CashflowPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("cash_transactions")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data || []) as Tx[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const dateOf = (t: Tx) => (t.transaction_date || t.created_at?.slice(0, 10) || "");

  const filtered = useMemo(() => {
    return rows.filter((t) => {
      if (typeFilter !== "todos" && t.type !== typeFilter) return false;
      const d = dateOf(t);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, typeFilter, from, to]);

  const summary = useMemo(() => {
    let entradas = 0, saidas = 0;
    for (const t of filtered) {
      if (t.type === "inflow") entradas += Number(t.amount || 0);
      else saidas += Number(t.amount || 0);
    }
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (t: Tx) => {
    if (t.encomenda_pagamento_id) {
      toast.info("Este lançamento vem de uma encomenda. Edite pelo módulo Encomendas.");
      return;
    }
    setEditing(t);
    setForm({
      type: (t.type as "inflow" | "outflow"),
      amount: Number(t.amount),
      description: t.description,
      category: t.category || "outros",
      payment_method: t.payment_method || "pix",
      transaction_date: t.transaction_date || new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.description.trim()) { toast.error("Informe a descrição"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Informe um valor válido"); return; }
    const payload = {
      type: form.type,
      amount: form.amount,
      description: form.description.trim(),
      category: form.category,
      payment_method: form.payment_method,
      transaction_date: form.transaction_date,
    };
    if (editing) {
      const { error } = await supabase.from("cash_transactions").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lançamento atualizado");
    } else {
      const { error } = await supabase.from("cash_transactions").insert({ ...payload, user_id: user.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Lançamento registrado");
    }
    setOpen(false);
    load();
  };

  const remove = async (t: Tx) => {
    if (t.encomenda_pagamento_id) {
      toast.info("Este lançamento vem de uma encomenda. Exclua o pagamento no módulo Encomendas.");
      return;
    }
    const { error } = await supabase.from("cash_transactions").delete().eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lançamento excluído");
    load();
  };

  const catLabel = (v: string | null) =>
    CATEGORIES.find((c) => c.value === v)?.label || v || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Caixa</h1>
          <p className="text-sm text-muted-foreground">Entradas, saídas e saldo do seu negócio</p>
        </div>
        <Button onClick={openNew} className="neon-glow"><Plus size={16} className="mr-2" /> Novo lançamento</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingUp size={16} /> Entradas</div>
            <p className="text-xl font-mono font-bold text-emerald-400">R$ {summary.entradas.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingDown size={16} /> Saídas</div>
            <p className="text-xl font-mono font-bold text-red-400">R$ {summary.saidas.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wallet size={16} /> Saldo</div>
            <p className={`text-xl font-mono font-bold ${summary.saldo >= 0 ? "text-primary" : "text-red-400"}`}>R$ {summary.saldo.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="inflow">Entradas</SelectItem>
              <SelectItem value="outflow">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={() => { setFrom(""); setTo(""); setTypeFilter("todos"); }}>Limpar filtros</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          Nenhum lançamento encontrado
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isIn = t.type === "inflow";
            const fromOrder = !!t.encomenda_pagamento_id;
            return (
              <Card key={t.id} className="glass">
                <CardContent className="py-3 flex items-center gap-3 flex-wrap">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isIn ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {isIn ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-medium">{t.description}</p>
                    <div className="flex gap-2 mt-1 flex-wrap items-center">
                      <Badge variant="outline" className="text-[10px]">{catLabel(t.category)}</Badge>
                      {t.payment_method && (
                        <Badge variant="outline" className="text-[10px]">
                          {FORMAS.find((f) => f.value === t.payment_method)?.label || t.payment_method}
                        </Badge>
                      )}
                      {fromOrder && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Origem: encomenda</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {dateOf(t) ? new Date(dateOf(t) + "T00:00:00").toLocaleDateString("pt-BR") : ""}
                      </span>
                    </div>
                  </div>
                  <p className={`font-mono font-bold ${isIn ? "text-emerald-400" : "text-red-400"}`}>
                    {isIn ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)} disabled={fromOrder}><Pencil size={12} /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(t)} disabled={fromOrder} className="text-red-400 hover:text-red-500"><Trash2 size={12} /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "inflow" | "outflow" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">Entrada</SelectItem>
                  <SelectItem value="outflow">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Compra de filamento PLA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forma</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

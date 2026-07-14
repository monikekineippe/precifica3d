import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, ArrowRight, XCircle, AlertTriangle, Package, DollarSign, Clock, CheckCircle2 } from "lucide-react";

type Status = "recebida" | "producao" | "pronto" | "entregue" | "cancelada";

interface Encomenda {
  id: string;
  user_id: string;
  codigo: string;
  cliente_nome: string;
  whatsapp: string | null;
  produto: string;
  quantidade: number;
  descricao: string | null;
  valor_total: number;
  sinal_recebido: boolean;
  sinal_valor: number;
  status: Status;
  data_encomenda: string;
  data_entrega: string | null;
  observacoes: string | null;
  inventory_item_id: string | null;
  estoque_deduzido: boolean;
}

interface InventoryItem { id: string; name: string; quantity: number; cost_per_unit: number | null; sale_price: number | null; }
interface QuoteItem { id: string; piece_name: string; suggested_price: number | null; }
interface CatalogOption {
  key: string;
  source: "inventory" | "quote";
  id: string;
  name: string;
  unitPrice: number;
  stock?: number;
}

const STATUS_LABEL: Record<Status, string> = {
  recebida: "Encomenda recebida",
  producao: "Em produção",
  pronto: "Pronto / Aguardando entrega",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<Status, string> = {
  recebida: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  producao: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pronto: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  entregue: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/30",
};

const NEXT: Partial<Record<Status, Status>> = {
  recebida: "producao",
  producao: "pronto",
  pronto: "entregue",
};

const emptyForm = {
  cliente_nome: "",
  whatsapp: "",
  produto: "",
  quantidade: 1,
  descricao: "",
  valor_total: 0,
  sinal_recebido: false,
  sinal_valor: 0,
  observacoes: "",
  inventory_item_id: "none",
  catalog_key: "custom" as string, // "custom" ou key do catálogo
  unit_price: 0,
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Encomenda[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quotesCatalog, setQuotesCatalog] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Encomenda | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Encomenda | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: enc }, { data: inv }, { data: qts }] = await Promise.all([
      (supabase.from("encomendas" as any) as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("inventory").select("id, name, quantity, cost_per_unit, sale_price, category").eq("user_id", user.id).eq("category", "finished_product"),
      supabase.from("quotes").select("id, piece_name, suggested_price").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setRows((enc || []) as Encomenda[]);
    setInventory((inv || []) as InventoryItem[]);
    setQuotesCatalog((qts || []) as QuoteItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "todos" && r.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.cliente_nome.toLowerCase().includes(s) && !r.produto.toLowerCase().includes(s) && !r.codigo.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const ativos = rows.filter((r) => r.status !== "cancelada");
    const receitaEsperada = ativos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
    const recebido = ativos.reduce((s, r) => s + (r.sinal_recebido ? Number(r.sinal_valor || 0) : 0), 0);
    const entregues = rows.filter((r) => r.status === "entregue");
    const entreguesPagos = entregues.reduce((s, r) => s + Number(r.valor_total || 0), 0);
    return {
      receitaEsperada,
      recebido,
      aReceber: receitaEsperada - recebido,
      entreguesPagos,
    };
  }, [rows]);

  const catalog = useMemo<CatalogOption[]>(() => {
    // Mapa de preço de venda (suggested_price) por nome, vindo da precificação
    const priceByName = new Map<string, number>();
    for (const q of quotesCatalog) {
      const key = q.piece_name.toLowerCase();
      const price = Number(q.suggested_price || 0);
      // Mantém o preço mais recente (quotes já vem ordenado desc por created_at)
      if (!priceByName.has(key)) priceByName.set(key, price);
    }
    const invOpts: CatalogOption[] = inventory.map((i) => ({
      key: `inv:${i.id}`,
      source: "inventory",
      id: i.id,
      name: i.name,
      // Preço de VENDA (nunca custo). Busca na precificação pelo nome.
      unitPrice: priceByName.get(i.name.toLowerCase()) ?? 0,
      stock: Number(i.quantity),
    }));
    const qOpts: CatalogOption[] = quotesCatalog.map((q) => ({
      key: `qte:${q.id}`,
      source: "quote",
      id: q.id,
      name: q.piece_name,
      unitPrice: Number(q.suggested_price || 0),
    }));
    // Dedup por nome (prefere inventory)
    const seen = new Set(invOpts.map((o) => o.name.toLowerCase()));
    const merged = [...invOpts, ...qOpts.filter((o) => !seen.has(o.name.toLowerCase()))];
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, quotesCatalog]);

  const handleCatalogChange = (key: string) => {
    if (key === "custom") {
      setForm((f) => ({ ...f, catalog_key: "custom", produto: "", unit_price: 0, valor_total: 0, inventory_item_id: "none" }));
      return;
    }
    const opt = catalog.find((c) => c.key === key);
    if (!opt) return;
    const qty = Number(form.quantidade) || 1;
    setForm((f) => ({
      ...f,
      catalog_key: key,
      produto: opt.name,
      unit_price: opt.unitPrice,
      valor_total: Number((opt.unitPrice * qty).toFixed(2)),
      inventory_item_id: opt.source === "inventory" ? opt.id : "none",
    }));
  };

  const handleQtyChange = (n: number) => {
    setForm((f) => {
      const qty = Number.isFinite(n) && n > 0 ? n : 1;
      const isCatalog = f.catalog_key !== "custom";
      return {
        ...f,
        quantidade: qty,
        valor_total: isCatalog ? Number((f.unit_price * qty).toFixed(2)) : f.valor_total,
      };
    });
  };


  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (r: Encomenda) => {
    setEditing(r);
    setForm({
      cliente_nome: r.cliente_nome,
      whatsapp: r.whatsapp || "",
      produto: r.produto,
      quantidade: r.quantidade,
      descricao: r.descricao || "",
      valor_total: Number(r.valor_total),
      sinal_recebido: r.sinal_recebido,
      sinal_valor: Number(r.sinal_valor),
      observacoes: r.observacoes || "",
      inventory_item_id: r.inventory_item_id || "none",
      catalog_key: r.inventory_item_id ? `inv:${r.inventory_item_id}` : "custom",
      unit_price: r.quantidade > 0 ? Number(r.valor_total) / r.quantidade : 0,
    });
    setOpen(true);
  };

  const generateCodigo = async () => {
    const { count } = await (supabase.from("encomendas" as any) as any)
      .select("id", { count: "exact", head: true }).eq("user_id", user!.id);
    const n = (count || 0) + 1;
    return `NX${String(n).padStart(3, "0")}`;
  };

  const save = async () => {
    if (!user) return;
    if (!form.cliente_nome.trim() || !form.produto.trim()) {
      toast.error("Preencha cliente e produto");
      return;
    }
    const payload = {
      cliente_nome: form.cliente_nome.trim(),
      whatsapp: form.whatsapp.trim() || null,
      produto: form.produto.trim(),
      quantidade: Number(form.quantidade) || 1,
      descricao: form.descricao.trim() || null,
      valor_total: Number(form.valor_total) || 0,
      sinal_recebido: form.sinal_recebido,
      sinal_valor: form.sinal_recebido ? Number(form.sinal_valor) || 0 : 0,
      observacoes: form.observacoes.trim() || null,
      inventory_item_id: form.inventory_item_id === "none" ? null : form.inventory_item_id,
    };
    if (editing) {
      const { error } = await (supabase.from("encomendas" as any) as any)
        .update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Encomenda atualizada");
    } else {
      const codigo = await generateCodigo();
      const { error } = await (supabase.from("encomendas" as any) as any)
        .insert({ ...payload, codigo, user_id: user.id, status: "recebida" });
      if (error) { toast.error(error.message); return; }
      toast.success(`Encomenda ${codigo} criada`);
    }
    setOpen(false);
    load();
  };

  const advance = async (r: Encomenda) => {
    const next = NEXT[r.status];
    if (!next) return;
    const update: Record<string, unknown> = { status: next };
    if (next === "entregue") {
      update.data_entrega = new Date().toISOString();
      // Deduzir do estoque se vinculado
      if (r.inventory_item_id && !r.estoque_deduzido) {
        const item = inventory.find((i) => i.id === r.inventory_item_id);
        if (item) {
          const novaQtd = Math.max(0, Number(item.quantity) - Number(r.quantidade));
          const { error: invErr } = await supabase.from("inventory")
            .update({ quantity: novaQtd }).eq("id", item.id);
          if (!invErr) update.estoque_deduzido = true;
        }
      }
    }
    const { error } = await (supabase.from("encomendas" as any) as any)
      .update(update).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status: ${STATUS_LABEL[next]}`);
    load();
  };

  const cancel = async (r: Encomenda) => {
    const { error } = await (supabase.from("encomendas" as any) as any)
      .update({ status: "cancelada" }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido cancelado");
    load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const { error } = await (supabase.from("encomendas" as any) as any)
      .delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Encomenda excluída");
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Encomendas</h1>
          <p className="text-sm text-muted-foreground">Gestão de pedidos dos seus clientes</p>
        </div>
        <Button onClick={openNew} className="neon-glow"><Plus size={16} className="mr-2" /> Nova encomenda</Button>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={<DollarSign size={16} />} label="Receita esperada" value={summary.receitaEsperada} color="text-primary" />
        <SummaryCard icon={<CheckCircle2 size={16} />} label="Já recebido" value={summary.recebido} color="text-emerald-400" />
        <SummaryCard icon={<Clock size={16} />} label="A receber" value={summary.aReceber} color="text-amber-400" />
        <SummaryCard icon={<Package size={16} />} label="Entregue e pago" value={summary.entreguesPagos} color="text-blue-400" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, produto ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="producao">Em produção</SelectItem>
            <SelectItem value="pronto">Pronto</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          Nenhuma encomenda encontrada
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const falta = Number(r.valor_total) - (r.sinal_recebido ? Number(r.sinal_valor) : 0);
            const pendente = falta > 0 && r.status !== "cancelada";
            return (
              <Card key={r.id} className="glass">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{r.cliente_nome}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{r.codigo}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{r.produto} {r.quantidade > 1 && <span className="text-muted-foreground">× {r.quantidade}</span>}</p>
                    {r.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{r.descricao}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-mono font-semibold">R$ {Number(r.valor_total).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sinal</p>
                      <p className="font-mono">R$ {r.sinal_recebido ? Number(r.sinal_valor).toFixed(2) : "0,00"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Falta</p>
                      <p className={`font-mono font-semibold ${pendente ? "text-amber-400" : "text-emerald-400"}`}>R$ {falta.toFixed(2)}</p>
                    </div>
                  </div>
                  {pendente && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      <AlertTriangle size={12} /> Valor pendente
                    </div>
                  )}
                  {r.whatsapp && <p className="text-xs text-muted-foreground">📱 {r.whatsapp}</p>}
                  {r.data_entrega && <p className="text-xs text-emerald-400">Entregue em {new Date(r.data_entrega).toLocaleDateString("pt-BR")}</p>}
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                    {NEXT[r.status] && (
                      <Button size="sm" onClick={() => advance(r)} className="flex-1">
                        <ArrowRight size={14} className="mr-1" /> {STATUS_LABEL[NEXT[r.status]!]}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                    {r.status !== "cancelada" && r.status !== "entregue" && (
                      <Button size="sm" variant="outline" onClick={() => cancel(r)} className="text-red-400 hover:text-red-500">
                        <XCircle size={14} />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setDeleteTarget(r)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar encomenda" : "Nova encomenda"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente *</Label>
                <Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp / contato</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Produto *</Label>
              <Select value={form.catalog_key} onValueChange={handleCatalogChange}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                <SelectContent>
                  {catalog.length > 0 && (
                    <>
                      {catalog.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.name}
                          {opt.source === "inventory" && typeof opt.stock === "number" ? ` — estoque: ${opt.stock}` : ""}
                          {opt.unitPrice > 0 ? ` — R$ ${opt.unitPrice.toFixed(2)}` : ""}
                        </SelectItem>
                      ))}
                      <div className="h-px bg-border my-1" />
                    </>
                  )}
                  <SelectItem value="custom" className="text-primary font-medium">+ Personalizado / novo produto</SelectItem>
                </SelectContent>
              </Select>
              {form.catalog_key !== "custom" && form.inventory_item_id !== "none" && (
                <p className="text-xs text-muted-foreground mt-1">Vinculado ao estoque — a quantidade será deduzida ao marcar "Entregue".</p>
              )}
            </div>
            {form.catalog_key === "custom" && (
              <div>
                <Label>Nome do produto *</Label>
                <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Ex.: Chaveiro personalizado" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantidade} onChange={(e) => handleQtyChange(Number(e.target.value))} />
              </div>
              {form.catalog_key !== "custom" && (
                <div>
                  <Label>Valor unitário (R$)</Label>
                  <Input type="number" step="0.01" value={form.unit_price} onChange={(e) => {
                    const up = Number(e.target.value) || 0;
                    setForm((f) => ({ ...f, unit_price: up, valor_total: Number((up * (Number(f.quantidade) || 1)).toFixed(2)) }));
                  }} />
                </div>
              )}
            </div>
            <div>
              <Label>Descrição / personalização</Label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Valor total (R$)</Label>
                <Input type="number" step="0.01" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Recebeu sinal?</Label>
                <Select value={form.sinal_recebido ? "sim" : "nao"} onValueChange={(v) => setForm({ ...form, sinal_recebido: v === "sim" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor do sinal (R$)</Label>
                <Input type="number" step="0.01" disabled={!form.sinal_recebido} value={form.sinal_valor} onChange={(e) => setForm({ ...form, sinal_valor: Number(e.target.value) })} />
              </div>
            </div>
            {form.sinal_recebido && form.valor_total > 0 && (
              <div className="text-sm bg-muted/50 rounded px-3 py-2">
                Falta receber: <span className="font-mono font-semibold text-amber-400">R$ {(Number(form.valor_total) - Number(form.sinal_valor)).toFixed(2)}</span>
              </div>
            )}
            <div>
              <Label>Observações internas</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Criar encomenda"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir encomenda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Encomenda {deleteTarget?.codigo} - {deleteTarget?.cliente_nome}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="glass">
      <CardContent className="pt-4">
        <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-1`}>{icon} {label}</div>
        <p className={`text-xl font-mono font-bold ${color}`}>R$ {value.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
}

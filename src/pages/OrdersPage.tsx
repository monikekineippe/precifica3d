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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, ArrowRight, XCircle, AlertTriangle, Package, DollarSign, Clock, CheckCircle2, Wallet, ChevronsUpDown, Check, UserPlus, Truck, RefreshCcw, CreditCard } from "lucide-react";

type Status = "recebida" | "producao" | "pronto" | "entregue" | "cancelada";
type FinStatus = "aberto" | "parcial" | "parcelado" | "quitado" | "reembolsado";

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
  origem: string | null;
  origem_outro: string | null;
  client_id: string | null;
  shipping_method: string | null;
  tracking_code: string | null;
  installments: number;
  is_refunded: boolean;
}

const digitsOnly = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

async function upsertClientForEncomenda(
  userId: string,
  nome: string,
  whatsapp: string | null,
  existingClientId: string | null,
): Promise<string | null> {
  const nomeTrim = nome.trim();
  if (!nomeTrim) return existingClientId;
  const waDigits = digitsOnly(whatsapp);

  // Se a encomenda já tem client_id, mantém como fonte de verdade e atualiza o cadastro
  if (existingClientId) {
    await supabase
      .from("clients")
      .update({ name: nomeTrim, whatsapp: whatsapp?.trim() || null })
      .eq("id", existingClientId)
      .eq("user_id", userId);
    return existingClientId;
  }

  // Deduplicação: busca por telefone (dígitos) ou nome
  const { data: candidates } = await supabase
    .from("clients")
    .select("id, name, whatsapp")
    .eq("user_id", userId);

  let match = null as null | { id: string };
  if (waDigits) {
    match = (candidates || []).find(c => digitsOnly(c.whatsapp) && digitsOnly(c.whatsapp) === waDigits) || null;
  }
  if (!match) {
    const nomeLower = nomeTrim.toLowerCase();
    match = (candidates || []).find(c => (c.name || "").trim().toLowerCase() === nomeLower) || null;
  }

  if (match) {
    // Atualiza dados do cliente existente com o que veio da encomenda
    await supabase
      .from("clients")
      .update({ name: nomeTrim, whatsapp: whatsapp?.trim() || null })
      .eq("id", match.id)
      .eq("user_id", userId);
    return match.id;
  }

  const { data: created, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      name: nomeTrim,
      whatsapp: whatsapp?.trim() || null,
      preferred_channel: "whatsapp",
    })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id;
}


const ORIGEM_OPTIONS = [
  { value: "indicacao", label: "Indicação" },
  { value: "amigos_familiares", label: "Amigos/Familiares" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "site", label: "Site" },
  { value: "feira_eventos", label: "Feira e Eventos" },
  { value: "outros", label: "Outros" },
];
const ORIGEM_LABEL = Object.fromEntries(ORIGEM_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>;
function formatOrigem(r: { origem: string | null; origem_outro: string | null }) {
  if (!r.origem) return "Não informado";
  if (r.origem === "outros") return r.origem_outro?.trim() ? `Outros: ${r.origem_outro.trim()}` : "Outros";
  return ORIGEM_LABEL[r.origem] || "Não informado";
}

interface Pagamento {
  id: string;
  encomenda_id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacao: string | null;
  cash_transaction_id: string | null;
}

interface InventoryItem { id: string; name: string; quantity: number; cost_per_unit: number | null; sale_price: number | null; }
interface QuoteItem { id: string; piece_name: string; suggested_price: number | null; }
interface OrcamentoItem { id: string; nome_peca: string; preco_sugerido: number | null; }
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

const FIN_LABEL: Record<FinStatus, string> = {
  aberto: "Em aberto",
  parcial: "Parcial",
  parcelado: "Parcelado",
  quitado: "Quitado",
  reembolsado: "Reembolsado",
};

const FIN_COLOR: Record<FinStatus, string> = {
  aberto: "bg-red-500/15 text-red-400 border-red-500/30",
  parcial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  parcelado: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  quitado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  reembolsado: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const FORMAS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
];

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
  catalog_key: "custom" as string,
  unit_price: 0,
  origem: "",
  origem_outro: "",
  client_id: "" as string,
  shipping_method: "" as string,
  tracking_code: "" as string,
  installments: 1,
};

interface ClientRow { id: string; name: string; whatsapp: string | null; preferred_channel: string | null; notes: string | null; }

function computeFinStatus(row: Encomenda, pago: number): FinStatus {
  if (row.is_refunded) return "reembolsado";
  if (pago + 0.001 >= row.valor_total && row.valor_total > 0) return "quitado";
  if (row.installments > 1) return "parcelado";
  if (pago <= 0) return "aberto";
  return "parcial";
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Encomenda[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quotesCatalog, setQuotesCatalog] = useState<QuoteItem[]>([]);
  const [orcamentosCatalog, setOrcamentosCatalog] = useState<OrcamentoItem[]>([]);
  const [clientsList, setClientsList] = useState<ClientRow[]>([]);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Encomenda | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Encomenda | null>(null);
  const [paymentsTarget, setPaymentsTarget] = useState<Encomenda | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: enc }, { data: pags }, { data: inv }, { data: qts }, { data: orcs }, { data: cli }] = await Promise.all([
      supabase.from("encomendas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("encomenda_pagamentos").select("*").eq("user_id", user.id).order("data_pagamento", { ascending: true }),
      supabase.from("inventory").select("id, name, quantity, cost_per_unit, sale_price, category").eq("user_id", user.id).eq("category", "finished_product"),
      supabase.from("quotes").select("id, piece_name, suggested_price").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orcamentos").select("id, nome_peca, preco_sugerido").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, whatsapp, preferred_channel, notes").eq("user_id", user.id).order("name"),
    ]);
    setRows((enc || []) as Encomenda[]);
    setPagamentos((pags || []) as Pagamento[]);
    setInventory((inv || []) as InventoryItem[]);
    setQuotesCatalog((qts || []) as QuoteItem[]);
    setOrcamentosCatalog((orcs || []) as OrcamentoItem[]);
    setClientsList((cli || []) as ClientRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const pagosByEnc = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pagamentos) {
      m.set(p.encomenda_id, (m.get(p.encomenda_id) || 0) + Number(p.valor || 0));
    }
    return m;
  }, [pagamentos]);

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
    
    const stats: Record<FinStatus, { count: number; total: number }> = {
      aberto: { count: 0, total: 0 },
      parcial: { count: 0, total: 0 },
      parcelado: { count: 0, total: 0 },
      quitado: { count: 0, total: 0 },
      reembolsado: { count: 0, total: 0 },
    };

    ativos.forEach(r => {
      const pago = pagosByEnc.get(r.id) || 0;
      const fin = computeFinStatus(r, pago);
      stats[fin].count += 1;
      stats[fin].total += Number(r.valor_total || 0);
    });

    return stats;
  }, [rows, pagosByEnc]);

  const catalog = useMemo<CatalogOption[]>(() => {
    const priceByName = new Map<string, number>();
    for (const q of quotesCatalog) {
      const key = q.piece_name.toLowerCase();
      const price = Number(q.suggested_price || 0);
      if (price > 0 && !priceByName.has(key)) priceByName.set(key, price);
    }
    for (const o of orcamentosCatalog) {
      const key = (o.nome_peca || "").toLowerCase();
      const price = Number(o.preco_sugerido || 0);
      if (price > 0 && !priceByName.has(key)) priceByName.set(key, price);
    }
    const invOpts: CatalogOption[] = inventory.map((i) => ({
      key: `inv:${i.id}`,
      source: "inventory",
      id: i.id,
      name: i.name,
      unitPrice: Number(i.sale_price || 0) > 0
        ? Number(i.sale_price)
        : (priceByName.get(i.name.toLowerCase()) ?? 0),
      stock: Number(i.quantity),
    }));
    const qOpts: CatalogOption[] = quotesCatalog.map((q) => ({
      key: `qte:${q.id}`,
      source: "quote",
      id: q.id,
      name: q.piece_name,
      unitPrice: Number(q.suggested_price || 0),
    }));
    const oOpts: CatalogOption[] = orcamentosCatalog.map((o) => ({
      key: `orc:${o.id}`,
      source: "quote",
      id: o.id,
      name: o.nome_peca,
      unitPrice: Number(o.preco_sugerido || 0),
    }));
    const seen = new Set(invOpts.map((o) => o.name.toLowerCase()));
    const extras = [...qOpts, ...oOpts].filter((o) => {
      const k = (o.name || "").toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return [...invOpts, ...extras].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, quotesCatalog, orcamentosCatalog]);

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
      origem: r.origem || "",
      origem_outro: r.origem_outro || "",
      client_id: r.client_id || "",
      shipping_method: r.shipping_method || "",
      tracking_code: r.tracking_code || "",
      installments: r.installments || 1,
    });
    setOpen(true);
  };

  const generateCodigo = async () => {
    const { count } = await supabase.from("encomendas")
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
    const clienteNome = form.cliente_nome.trim();
    const whatsappVal = form.whatsapp.trim() || null;

    // Upsert cliente no painel de Clientes (dedup por whatsapp ou nome)
    const clientId = await upsertClientForEncomenda(
      user.id,
      clienteNome,
      whatsappVal,
      form.client_id || editing?.client_id || null,
    );

    const payload = {
      cliente_nome: clienteNome,
      whatsapp: whatsappVal,
      produto: form.produto.trim(),
      quantidade: Number(form.quantidade) || 1,
      descricao: form.descricao.trim() || null,
      valor_total: Number(form.valor_total) || 0,
      sinal_recebido: form.sinal_recebido,
      sinal_valor: form.sinal_recebido ? Number(form.sinal_valor) || 0 : 0,
      observacoes: form.observacoes.trim() || null,
      inventory_item_id: form.inventory_item_id === "none" ? null : form.inventory_item_id,
      origem: form.origem || null,
      origem_outro: form.origem === "outros" ? (form.origem_outro.trim() || null) : null,
      client_id: clientId,
    };
    if (editing) {
      const { error } = await supabase.from("encomendas").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Encomenda atualizada");
    } else {
      const codigo = await generateCodigo();
      const { error } = await supabase.from("encomendas")
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
    const update: { status: Status; data_entrega?: string; estoque_deduzido?: boolean } = { status: next };
    if (next === "entregue") {
      update.data_entrega = new Date().toISOString();
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
    const { error } = await supabase.from("encomendas").update(update).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status: ${STATUS_LABEL[next]}`);
    load();
  };

  const cancel = async (r: Encomenda) => {
    const { error } = await supabase.from("encomendas").update({ status: "cancelada" }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido cancelado");
    load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    // Cascade FK removes pagamentos e cash_transactions vinculadas
    const { error } = await supabase.from("encomendas").delete().eq("id", deleteTarget.id);
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

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard icon={<Clock size={16} />} label="Em aberto" value={summary.aberto.total} count={summary.aberto.count} color="text-red-400" />
        <SummaryCard icon={<AlertTriangle size={16} />} label="Parcial" value={summary.parcial.total} count={summary.parcial.count} color="text-amber-400" />
        <SummaryCard icon={<CreditCard size={16} />} label="Parcelado" value={summary.parcelado.total} count={summary.parcelado.count} color="text-blue-400" />
        <SummaryCard icon={<CheckCircle2 size={16} />} label="Quitado" value={summary.quitado.total} count={summary.quitado.count} color="text-emerald-400" />
        <SummaryCard icon={<RefreshCcw size={16} />} label="Reembolsado" value={summary.reembolsado.total} count={summary.reembolsado.count} color="text-gray-400" />
      </div>

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

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          Nenhuma encomenda encontrada
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const total = Number(r.valor_total);
            const pago = pagosByEnc.get(r.id) || 0;
            const saldo = Math.max(0, total - pago);
            const fin = computeFinStatus(total, pago);
            return (
              <Card key={r.id} className="glass">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{r.cliente_nome}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{r.codigo}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      {r.status !== "cancelada" && (
                        <Badge variant="outline" className={FIN_COLOR[fin]}>{FIN_LABEL[fin]}</Badge>
                      )}
                    </div>
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
                      <p className="font-mono font-semibold">R$ {total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pago</p>
                      <p className="font-mono text-emerald-400">R$ {pago.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className={`font-mono font-semibold ${saldo > 0 ? "text-amber-400" : "text-emerald-400"}`}>R$ {saldo.toFixed(2)}</p>
                    </div>
                  </div>
                  {saldo > 0 && r.status !== "cancelada" && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      <AlertTriangle size={12} /> Valor pendente
                    </div>
                  )}
                  {r.whatsapp && <p className="text-xs text-muted-foreground">📱 {r.whatsapp}</p>}
                  <p className="text-xs text-muted-foreground">Origem: {formatOrigem(r)}</p>
                  {r.data_entrega && <p className="text-xs text-emerald-400">Entregue em {new Date(r.data_entrega).toLocaleDateString("pt-BR")}</p>}
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => setPaymentsTarget(r)} className="flex-1">
                      <Wallet size={14} className="mr-1" /> Pagamentos
                    </Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar encomenda" : "Nova encomenda"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Selecionar cliente existente</Label>
                {form.client_id && (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
                    onClick={() => setForm({ ...form, client_id: "", cliente_nome: "", whatsapp: "" })}
                  >
                    <UserPlus size={12} /> Cadastrar novo cliente
                  </button>
                )}
              </div>
              <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {form.client_id
                      ? (clientsList.find(c => c.id === form.client_id)?.name || "Cliente selecionado")
                      : "Buscar por nome ou WhatsApp..."}
                    <ChevronsUpDown size={14} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      const c = clientsList.find(x => x.id === value);
                      if (!c) return 0;
                      const q = search.toLowerCase();
                      const hay = `${c.name} ${c.whatsapp || ""}`.toLowerCase();
                      return hay.includes(q) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Nome ou WhatsApp..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado. Preencha os campos abaixo para cadastrar.</CommandEmpty>
                      <CommandGroup>
                        {clientsList.map(c => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setForm(f => ({
                                ...f,
                                client_id: c.id,
                                cliente_nome: c.name,
                                whatsapp: c.whatsapp || "",
                                observacoes: f.observacoes || c.notes || "",
                              }));
                              setClientPickerOpen(false);
                            }}
                          >
                            <Check size={14} className={`mr-2 ${form.client_id === c.id ? "opacity-100" : "opacity-0"}`} />
                            <div className="flex flex-col">
                              <span className="text-sm">{c.name}</span>
                              {c.whatsapp && <span className="text-[11px] text-muted-foreground">{c.whatsapp}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[11px] text-muted-foreground">
                {form.client_id
                  ? "Cliente vinculado. Você ainda pode ajustar os campos abaixo."
                  : "Não encontrou? Preencha os campos abaixo e o cliente será cadastrado automaticamente."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente *</Label>
                <Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value, client_id: form.client_id })} />
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
                          {opt.source === "inventory" && typeof opt.stock === "number" ? `, estoque: ${opt.stock}` : ""}
                          {opt.unitPrice > 0 ? `, R$ ${opt.unitPrice.toFixed(2)}` : ""}
                        </SelectItem>
                      ))}
                      <div className="h-px bg-border my-1" />
                    </>
                  )}
                  <SelectItem value="custom" className="text-primary font-medium">+ Personalizado / novo produto</SelectItem>
                </SelectContent>
              </Select>
              {form.catalog_key !== "custom" && form.inventory_item_id !== "none" && (
                <p className="text-xs text-muted-foreground mt-1">Vinculado ao estoque, a quantidade será deduzida ao marcar "Entregue".</p>
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
            <div>
              <Label>Valor total (R$)</Label>
              <Input type="number" step="0.01" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })} />
            </div>
            <p className="text-xs text-muted-foreground">Para registrar pagamentos parciais, use o botão "Pagamentos" na encomenda depois de salvar.</p>
            <div>
              <Label>Observações internas</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origem da encomenda</Label>
                <Select
                  value={form.origem || "__none"}
                  onValueChange={(v) => setForm({ ...form, origem: v === "__none" ? "" : v, origem_outro: v === "outros" ? form.origem_outro : "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Não informado</SelectItem>
                    {ORIGEM_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.origem === "outros" && (
                <div>
                  <Label>Especifique a origem</Label>
                  <Input value={form.origem_outro} onChange={(e) => setForm({ ...form, origem_outro: e.target.value })} placeholder="Ex.: WhatsApp, Marketplace" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Criar encomenda"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {paymentsTarget && (
        <PaymentsDialog
          encomenda={paymentsTarget}
          onClose={() => setPaymentsTarget(null)}
          onChanged={load}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir encomenda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Encomenda {deleteTarget?.codigo}, {deleteTarget?.cliente_nome}. Todos os pagamentos e lançamentos de caixa vinculados serão removidos.
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

function PaymentsDialog({ encomenda, onClose, onChanged }: { encomenda: Encomenda; onClose: () => void; onChanged: () => void; }) {
  const { user } = useAuth();
  const [list, setList] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [valor, setValor] = useState<number>(0);
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState<string>("pix");
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data: pags } = await supabase.from("encomenda_pagamentos")
      .select("*").eq("encomenda_id", encomenda.id).order("data_pagamento", { ascending: true });
    setList((pags || []) as Pagamento[]);
    setLoading(false);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [encomenda.id]);

  const total = Number(encomenda.valor_total);
  const pago = list.reduce((s, p) => s + Number(p.valor || 0), 0);
  const saldo = Math.max(0, total - pago);
  const fin = computeFinStatus(total, pago);

  const resetForm = () => {
    setValor(0);
    setData(new Date().toISOString().slice(0, 10));
    setForma("pix");
    setEditingId(null);
  };

  const cashDescription = () =>
    `Encomenda ${encomenda.codigo}, ${encomenda.cliente_nome}`;

  const savePayment = async () => {
    if (!user) return;
    if (!valor || valor <= 0) { toast.error("Informe um valor válido"); return; }

    if (editingId) {
      const current = list.find((p) => p.id === editingId);
      const { error } = await supabase.from("encomenda_pagamentos")
        .update({ valor, data_pagamento: data, forma_pagamento: forma })
        .eq("id", editingId);
      if (error) { toast.error(error.message); return; }

      if (current?.cash_transaction_id) {
        await supabase.from("cash_transactions").update({
          amount: valor,
          transaction_date: data,
          payment_method: forma,
          description: cashDescription(),
        }).eq("id", current.cash_transaction_id);
      }
      toast.success("Pagamento atualizado");
    } else {
      const { data: inserted, error } = await supabase.from("encomenda_pagamentos")
        .insert({
          user_id: user.id,
          encomenda_id: encomenda.id,
          valor,
          data_pagamento: data,
          forma_pagamento: forma,
        })
        .select("id")
        .single();
      if (error || !inserted) { toast.error(error?.message || "Erro"); return; }

      const { data: cash, error: cashErr } = await supabase.from("cash_transactions").insert({
        user_id: user.id,
        type: "inflow",
        amount: valor,
        description: cashDescription(),
        category: "encomenda",
        payment_method: forma,
        transaction_date: data,
        encomenda_id: encomenda.id,
        encomenda_pagamento_id: inserted.id,
      }).select("id").single();

      if (!cashErr && cash) {
        await supabase.from("encomenda_pagamentos")
          .update({ cash_transaction_id: cash.id })
          .eq("id", inserted.id);
      }
      toast.success("Pagamento registrado");
    }
    resetForm();
    await reload();
    onChanged();
  };

  const startEdit = (p: Pagamento) => {
    setEditingId(p.id);
    setValor(Number(p.valor));
    setData(p.data_pagamento);
    setForma(p.forma_pagamento);
  };

  const remove = async (p: Pagamento) => {
    // cash_transactions cascadeia via FK
    const { error } = await supabase.from("encomenda_pagamentos").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pagamento excluído");
    if (editingId === p.id) resetForm();
    await reload();
    onChanged();
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamentos, {encomenda.codigo} <span className="text-muted-foreground font-normal">, {encomenda.cliente_nome}</span></DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-muted/40 rounded p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-mono font-bold">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-mono font-bold text-emerald-400">R$ {pago.toFixed(2)}</p>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-mono font-bold ${saldo > 0 ? "text-amber-400" : "text-emerald-400"}`}>R$ {saldo.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status financeiro:</span>
          <Badge variant="outline" className={FIN_COLOR[fin]}>{FIN_LABEL[fin]}</Badge>
        </div>

        <div className="border border-border rounded-lg p-3 space-y-3">
          <p className="text-sm font-semibold">{editingId ? "Editar pagamento" : "Registrar pagamento"}</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label>Forma</Label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={savePayment} className="flex-1">
              {editingId ? "Salvar alterações" : "Registrar pagamento"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            )}
            {!editingId && saldo > 0 && (
              <Button variant="outline" onClick={() => setValor(Number(saldo.toFixed(2)))}>Usar saldo</Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Histórico</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-2">
              {list.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-muted/30 rounded p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-emerald-400">R$ {Number(p.valor).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.data_pagamento + "T00:00:00").toLocaleDateString("pt-BR")} · {FORMAS.find((f) => f.value === p.forma_pagamento)?.label || p.forma_pagamento}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}><Pencil size={12} /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(p)} className="text-red-400 hover:text-red-500"><Trash2 size={12} /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

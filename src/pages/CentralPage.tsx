import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram, MessageCircle, Search, Users, UserPlus, Activity, Calculator, FileText, Percent, ArrowUpDown, Shield, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ProfileRow = {
  user_id: string;
  nome: string | null;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  telefone: string | null;
  created_at: string;
  ultimo_acesso: string | null;
  plano: string | null;
  is_admin: boolean | null;
};

type EventoRow = {
  user_id: string;
  tipo: "calculo" | "orcamento";
  created_at: string;
};

type OrcRow = { user_id: string; created_at: string };

type Row = ProfileRow & {
  calculos: number;
  orcamentos: number;
};

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "created_at" | "ultimo_acesso" | "calculos";
type PeriodKey = "7" | "30" | "all";

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function instagramUrl(handle: string | null) {
  if (!handle) return null;
  const h = handle.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  if (!h) return null;
  return `https://instagram.com/${h}`;
}

function waUrl(num: string | null) {
  if (!num) return null;
  const digits = num.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}`;
}

export default function CentralPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [orcs, setOrcs] = useState<OrcRow[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDesc, setSortDesc] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30");

  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      toast.success(`${deleteTarget.nome || deleteTarget.email || "Usuário"} excluído.`);
      setProfiles((prev) => prev.filter((p) => p.user_id !== deleteTarget.user_id));
      setEventos((prev) => prev.filter((e) => e.user_id !== deleteTarget.user_id));
      setOrcs((prev) => prev.filter((o) => o.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(`Erro ao excluir: ${e.message || e}`);
    } finally {
      setDeleting(false);
    }
  };


  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [{ data: ps }, { data: es }, { data: os }] = await Promise.all([
        (supabase.from("profiles") as any)
          .select("user_id, nome, email, instagram, whatsapp, telefone, created_at, ultimo_acesso, plano, is_admin")
          .order("created_at", { ascending: false }),
        (supabase.from("eventos_uso") as any).select("user_id, tipo, created_at"),
        (supabase.from("orcamentos") as any).select("user_id, created_at"),
      ]);
      setProfiles((ps as ProfileRow[]) || []);
      setEventos((es as EventoRow[]) || []);
      setOrcs((os as OrcRow[]) || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  const eventCounts = useMemo(() => {
    const map = new Map<string, { calculos: number; orcamentos: number }>();
    // Prefer eventos_uso when present
    for (const e of eventos) {
      const cur = map.get(e.user_id) || { calculos: 0, orcamentos: 0 };
      if (e.tipo === "calculo") cur.calculos++;
      else if (e.tipo === "orcamento") cur.orcamentos++;
      map.set(e.user_id, cur);
    }
    // Fallback: count saved orçamentos as both calc + orc (legacy data
    // saved before usage tracking existed).
    for (const o of orcs) {
      const cur = map.get(o.user_id) || { calculos: 0, orcamentos: 0 };
      // Only fill if no events were logged for this user
      const hadEvent = eventos.some((e) => e.user_id === o.user_id);
      if (!hadEvent) {
        cur.calculos++;
        cur.orcamentos++;
        map.set(o.user_id, cur);
      }
    }
    return map;
  }, [eventos, orcs]);

  const rows: Row[] = useMemo(
    () =>
      profiles.map((p) => {
        const c = eventCounts.get(p.user_id) || { calculos: 0, orcamentos: 0 };
        return { ...p, calculos: c.calculos, orcamentos: c.orcamentos };
      }),
    [profiles, eventCounts]
  );

  // Summary cards
  const summary = useMemo(() => {
    const total = rows.length;
    const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const novos = rows.filter((r) => new Date(r.created_at).getTime() >= sevenAgo).length;
    const ativos = rows.filter((r) => r.calculos + r.orcamentos > 0).length;
    const totalCalc = eventos.filter((e) => e.tipo === "calculo").length;
    const totalOrc = eventos.filter((e) => e.tipo === "orcamento").length;
    const ativacao = total > 0 ? (ativos / total) * 100 : 0;
    return { total, novos, ativos, totalCalc, totalOrc, ativacao };
  }, [rows, eventos]);

  // Chart data
  const chartData = useMemo(() => {
    const days = period === "7" ? 7 : period === "30" ? 30 : null;
    const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

    const filtered = (arr: { created_at: string }[]) =>
      days ? arr.filter((x) => new Date(x.created_at).getTime() >= cutoff) : arr;

    const ps = filtered(profiles);
    const es = filtered(eventos);

    const map = new Map<string, { date: string; cadastros: number; uso: number }>();
    const allDates = new Set<string>();
    const keyOf = (d: string) => d.slice(0, 10);
    ps.forEach((p) => allDates.add(keyOf(p.created_at)));
    es.forEach((e) => allDates.add(keyOf(e.created_at)));

    // If "all" — bucket by week to avoid noise
    const bucket = (d: string) => {
      if (days) return keyOf(d);
      const date = new Date(d);
      const day = date.getUTCDay();
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
      return monday.toISOString().slice(0, 10);
    };

    ps.forEach((p) => {
      const k = bucket(p.created_at);
      const cur = map.get(k) || { date: k, cadastros: 0, uso: 0 };
      cur.cadastros++;
      map.set(k, cur);
    });
    es.forEach((e) => {
      const k = bucket(e.created_at);
      const cur = map.get(k) || { date: k, cadastros: 0, uso: 0 };
      cur.uso++;
      map.set(k, cur);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));
  }, [profiles, eventos, period]);

  // Filter + sort table
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = rows.filter((row) => {
      if (statusFilter === "active" && row.calculos + row.orcamentos === 0) return false;
      if (statusFilter === "inactive" && row.calculos + row.orcamentos > 0) return false;
      if (!q) return true;
      return (
        (row.nome || "").toLowerCase().includes(q) ||
        (row.email || "").toLowerCase().includes(q) ||
        (row.instagram || "").toLowerCase().includes(q)
      );
    });
    r = [...r].sort((a, b) => {
      let av: number = 0;
      let bv: number = 0;
      if (sortKey === "calculos") {
        av = a.calculos;
        bv = b.calculos;
      } else {
        av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
        bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
      }
      return sortDesc ? bv - av : av - bv;
    });
    return r;
  }, [rows, search, statusFilter, sortKey, sortDesc]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-primary" size={24} />
        <div>
          <h1 className="text-2xl font-bold">Central</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo — usuários e uso da plataforma</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={Users} label="Cadastrados" value={summary.total} />
        <SummaryCard icon={UserPlus} label="Novos (7d)" value={summary.novos} />
        <SummaryCard icon={Activity} label="Ativos" value={summary.ativos} />
        <SummaryCard icon={Calculator} label="Cálculos" value={summary.totalCalc} />
        <SummaryCard icon={FileText} label="Orçamentos" value={summary.totalOrc} />
        <SummaryCard
          icon={Percent}
          label="Ativação"
          value={`${summary.ativacao.toFixed(1)}%`}
        />
      </div>

      {/* Chart */}
      <Card className="bg-card/60 border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Evolução</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Tudo (por semana)</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Sem dados no período.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="cadastros" name="Cadastros" stroke="hsl(178 70% 42%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uso" name="Uso" stroke="hsl(48 96% 53%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters + table */}
      <Card className="bg-card/60 border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <CardTitle className="text-base">Usuários ({visibleRows.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar nome, email, instagram"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <div className="flex rounded-md border border-border overflow-hidden">
                {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={statusFilter === f ? "default" : "ghost"}
                    className="rounded-none h-9"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Só cadastraram"}
                  </Button>
                ))}
              </div>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de cadastro</SelectItem>
                  <SelectItem value="ultimo_acesso">Último acesso</SelectItem>
                  <SelectItem value="calculos">Nº de cálculos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortDesc((s) => !s)}>
                <ArrowUpDown size={14} className="mr-1" />
                {sortDesc ? "Desc" : "Asc"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="text-right">Cálc.</TableHead>
                    <TableHead className="text-right">Orç.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((r, i) => {
                    const ativo = r.calculos + r.orcamentos > 0;
                    const ig = instagramUrl(r.instagram);
                    const wa = waUrl(r.whatsapp || r.telefone);
                    return (
                      <TableRow key={r.user_id} className={cn(i % 2 === 1 && "bg-muted/20")}>
                        <TableCell className="font-medium">{r.nome || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email || "—"}</TableCell>
                        <TableCell>
                          {ig ? (
                            <a href={ig} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                              <Instagram size={14} /> {r.instagram}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {wa ? (
                            <a href={wa} target="_blank" rel="noreferrer" className="text-green-400 inline-flex items-center gap-1 hover:underline">
                              <MessageCircle size={14} /> {r.whatsapp || r.telefone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell>{formatDate(r.ultimo_acesso)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.calculos}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.orcamentos}</TableCell>
                        <TableCell>
                          {ativo ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Só cadastrou</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user?.id !== r.user_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-8 w-8"
                              onClick={() => setDeleteTarget(r)}
                              title="Excluir usuário"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {visibleRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Todos os dados de{" "}
              <strong>{deleteTarget?.nome || deleteTarget?.email}</strong> (orçamentos,
              estoque, clientes, vendas, impressoras e eventos) serão removidos junto
              com a conta de acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="animate-spin" size={14} /> : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="bg-card/60 border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Icon size={14} className="text-primary" />
          {label}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

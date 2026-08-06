import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  ShoppingCart, 
  History, 
  ArrowUpDown,
  MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  whatsapp: string;
  preferred_channel: string;
  notes: string;
  created_at: string;
}

interface ClientStats {
  totalSpent: number;
  salesCount: number;
  lastPurchaseDate: string | null;
}

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, ClientStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingStatsClient, setViewingStatsClient] = useState<Client | null>(null);
  const [clientSales, setClientSales] = useState<any[]>([]);
  const [clientEncomendas, setClientEncomendas] = useState<any[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    preferred_channel: "whatsapp",
    notes: ""
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    const { data: salesData } = await supabase
      .from("sales")
      .select("customer_id, total_amount, gross_value, profit_amount, created_at")
      .eq("user_id", user.id);

    const { data: encData } = await supabase
      .from("encomendas")
      .select("client_id, valor_total, status, data_encomenda, created_at")
      .eq("user_id", user.id);

    if (clientsData) {
      setClients(clientsData);

      const newStats: Record<string, ClientStats> = {};
      clientsData.forEach(c => {
        const salesForClient = (salesData || []).filter(s => s.customer_id === c.id);
        const encsForClient = (encData || []).filter((e: any) => e.client_id === c.id && e.status !== "cancelada");
        const salesTotal = salesForClient.reduce((sum, s) => sum + Number(s.gross_value || 0), 0);
        const encTotal = encsForClient.reduce((sum: number, e: any) => sum + Number(e.valor_total || 0), 0);
        const salesDates = salesForClient.map(s => s.created_at);
        const encDates = encsForClient.map((e: any) => e.data_encomenda || e.created_at);
        const allDates = [...salesDates, ...encDates].filter(Boolean);
        const lastDate = allDates.length > 0
          ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
          : null;

        newStats[c.id] = {
          totalSpent: salesTotal + encTotal,
          salesCount: salesForClient.length + encsForClient.length,
          lastPurchaseDate: lastDate,
        };
      });
      setStats(newStats);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const normalizeName = (name: string) => {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const checkSimilarity = (s1: string, s2: string) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    // Simple Levenshtein distance based similarity
    const editDistance = (a: string, b: string) => {
      const costs = [];
      for (let i = 0; i <= a.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= b.length; j++) {
          if (i === 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (a.charAt(i - 1) !== b.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[b.length] = lastValue;
      }
      return costs[b.length];
    };

    return (longerLength - editDistance(longer.toLowerCase(), shorter.toLowerCase())) / longerLength;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }

    const normalized = normalizeName(form.name);
    
    // Similarity check
    const similar = clients.find(c => 
      c.id !== editingClient?.id && 
      checkSimilarity(normalized, c.name) > 0.8
    );

    if (similar && !confirm(`Já existe um cliente com nome similar: ${similar.name}. Deseja continuar?`)) {
      return;
    }

    const payload = {
      user_id: user.id,
      name: normalized,
      whatsapp: form.whatsapp,
      preferred_channel: form.preferred_channel,
      notes: form.notes
    };

    if (editingClient) {
      await supabase.from("clients").update(payload).eq("id", editingClient.id);
      toast.success("Cliente atualizado!");
    } else {
      await supabase.from("clients").insert(payload);
      toast.success("Cliente cadastrado!");
    }

    setDialogOpen(false);
    loadData();
  };

  const loadClientHistory = async (client: Client) => {
    const [{ data: salesRows }, { data: encRows }] = await Promise.all([
      supabase.from("sales").select("*").eq("customer_id", client.id).order("created_at", { ascending: false }),
      supabase.from("encomendas").select("*").eq("client_id", client.id).order("data_encomenda", { ascending: false }),
    ]);
    setClientSales(salesRows || []);
    setClientEncomendas(encRows || []);
    setViewingStatsClient(client);
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Remover este cliente? As vendas vinculadas permanecerão, mas sem vínculo.")) return;
    await supabase.from("clients").delete().eq("id", id);
    toast.success("Cliente removido");
    loadData();
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.whatsapp?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de contatos e histórico de compras</p>
        </div>
        <Button onClick={() => { 
          setEditingClient(null); 
          setForm({ name: "", whatsapp: "", preferred_channel: "whatsapp", notes: "" }); 
          setDialogOpen(true); 
        }} className="bg-primary text-primary-foreground neon-glow">
          <Plus size={16} className="mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Buscar por nome ou WhatsApp..." 
          className="pl-10 bg-card border-border h-11" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClients.map(client => {
          const clientStat = stats[client.id] || { totalSpent: 0, salesCount: 0, lastPurchaseDate: null };
          return (
            <Card key={client.id} className="border-border bg-card hover:border-primary/30 transition-colors group">
              <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                    {client.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary">
                      {client.preferred_channel || 'whatsapp'}
                    </Badge>
                    {client.whatsapp && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Phone size={10} /> {client.whatsapp}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    setEditingClient(client);
                    setForm({
                      name: client.name,
                      whatsapp: client.whatsapp || "",
                      preferred_channel: client.preferred_channel || "whatsapp",
                      notes: client.notes || ""
                    });
                    setDialogOpen(true);
                  }} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground uppercase text-[9px] font-bold">Compras</p>
                    <p className="text-foreground font-mono font-bold">{clientStat.salesCount}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground uppercase text-[9px] font-bold">Total Gasto</p>
                    <p className="text-primary font-mono font-bold">R$ {clientStat.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Última compra:</span>
                  <span className="text-foreground font-medium">
                    {clientStat.lastPurchaseDate ? format(new Date(clientStat.lastPurchaseDate), "dd/MM/yy") : 'Nunca'}
                  </span>
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs h-8 border-border hover:bg-muted" onClick={() => loadClientHistory(client)}>
                  <History size={12} className="mr-2" /> Ver Histórico
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>Cadastre as informações básicas do seu cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                placeholder="Ex: João Silva" 
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>WhatsApp</Label>
                <Input 
                  value={form.whatsapp} 
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} 
                  placeholder="(00) 00000-0000" 
                  className="bg-muted border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label>Canal Preferido</Label>
                <Select value={form.preferred_channel} onValueChange={v => setForm(f => ({ ...f, preferred_channel: v }))}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input 
                value={form.notes} 
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                placeholder="Ex: Prefere entregas no período da tarde" 
                className="bg-muted border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!viewingStatsClient} onOpenChange={() => setViewingStatsClient(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewingStatsClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {viewingStatsClient.name.charAt(0)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">{viewingStatsClient.name}</DialogTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                        {stats[viewingStatsClient.id]?.salesCount || 0} compras
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-500">
                        Total: R$ {stats[viewingStatsClient.id]?.totalSpent.toFixed(2) || '0.00'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-primary" /> Histórico de Vendas
                </h3>
                
                {clientSales.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Nenhuma venda vinculada a este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientSales.map(sale => (
                      <div key={sale.id} className="p-4 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {sale.notes || 'Venda sem descrição'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(sale.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-primary">R$ {Number(sale.gross_value || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-green-500 font-medium">Lucro: R$ {Number(sale.profit_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <History size={16} className="text-primary" /> Histórico de Encomendas
                </h3>

                {clientEncomendas.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Nenhuma encomenda vinculada a este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientEncomendas.map((enc: any) => (
                      <div key={enc.id} className="p-4 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {enc.codigo}: {enc.produto}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(enc.data_encomenda || enc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold font-mono text-primary">R$ {Number(enc.valor_total || 0).toFixed(2)}</p>
                          <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary mt-1">
                            {enc.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
              {viewingStatsClient.notes && (
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Observações</h4>
                  <p className="text-sm text-foreground">{viewingStatsClient.notes}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
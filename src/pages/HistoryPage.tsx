import { useState, useEffect } from "react";
import { Trash2, Copy, Eye, Download, Lock, PackagePlus, ShoppingCart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

export default function HistoryPage() {
  const { user, isPro, isAnual } = useAuth();
  const { canExport } = usePlanLimits();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    type: "filament",
    quantity: 0,
    unit: "g",
    cost_per_unit: 0,
    min_stock: 0,
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const fetchQuotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetching all quotes. RLS will ensure the user only sees their own.
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("HistoryPage: Error fetching quotes:", error);
        toast.error("Erro ao carregar histórico");
        return;
      }

      setQuotes(data || []);
    } catch (err) {
      console.error("HistoryPage: Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const filtered = quotes.filter(q => {
    const pieceMatch = q.nome_peca?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const printerMatch = q.impressora_nome?.toLowerCase().includes(search.toLowerCase()) ?? false;
    return pieceMatch || printerMatch;
  });

  const handleDelete = async (id: string) => {
    await supabase.from("orcamentos").delete().eq("id", id);
    setQuotes(quotes.filter(q => q.id !== id));
    toast.success("Orçamento removido!");
  };

  const handleDuplicate = async (q: any) => {
    if (!user) return;
    const { id, created_at, ...rest } = q;
    const { data } = await supabase.from("orcamentos").insert({ ...rest, nome_peca: `${q.nome_peca} (cópia)`, user_id: user.id } as any).select().single();
    if (data) {
      setQuotes([data, ...quotes]);
      toast.success("Orçamento duplicado!");
    }
  };

  const exportCSV = () => {
    if (!canExport) { setUpgradeOpen(true); return; }
    const headers = "Nome,Impressora,Data,Custo Total,Preço Sugerido,Margem\n";
    const rows = filtered.map(q =>
      `"${q.nome_peca}","${q.impressora_nome}","${new Date(q.created_at).toLocaleDateString('pt-BR')}",${(q.custo_total || 0).toFixed(2)},${(q.preco_sugerido || 0).toFixed(2)},${q.margem_lucro}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'orcamentos.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const openInventoryDialog = (q: any) => {
    if (!isAnual) {
      setUpgradeOpen(true);
      return;
    }
    
    // Get weights from filaments JSON
    let totalWeight = 0;
    let avgCostPerG = 0;
    
    try {
      const filaments = Array.isArray(q.filamentos) ? q.filamentos : [];
      totalWeight = filaments.reduce((acc: number, f: any) => acc + (Number(f.weightUsed) || 0), 0);
      const totalCost = filaments.reduce((acc: number, f: any) => acc + (Number(f.computedCost) || 0), 0);
      if (totalWeight > 0) {
        avgCostPerG = totalCost / totalWeight;
      }
    } catch (e) {
      console.error("Error parsing filaments", e);
    }

    setInventoryForm({
      name: q.nome_peca,
      type: "other", // Default to other since it's a finished piece
      quantity: 1,
      unit: "unit",
      cost_per_unit: q.custo_total || 0,
      min_stock: 0,
    });
    setInventoryDialogOpen(true);
  };

  const handleSaveToInventory = async () => {
    if (!user) return;
    
    const { error } = await supabase.from("inventory").insert({
      ...inventoryForm,
      user_id: user.id,
    });

    if (error) {
      toast.error("Erro ao adicionar ao estoque.");
    } else {
      toast.success("Adicionado ao estoque!");
      setInventoryDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Carregando..." : (isPro ? `${quotes.length} orçamentos` : "Orçamentos do mês atual")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="border-border">
          {!canExport && <Lock size={14} className="mr-1" />}
          <Download size={14} className="mr-1" /> Exportar CSV
        </Button>
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou impressora..." className="bg-muted border-border max-w-md" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">Nenhum orçamento encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <Card key={q.id} className="border-border bg-card">
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{q.nome_peca}</p>
                  <p className="text-xs text-muted-foreground">{q.impressora_nome} · {new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right mr-2">
                    <p className="font-bold font-mono text-primary text-sm">R$ {(q.preco_sugerido || 0).toFixed(2)}</p>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{q.margem_lucro}%</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewing(q)} className="p-1.5 text-muted-foreground hover:text-primary" title="Visualizar"><Eye size={15} /></button>
                    <button onClick={() => window.location.href = `/sales?quoteId=${q.id}`} className="p-1.5 text-muted-foreground hover:text-green-500" title="Vender Peça"><ShoppingCart size={15} /></button>
                    <button onClick={() => openInventoryDialog(q)} className="p-1.5 text-muted-foreground hover:text-green-500" title="Adicionar ao estoque"><PackagePlus size={15} /></button>

                    <button onClick={() => handleDuplicate(q)} className="p-1.5 text-muted-foreground hover:text-accent" title="Duplicar"><Copy size={15} /></button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 size={15} /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">{viewing?.nome_peca}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Row label="Impressora" value={viewing.impressora_nome} />
              <Row label="Tempo" value={`${viewing.tempo_horas}h ${viewing.tempo_minutos}min`} />
              <Row label="Energia" value={`R$ ${(viewing.custo_energia || 0).toFixed(2)}`} />
              <Row label="Mão de obra" value={`R$ ${(viewing.custo_mao_de_obra || 0).toFixed(2)}`} />
              <Row label="Manutenção" value={`R$ ${(viewing.custo_manutencao || 0).toFixed(2)}`} />
              <Row label="Depreciação" value={`R$ ${(viewing.custo_depreciacao || 0).toFixed(2)}`} />
              <Row label="Embalagem" value={`R$ ${(viewing.custo_embalagem || 0).toFixed(2)}`} />
              <div className="border-t border-border pt-2">
                <Row label="Custo total" value={`R$ ${(viewing.custo_total || 0).toFixed(2)}`} />
                <Row label="Preço mínimo" value={`R$ ${(viewing.preco_minimo || 0).toFixed(2)}`} />
                <Row label="Margem" value={`${viewing.margem_lucro}%`} />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-foreground">Preço sugerido</span>
                  <span className="text-xl font-bold font-mono text-primary">R$ {(viewing.preco_sugerido || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar ao Estoque</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inv-name">Nome no Estoque</Label>
              <Input id="inv-name" value={inventoryForm.name} onChange={e => setInventoryForm({...inventoryForm, name: e.target.value})} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={inventoryForm.type} onValueChange={v => setInventoryForm({...inventoryForm, type: v})}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filament">Filamento</SelectItem>
                    <SelectItem value="resin">Resina</SelectItem>
                    <SelectItem value="other">Peça Pronta / Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={inventoryForm.unit} onValueChange={v => setInventoryForm({...inventoryForm, unit: v})}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Gramas (g)</SelectItem>
                    <SelectItem value="kg">Quilos (kg)</SelectItem>
                    <SelectItem value="unit">Unidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" value={inventoryForm.quantity} onChange={e => setInventoryForm({...inventoryForm, quantity: +e.target.value})} className="bg-muted border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Custo Unitário (R$)</Label>
                <Input type="number" value={inventoryForm.cost_per_unit} onChange={e => setInventoryForm({...inventoryForm, cost_per_unit: +e.target.value})} className="bg-muted border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInventoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveToInventory}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}

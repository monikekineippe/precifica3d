import { useState, useEffect } from "react";
import { Trash2, Copy, Eye, Download, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

export default function HistoryPage() {
  const { user, isPro } = useAuth();
  const { canExport } = usePlanLimits();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const query = supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

    if (!isPro) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query.gte("created_at", startOfMonth);
    }

    query.then(({ data }) => { if (data) setQuotes(data); });
  }, [user, isPro]);

  const filtered = quotes.filter(q =>
    q.piece_name.toLowerCase().includes(search.toLowerCase()) ||
    q.printer_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("quotes").delete().eq("id", id);
    setQuotes(quotes.filter(q => q.id !== id));
    toast.success("Orçamento removido!");
  };

  const handleDuplicate = async (q: any) => {
    if (!user) return;
    const { id, created_at, ...rest } = q;
    const { data } = await supabase.from("quotes").insert({ ...rest, piece_name: `${q.piece_name} (cópia)`, user_id: user.id }).select().single();
    if (data) {
      setQuotes([data, ...quotes]);
      toast.success("Orçamento duplicado!");
    }
  };

  const exportCSV = () => {
    if (!canExport) { setUpgradeOpen(true); return; }
    const headers = "Nome,Impressora,Data,Custo Total,Preço Sugerido,Margem\n";
    const rows = filtered.map(q =>
      `"${q.piece_name}","${q.printer_name}","${new Date(q.created_at).toLocaleDateString('pt-BR')}",${(q.total_cost || 0).toFixed(2)},${(q.suggested_price || 0).toFixed(2)},${q.profit_margin}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'orcamentos.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isPro ? `${quotes.length} orçamentos` : "Orçamentos do mês atual"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="border-border">
          {!canExport && <Lock size={14} className="mr-1" />}
          <Download size={14} className="mr-1" /> Exportar CSV
        </Button>
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou impressora..." className="bg-muted border-border max-w-md" />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">Nenhum orçamento encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <Card key={q.id} className="border-border bg-card">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{q.piece_name}</p>
                  <p className="text-xs text-muted-foreground">{q.printer_name} · {new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-bold font-mono text-primary text-sm">R$ {(q.suggested_price || 0).toFixed(2)}</p>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{q.profit_margin}%</Badge>
                  </div>
                  <button onClick={() => setViewing(q)} className="p-1.5 text-muted-foreground hover:text-primary"><Eye size={15} /></button>
                  <button onClick={() => handleDuplicate(q)} className="p-1.5 text-muted-foreground hover:text-accent"><Copy size={15} /></button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">{viewing?.piece_name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Row label="Impressora" value={viewing.printer_name} />
              <Row label="Tempo" value={`${viewing.print_time_hours}h ${viewing.print_time_minutes}min`} />
              <Row label="Peso total" value={`${(viewing.total_weight || 0).toFixed(1)}g`} />
              <Row label="Filamento" value={`R$ ${(viewing.total_filament_cost || 0).toFixed(2)}`} />
              <Row label="Energia" value={`R$ ${(viewing.energy_cost || 0).toFixed(2)}`} />
              <Row label="Mão de obra" value={`R$ ${(viewing.labor_cost || 0).toFixed(2)}`} />
              <Row label="Manutenção" value={`R$ ${(viewing.maintenance_cost || 0).toFixed(2)}`} />
              <Row label="Depreciação" value={`R$ ${(viewing.depreciation_cost || 0).toFixed(2)}`} />
              <Row label="Embalagem" value={`R$ ${(viewing.packaging_cost || 0).toFixed(2)}`} />
              <div className="border-t border-border pt-2">
                <Row label="Custo total" value={`R$ ${(viewing.total_cost || 0).toFixed(2)}`} />
                <Row label="Preço mínimo" value={`R$ ${(viewing.minimum_price || 0).toFixed(2)}`} />
                <Row label="Margem" value={`${viewing.profit_margin}%`} />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-foreground">Preço sugerido</span>
                  <span className="text-xl font-bold font-mono text-primary">R$ {(viewing.suggested_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}

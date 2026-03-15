import { useState, useEffect } from "react";
import { Trash2, Copy, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Quote } from "@/lib/types";
import { getQuotes, saveQuotes, addQuote } from "@/lib/store";

export default function HistoryPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Quote | null>(null);

  useEffect(() => { setQuotes(getQuotes()); }, []);

  const filtered = quotes.filter(q =>
    q.pieceName.toLowerCase().includes(search.toLowerCase()) ||
    q.printerName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = (id: string) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated);
    saveQuotes(updated);
    toast.success("Orçamento removido!");
  };

  const handleDuplicate = (q: Quote) => {
    const dup = { ...q, id: crypto.randomUUID(), pieceName: `${q.pieceName} (cópia)`, createdAt: new Date().toISOString() };
    addQuote(dup);
    setQuotes([...quotes, dup]);
    toast.success("Orçamento duplicado!");
  };

  const exportCSV = () => {
    const headers = "Nome,Impressora,Data,Custo Total,Preço Sugerido,Margem\n";
    const rows = filtered.map(q =>
      `"${q.pieceName}","${q.printerName}","${new Date(q.createdAt).toLocaleDateString('pt-BR')}",${q.totalCost.toFixed(2)},${q.suggestedPrice.toFixed(2)},${q.profitMargin}%`
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
          <p className="text-muted-foreground text-sm mt-1">{quotes.length} orçamentos salvos</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="border-border">
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
                  <p className="font-medium text-sm text-foreground truncate">{q.pieceName}</p>
                  <p className="text-xs text-muted-foreground">{q.printerName} · {new Date(q.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-bold font-mono text-primary text-sm">R$ {q.suggestedPrice.toFixed(2)}</p>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{q.profitMargin}%</Badge>
                  </div>
                  <button onClick={() => setViewing(q)} className="p-1.5 text-muted-foreground hover:text-primary"><Eye size={15} /></button>
                  <button onClick={() => handleDuplicate(q)} className="p-1.5 text-muted-foreground hover:text-neon-blue"><Copy size={15} /></button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">{viewing?.pieceName}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Row label="Impressora" value={viewing.printerName} />
              <Row label="Tempo" value={`${viewing.printTimeHours}h ${viewing.printTimeMinutes}min`} />
              <Row label="Peso total" value={`${viewing.totalWeight.toFixed(1)}g`} />
              <Row label="Filamento" value={`R$ ${viewing.totalFilamentCost.toFixed(2)}`} />
              <Row label="Energia" value={`R$ ${viewing.energyCost.toFixed(2)}`} />
              <Row label="Mão de obra" value={`R$ ${viewing.laborCost.toFixed(2)}`} />
              <Row label="Manutenção" value={`R$ ${viewing.maintenanceCost.toFixed(2)}`} />
              <Row label="Depreciação" value={`R$ ${viewing.depreciationCost.toFixed(2)}`} />
              <Row label="Embalagem" value={`R$ ${viewing.packagingCost.toFixed(2)}`} />
              <div className="border-t border-border pt-2">
                <Row label="Custo total" value={`R$ ${viewing.totalCost.toFixed(2)}`} />
                <Row label="Preço mínimo" value={`R$ ${viewing.minimumPrice.toFixed(2)}`} />
                <Row label="Margem" value={`${viewing.profitMargin}%`} />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-foreground">Preço sugerido</span>
                  <span className="text-xl font-bold font-mono text-primary">{`R$ ${viewing.suggestedPrice.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}

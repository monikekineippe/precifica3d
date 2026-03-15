import { Link } from "react-router-dom";
import { PlusCircle, Printer, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQuotes, getPrinters } from "@/lib/store";

export default function Dashboard() {
  const quotes = getQuotes();
  const printers = getPrinters();
  const recent = quotes.slice(-5).reverse();

  const avgCostPerGram = quotes.length > 0
    ? quotes.reduce((s, q) => s + (q.totalWeight > 0 ? q.totalFilamentCost / q.totalWeight : 0), 0) / quotes.length
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da sua operação 3D</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{quotes.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Impressoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{printers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custo médio/g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              R$ {avgCostPerGram.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-neon-green">
              R$ {quotes.reduce((s, q) => s + q.suggestedPrice, 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
          <Link to="/new"><PlusCircle size={16} className="mr-2" />Nova Precificação</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link to="/printers"><Printer size={16} className="mr-2" />Gerenciar Impressoras</Link>
        </Button>
      </div>

      {/* Recent quotes */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Últimos Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhum orçamento ainda. <Link to="/new" className="text-primary hover:underline">Crie o primeiro!</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="font-medium text-sm text-foreground">{q.pieceName}</p>
                    <p className="text-xs text-muted-foreground">{q.printerName} · {new Date(q.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-primary text-sm">R$ {q.suggestedPrice.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Margem {q.profitMargin}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

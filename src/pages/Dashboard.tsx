import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Printer, FileText, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user, isPro, profile } = useAuth();
  const { quotesThisMonth, FREE_QUOTE_LIMIT } = usePlanLimits();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [printerCount, setPrinterCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("orcamentos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setQuotes(data); });
    supabase.from("impressoras").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setPrinterCount(count || 0));
  }, [user]);

  const avgCostPerGram = quotes.length > 0
    ? quotes.reduce((s, q) => {
        const filaments = Array.isArray(q.filamentos) ? q.filamentos : [];
        const totalWeight = filaments.reduce((w: number, f: any) => w + (f.weightUsed || 0), 0);
        const totalFilamentCost = filaments.reduce((c: number, f: any) => c + (f.computedCost || 0), 0);
        return s + (totalWeight > 0 ? totalFilamentCost / totalWeight : 0);
      }, 0) / quotes.length
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da sua operação 3D</p>
      </div>

      {/* Plan status */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={isPro ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}>
              {isPro ? <><Crown size={12} className="mr-1" /> Pro</> : "Free"}
            </Badge>
            {!isPro && (
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  Orçamentos: <span className="font-mono text-foreground">{quotesThisMonth}/{FREE_QUOTE_LIMIT}</span>
                </div>
                <Progress value={(quotesThisMonth / FREE_QUOTE_LIMIT) * 100} className="w-24 h-1.5" />
              </div>
            )}
          </div>
          {!isPro && (
            <Button asChild size="sm" className="bg-primary text-primary-foreground">
              <Link to="/planos"><Crown size={14} className="mr-1" /> Upgrade</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orçamentos (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{quotesThisMonth}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Impressoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{printerCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custo médio/g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">R$ {avgCostPerGram.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              R$ {quotes.reduce((s, q) => s + (q.preco_sugerido || 0), 0).toFixed(0)}
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
          {quotes.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhum orçamento ainda. <Link to="/new" className="text-primary hover:underline">Crie o primeiro!</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {quotes.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="font-medium text-sm text-foreground">{q.nome_peca}</p>
                    <p className="text-xs text-muted-foreground">{q.impressora_nome} · {new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-primary text-sm">R$ {(q.preco_sugerido || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Margem {q.margem_lucro}%</p>
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

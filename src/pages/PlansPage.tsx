import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CHECKOUT_MENSAL = import.meta.env.VITE_GREENN_CHECKOUT_MENSAL || "#";
const CHECKOUT_ANUAL = import.meta.env.VITE_GREENN_CHECKOUT_ANUAL || "#";

const FEATURES = [
  { name: "Orçamentos por mês", free: "2", pro: "Ilimitados" },
  { name: "Impressoras personalizadas", free: "1", pro: "Ilimitadas" },
  { name: "Impressoras pré-cadastradas", free: true, pro: true },
  { name: "Cálculos em tempo real", free: true, pro: true },
  { name: "Exportar PDF", free: false, pro: true },
  { name: "Exportar CSV", free: false, pro: true },
  { name: "Histórico completo", free: false, pro: true },
  { name: "Relatórios e gráficos", free: false, pro: true },
  { name: "Busca automática de tarifa", free: true, pro: true },
];

export default function PlansPage() {
  const { isPro } = useAuth();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha o plano ideal para seu negócio</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label className={!annual ? "text-foreground" : "text-muted-foreground"}>Mensal</Label>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <Label className={annual ? "text-foreground" : "text-muted-foreground"}>
          Anual <Badge variant="outline" className="ml-1 text-[10px] border-primary/30 text-primary">-33%</Badge>
        </Label>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Free</CardTitle>
            <div>
              <span className="text-3xl font-bold font-mono text-foreground">R$ 0</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground">Para quem está começando</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-sm">
                {typeof f.free === "boolean" ? (
                  f.free ? <Check size={16} className="text-primary shrink-0" /> : <X size={16} className="text-muted-foreground shrink-0" />
                ) : (
                  <Check size={16} className="text-primary shrink-0" />
                )}
                <span className={typeof f.free === "boolean" && !f.free ? "text-muted-foreground" : "text-foreground"}>
                  {f.name} {typeof f.free === "string" && <span className="text-muted-foreground text-xs">({f.free})</span>}
                </span>
              </div>
            ))}
            {isPro ? (
              <Button disabled className="w-full" variant="outline">Plano atual: Pro</Button>
            ) : (
              <Button disabled className="w-full" variant="outline">Plano atual</Button>
            )}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-primary/50 bg-card relative neon-glow">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
            <Crown size={12} className="mr-1" /> Mais popular
          </Badge>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Pro</CardTitle>
            <div>
              <span className="text-3xl font-bold font-mono text-primary">
                R$ {annual ? "239" : "29,90"}
              </span>
              <span className="text-sm text-muted-foreground">/{annual ? "ano" : "mês"}</span>
            </div>
            {annual && <p className="text-xs text-primary">~R$ 19,92/mês</p>}
            <p className="text-xs text-muted-foreground">Para profissionais</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-sm">
                <Check size={16} className="text-primary shrink-0" />
                <span className="text-foreground">
                  {f.name} {typeof f.pro === "string" && <span className="text-primary text-xs font-medium">({f.pro})</span>}
                </span>
              </div>
            ))}
            {isPro ? (
              <Button disabled className="w-full bg-primary text-primary-foreground">Plano atual</Button>
            ) : (
              <a href={annual ? CHECKOUT_ANUAL : CHECKOUT_MENSAL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-primary text-primary-foreground neon-glow">
                  <Crown size={16} className="mr-2" /> Assinar Pro
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature comparison */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">Comparação detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              <span>Recurso</span>
              <span className="text-center">Free</span>
              <span className="text-center">Pro</span>
            </div>
            {FEATURES.map(f => (
              <div key={f.name} className="grid grid-cols-3 py-2.5 text-sm border-b border-border/50">
                <span className="text-foreground">{f.name}</span>
                <span className="text-center">
                  {typeof f.free === "boolean" ? (
                    f.free ? <Check size={16} className="inline text-primary" /> : <X size={16} className="inline text-muted-foreground" />
                  ) : (
                    <span className="text-muted-foreground text-xs">{f.free}</span>
                  )}
                </span>
                <span className="text-center">
                  {typeof f.pro === "boolean" ? (
                    <Check size={16} className="inline text-primary" />
                  ) : (
                    <span className="text-primary text-xs font-medium">{f.pro}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

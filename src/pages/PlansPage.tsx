import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { CHECKOUT_MENSAL, CHECKOUT_ANUAL } from "@/lib/checkout-links";

const FEATURES = [
  { name: "Orçamentos por mês", free: "2", mensal: "Ilimitados", anual: "Ilimitados" },
  { name: "Impressoras personalizadas", free: "1", mensal: "Ilimitadas", anual: "Ilimitadas" },
  { name: "Impressoras pré-cadastradas", free: true, mensal: true, anual: true },
  { name: "Cálculos em tempo real", free: true, mensal: true, anual: true },
  { name: "Histórico completo", free: false, mensal: true, anual: true },
  { name: "Relatórios e gráficos", free: false, mensal: true, anual: true },
  { name: "Busca automática de tarifa", free: true, mensal: true, anual: true },
  { name: "Exportar PDF", free: false, mensal: false, anual: true },
  { name: "Exportar CSV", free: false, mensal: false, anual: true },
  { name: "Todas as atualizações futuras", free: false, mensal: false, anual: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? <Check size={16} className="inline text-primary" /> : <X size={16} className="inline text-muted-foreground" />;
  }
  return <span className="text-primary text-xs font-medium">{value}</span>;
}

export default function PlansPage() {
  const { isPro, isAnual, profile } = useAuth();

  const currentPlan = profile?.plano || "free";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha o plano ideal para seu negócio</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Free</CardTitle>
            <div>
              <span className="text-3xl font-bold font-mono text-foreground">R$ 0</span>
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
            {currentPlan === "free" ? (
              <Button disabled className="w-full" variant="outline">Plano atual</Button>
            ) : (
              <Button disabled className="w-full" variant="outline">—</Button>
            )}
          </CardContent>
        </Card>

        {/* Mensal */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Pro Mensal</CardTitle>
            <div>
              <span className="text-3xl font-bold font-mono text-primary">R$ 29,90</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground">Para profissionais</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-sm">
                {typeof f.mensal === "boolean" ? (
                  f.mensal ? <Check size={16} className="text-primary shrink-0" /> : <X size={16} className="text-muted-foreground shrink-0" />
                ) : (
                  <Check size={16} className="text-primary shrink-0" />
                )}
                <span className={typeof f.mensal === "boolean" && !f.mensal ? "text-muted-foreground" : "text-foreground"}>
                  {f.name} {typeof f.mensal === "string" && <span className="text-primary text-xs font-medium">({f.mensal})</span>}
                </span>
              </div>
            ))}
            {currentPlan === "mensal" ? (
              <Button disabled className="w-full bg-primary text-primary-foreground">Plano atual</Button>
            ) : (
              <a href={CHECKOUT_MENSAL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-primary text-primary-foreground neon-glow">
                  <Crown size={16} className="mr-2" /> Assinar Mensal
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* Anual */}
        <Card className="border-primary/50 bg-card relative neon-glow">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
            <Star size={12} className="mr-1" /> Melhor custo-benefício
          </Badge>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Pro Anual</CardTitle>
            <div>
              <span className="text-3xl font-bold font-mono text-primary">R$ 239,90</span>
              <span className="text-sm text-muted-foreground">/ano</span>
            </div>
            <p className="text-xs text-primary">~R$ 19,99/mês</p>
            <p className="text-xs text-muted-foreground">Economia de 33%</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-sm">
                <Check size={16} className="text-primary shrink-0" />
                <span className="text-foreground">
                  {f.name} {typeof f.anual === "string" && <span className="text-primary text-xs font-medium">({f.anual})</span>}
                </span>
              </div>
            ))}
            {currentPlan === "anual" ? (
              <Button disabled className="w-full bg-primary text-primary-foreground">Plano atual</Button>
            ) : (
              <a href={CHECKOUT_ANUAL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-primary text-primary-foreground neon-glow">
                  <Star size={16} className="mr-2" /> Assinar Anual
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
          <div className="overflow-x-auto">
            <div className="min-w-[400px] space-y-0">
              <div className="grid grid-cols-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                <span>Recurso</span>
                <span className="text-center">Free</span>
                <span className="text-center">Mensal</span>
                <span className="text-center">Anual</span>
              </div>
              {FEATURES.map(f => (
                <div key={f.name} className="grid grid-cols-4 py-2.5 text-sm border-b border-border/50">
                  <span className="text-foreground">{f.name}</span>
                  <span className="text-center"><FeatureCell value={f.free} /></span>
                  <span className="text-center"><FeatureCell value={f.mensal} /></span>
                  <span className="text-center"><FeatureCell value={f.anual} /></span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Infinity } from "lucide-react";

import { CHECKOUT_ANUAL, CHECKOUT_VITALICIO } from "@/lib/checkout-links";

const FEATURES = [
  { name: "Orçamentos por mês", free: "2", pro: "Ilimitados" },
  { name: "Impressoras personalizadas", free: "1", pro: "Ilimitadas" },
  { name: "Exportar PDF/CSV", free: false, pro: true },
  { name: "Histórico completo", free: false, pro: true },
  { name: "Relatórios e gráficos", free: false, pro: true },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpgradeModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Crown className="text-primary" size={20} />
            Upgrade para Pro
          </DialogTitle>
          <DialogDescription>
            Desbloqueie todo o potencial do Precifica3D
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comparison table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Recurso</span>
              <span className="text-center">Free</span>
              <span className="text-center">Pro</span>
            </div>
            {FEATURES.map((f) => (
              <div key={f.name} className="grid grid-cols-3 px-4 py-2.5 border-t border-border text-sm">
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
                    f.pro ? <Check size={16} className="inline text-primary" /> : <X size={16} className="inline text-muted-foreground" />
                  ) : (
                    <span className="text-primary font-medium text-xs">{f.pro}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-2 gap-3">
            <a href={CHECKOUT_ANUAL} target="_blank" rel="noopener noreferrer" className="block">
              <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors text-center">
                <p className="text-xs text-muted-foreground mb-1">Anual</p>
                <p className="text-2xl font-bold font-mono text-foreground">R$ 97</p>
                <p className="text-[10px] text-muted-foreground">/ano (~R$ 8,08/mês)</p>
                <Button className="w-full mt-3 bg-primary text-primary-foreground" size="sm">
                  Assinar Anual
                </Button>
              </div>
            </a>
            <a href={CHECKOUT_VITALICIO} target="_blank" rel="noopener noreferrer" className="block">
              <div className="p-4 rounded-lg border border-primary/50 hover:border-primary transition-colors text-center relative neon-glow">
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                  Melhor custo-benefício
                </Badge>
                <p className="text-xs text-muted-foreground mb-1">Vitalício</p>
                <p className="text-2xl font-bold font-mono text-foreground">R$ 197</p>
                <p className="text-[10px] text-muted-foreground">pagamento único</p>
                <Button className="w-full mt-3 bg-primary text-primary-foreground" size="sm">
                  <Infinity size={14} className="mr-1" /> Acesso Vitalício
                </Button>
              </div>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

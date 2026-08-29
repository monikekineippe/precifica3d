import { useState } from "react";
import { ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface PricingResultPanelProps {
  suggestedPrice: number;
  profit: number;
  realMargin: number;
  totalCost: number;
  margin: number;
  onMarginChange: (value: number) => void;
  lines: { label: string; value: number }[];
  missing: string[];
}

function Breakdown({
  lines,
  totalCost,
}: {
  lines: { label: string; value: number }[];
  totalCost: number;
}) {
  return (
    <div className="space-y-1.5">
      {lines.map((l) => {
        const pct = totalCost > 0 ? (l.value / totalCost) * 100 : 0;
        return (
          <div key={l.label} className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-muted-foreground truncate">{l.label}</span>
            <span className="flex items-baseline gap-2 shrink-0">
              <span className="font-mono text-foreground">{brl(l.value)}</span>
              <span className="font-mono text-[10px] text-muted-foreground w-10 text-right">
                {pct.toFixed(0)}%
              </span>
            </span>
          </div>
        );
      })}
      <div className="flex items-baseline justify-between gap-2 text-xs pt-2 border-t border-border">
        <span className="text-foreground font-semibold">Custo total</span>
        <span className="font-mono text-foreground font-semibold">{brl(totalCost)}</span>
      </div>
    </div>
  );
}

function MissingList({ missing }: { missing: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <AlertCircle size={16} className="text-primary" />
        Falta preencher
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-5">
        {missing.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function MarginSlider({
  margin,
  onMarginChange,
}: {
  margin: number;
  onMarginChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Margem de lucro</span>
        <span className="font-mono text-primary font-semibold">{margin}%</span>
      </div>
      <Slider
        value={[margin]}
        min={0}
        max={300}
        step={5}
        onValueChange={(v) => onMarginChange(v[0])}
      />
    </div>
  );
}

export default function PricingResultPanel(props: PricingResultPanelProps) {
  const { suggestedPrice, profit, realMargin, totalCost, margin, onMarginChange, lines, missing } =
    props;
  const [expanded, setExpanded] = useState(false);
  const incomplete = missing.length > 0;

  const header = (
    <div>
      <p className="text-xs text-muted-foreground">Preço sugerido</p>
      <p className="text-3xl font-bold font-mono text-primary leading-tight">
        {brl(suggestedPrice)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Lucro:{" "}
        <span className="font-mono text-accent font-semibold">{brl(profit)}</span>{" "}
        <span className="font-mono">({realMargin.toFixed(1)}% do preço)</span>
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop: painel fixo na lateral */}
      <aside className="hidden lg:block w-[340px] shrink-0">
        <div className="sticky top-6 rounded-xl border border-border bg-card p-5 space-y-4">
          {incomplete ? (
            <MissingList missing={missing} />
          ) : (
            <>
              {header}
              <div className="pt-1 border-t border-border" />
              <Breakdown lines={lines} totalCost={totalCost} />
              <MarginSlider margin={margin} onMarginChange={onMarginChange} />
            </>
          )}
        </div>
      </aside>

      {/* Mobile: barra fixa no rodapé */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          {incomplete ? (
            <span className="text-xs text-muted-foreground">
              Complete os campos essenciais para ver o preço
            </span>
          ) : (
            <span className="flex items-baseline gap-3">
              <span className="text-lg font-bold font-mono text-primary">
                {brl(suggestedPrice)}
              </span>
              <span className="text-xs font-mono text-accent">
                lucro {brl(profit)}
              </span>
            </span>
          )}
          {expanded ? (
            <ChevronDown size={18} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronUp size={18} className="text-muted-foreground shrink-0" />
          )}
        </button>
        <div
          className={cn(
            "px-4 overflow-y-auto transition-all",
            expanded ? "max-h-[60vh] pb-4 space-y-4" : "max-h-0"
          )}
        >
          {expanded &&
            (incomplete ? (
              <MissingList missing={missing} />
            ) : (
              <>
                {header}
                <Breakdown lines={lines} totalCost={totalCost} />
                <MarginSlider margin={margin} onMarginChange={onMarginChange} />
              </>
            ))}
        </div>
      </div>
    </>
  );
}

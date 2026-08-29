import { useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, AlertCircle, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChannelResult } from "@/lib/sales-channels";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type PriceMode = "margem" | "preco";


export interface PricingResultPanelProps {
  suggestedPrice: number;
  profit: number;
  realMargin: number;
  totalCost: number;
  margin: number;
  onMarginChange: (value: number) => void;
  lines: { label: string; value: number }[];
  missing: string[];
  // Modo preço reverso
  mode: PriceMode;
  onModeChange: (mode: PriceMode) => void;
  manualPrice: string;
  onManualPriceChange: (value: string) => void;
  marketplaceFee: string;
  onMarketplaceFeeChange: (value: string) => void;
  applyCardFee: boolean;
  onApplyCardFeeChange: (value: boolean) => void;
  cardFeePercent: number;
  taxRate: number;
  reverseDeductions: { label: string; value: number }[];
  reverseProfit: number;
  reverseMargin: number;
  minMargin: number;
  channelResults?: ChannelResult[];
  // Limite do plano gratuito atingido: preço, lucro e comparador ficam desfocados
  limitReached?: boolean;
  onUpgrade?: () => void;
}

function LimitOverlay({
  children,
  onUpgrade,
}: {
  children: ReactNode;
  onUpgrade?: () => void;
}) {
  return (
    <div className="relative">
      <div className="blur-md select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3">
        <p className="text-xs text-foreground font-medium">
          Você usou seus 10 cálculos do mês. Faça upgrade pra ver o preço.
        </p>
        <Button
          size="sm"
          onClick={onUpgrade}
          className="bg-primary text-primary-foreground font-semibold"
        >
          Fazer upgrade
        </Button>
      </div>
    </div>
  );
}

function ChannelCards({ results }: { results: ChannelResult[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground font-semibold">Preço por canal</p>
      <div className="grid grid-cols-2 gap-2">
        {results.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-lg border p-2",
              r.profit < 0 ? "border-destructive/50 bg-destructive/10" : "border-border bg-muted/40"
            )}
          >
            <p className="text-[11px] text-foreground font-medium truncate">{r.name}</p>
            <p className="text-sm font-bold font-mono text-primary leading-tight">
              {brl(r.price)}
            </p>
            <p
              className={cn(
                "text-[10px] font-mono",
                r.profit < 0 ? "text-destructive" : "text-accent"
              )}
            >
              lucro {brl(r.profit)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {r.percent}%{r.fixed > 0 ? ` + ${brl(r.fixed)}` : ""}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Taxas padrão de mercado, confira as condições do seu contrato.
      </p>
    </div>
  );
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

function Tabs({
  mode,
  onModeChange,
}: {
  mode: PriceMode;
  onModeChange: (m: PriceMode) => void;
}) {
  const btn = (value: PriceMode, label: string) => (
    <button
      type="button"
      onClick={() => onModeChange(value)}
      className={cn(
        "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        mode === value
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {btn("margem", "Definir margem")}
      {btn("preco", "Já tenho um preço")}
    </div>
  );
}

export default function PricingResultPanel(props: PricingResultPanelProps) {
  const {
    suggestedPrice,
    profit,
    realMargin,
    totalCost,
    margin,
    onMarginChange,
    lines,
    missing,
    mode,
    onModeChange,
    manualPrice,
    onManualPriceChange,
    marketplaceFee,
    onMarketplaceFeeChange,
    applyCardFee,
    onApplyCardFeeChange,
    cardFeePercent,
    taxRate,
    reverseDeductions,
    reverseProfit,
    reverseMargin,
    minMargin,
    channelResults = [],
    limitReached = false,
    onUpgrade,
  } = props;
  const [expanded, setExpanded] = useState(false);
  const incomplete = missing.length > 0;
  const priceValue = Number(String(manualPrice).replace(",", ".")) || 0;
  const loss = reverseProfit < 0;
  const tight = !loss && priceValue > 0 && reverseMargin < minMargin;

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

  const reverseBlock = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Preço que você pratica (R$)
        </Label>
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0,00"
          value={manualPrice}
          onChange={(e) => onManualPriceChange(e.target.value)}
          className="bg-muted border-border font-mono"
        />
      </div>

      <div className="space-y-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Comissão de marketplace (%)
          </Label>
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="0"
            value={marketplaceFee}
            onChange={(e) => onMarketplaceFeeChange(e.target.value)}
            className="bg-muted border-border font-mono"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={applyCardFee}
            onCheckedChange={(v) => onApplyCardFeeChange(Boolean(v))}
          />
          Considerar taxa de cartão de {cardFeePercent}%
        </label>
        <p className="text-[11px] text-muted-foreground">
          Impostos de {taxRate}% já entram no desconto.
        </p>
      </div>

      {priceValue > 0 && (
        <>
          {(() => {
            const resultCard = (
              <div
                className={cn(
                  "rounded-lg border p-3 space-y-1",
                  loss
                    ? "border-destructive/50 bg-destructive/10"
                    : tight
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-border bg-muted/40"
                )}
              >
                <p className="text-xs text-muted-foreground">Lucro nesse preço</p>
                <p
                  className={cn(
                    "text-2xl font-bold font-mono leading-tight",
                    loss ? "text-destructive" : tight ? "text-yellow-500" : "text-primary"
                  )}
                >
                  {brl(reverseProfit)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Margem real: {reverseMargin.toFixed(1)}% do preço
                </p>
                {loss && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive font-medium pt-1">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    Nesse preço você paga pra trabalhar. Prejuízo de{" "}
                    {brl(Math.abs(reverseProfit))} por peça.
                  </p>
                )}
                {tight && (
                  <p className="flex items-start gap-1.5 text-xs text-yellow-500 font-medium pt-1">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    Margem apertada: abaixo do seu mínimo.
                  </p>
                )}
              </div>
            );
            return limitReached ? (
              <LimitOverlay onUpgrade={onUpgrade}>{resultCard}</LimitOverlay>
            ) : (
              resultCard
            );
          })()}

          {reverseDeductions.length > 0 && (
            <div className="space-y-1.5">
              {reverseDeductions.map((d) => (
                <div
                  key={d.label}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span className="text-muted-foreground truncate">{d.label}</span>
                  <span className="font-mono text-foreground">-{brl(d.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Breakdown lines={lines} totalCost={totalCost} />
    </div>
  );

  const body = (
    <>
      <Tabs mode={mode} onModeChange={onModeChange} />
      {mode === "margem" ? (
        <>
          {limitReached ? <LimitOverlay onUpgrade={onUpgrade}>{header}</LimitOverlay> : header}
          <div className="pt-1 border-t border-border" />
          <Breakdown lines={lines} totalCost={totalCost} />
          <MarginSlider margin={margin} onMarginChange={onMarginChange} />
        </>
      ) : (
        reverseBlock
      )}
      {channelResults.length > 0 && (
        <>
          <div className="pt-1 border-t border-border" />
          {limitReached ? (
            <LimitOverlay onUpgrade={onUpgrade}>
              <ChannelCards results={channelResults} />
            </LimitOverlay>
          ) : (
            <ChannelCards results={channelResults} />
          )}
        </>
      )}
    </>

  );

  return (
    <>
      {/* Desktop: painel fixo na lateral */}
      <aside className="hidden lg:block w-[340px] shrink-0">
        <div className="sticky top-6 rounded-xl border border-border bg-card p-5 space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
          {incomplete ? <MissingList missing={missing} /> : body}
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
          ) : mode === "preco" ? (
            <span className="flex items-baseline gap-3">
              <span className="text-lg font-bold font-mono text-primary">
                {brl(priceValue)}
              </span>
              <span
                className={cn(
                  "text-xs font-mono",
                  loss ? "text-destructive" : tight ? "text-yellow-500" : "text-accent",
                  limitReached && "blur-sm select-none"
                )}
              >
                lucro {brl(reverseProfit)}
              </span>
            </span>
          ) : (
            <span className="flex items-baseline gap-3">
              <span
                className={cn(
                  "text-lg font-bold font-mono text-primary",
                  limitReached && "blur-sm select-none"
                )}
              >
                {brl(suggestedPrice)}
              </span>
              <span
                className={cn(
                  "text-xs font-mono text-accent",
                  limitReached && "blur-sm select-none"
                )}
              >
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
          {expanded && (incomplete ? <MissingList missing={missing} /> : body)}
        </div>
      </div>
    </>
  );
}

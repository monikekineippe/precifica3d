import { useState } from "react";
import { Pencil, Check, Store } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { SalesChannel } from "@/lib/sales-channels";

interface Props {
  channels: SalesChannel[];
  selected: string[];
  onToggle: (id: string) => void;
  onFeeChange: (id: string, percent: number, fixed: number) => void;
}

export default function SalesChannelsSection({ channels, selected, onToggle, onFeeChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pct, setPct] = useState("0");
  const [fix, setFix] = useState("0");

  const startEdit = (c: SalesChannel) => {
    setEditing(c.id);
    setPct(String(c.percent));
    setFix(String(c.fixed));
  };

  const confirm = (c: SalesChannel) => {
    onFeeChange(
      c.id,
      Number(String(pct).replace(",", ".")) || 0,
      Number(String(fix).replace(",", ".")) || 0
    );
    setEditing(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground flex items-center gap-2">
          <Store size={14} className="text-primary" />
          Onde você vai vender?
        </Label>
        <p className="text-[11px] text-muted-foreground mt-1">
          Taxas padrão de mercado, confira as condições do seu contrato.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {channels.map((c) => {
          const isEditing = editing === c.id;
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <Checkbox
                id={`ch-${c.id}`}
                checked={selected.includes(c.id)}
                onCheckedChange={() => onToggle(c.id)}
              />
              <label
                htmlFor={`ch-${c.id}`}
                className="text-xs text-foreground font-medium cursor-pointer flex-1 truncate"
              >
                {c.name}
              </label>

              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={pct}
                    onChange={(e) => setPct(e.target.value)}
                    inputMode="decimal"
                    className="h-7 w-14 px-1 text-[11px] font-mono bg-background border-border"
                    aria-label={`Comissão de ${c.name} em porcentagem`}
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                  <Input
                    value={fix}
                    onChange={(e) => setFix(e.target.value)}
                    inputMode="decimal"
                    className="h-7 w-14 px-1 text-[11px] font-mono bg-background border-border"
                    aria-label={`Taxa fixa de ${c.name} em reais`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => confirm(c)}
                    aria-label="Confirmar taxa"
                  >
                    <Check size={13} className="text-primary" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {c.percent}%
                    {c.fixed > 0 ? ` + R$ ${c.fixed.toFixed(2)}` : ""}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => startEdit(c)}
                    aria-label={`Editar taxa de ${c.name}`}
                  >
                    <Pencil size={12} className="text-muted-foreground" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

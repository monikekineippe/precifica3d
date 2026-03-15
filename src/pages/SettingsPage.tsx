import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSettings, saveSettings } from "@/lib/store";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  const update = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Valores padrão para novos orçamentos</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm text-foreground">Padrões</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-foreground">Tarifa de energia padrão (R$/kWh)</Label>
            <Input type="number" step={0.01} value={settings.defaultTariff} onChange={e => update('defaultTariff', +e.target.value)} className="bg-muted border-border" />
          </div>
          <div>
            <Label className="text-foreground">Margem de lucro padrão (%)</Label>
            <Input type="number" value={settings.defaultMargin} onChange={e => update('defaultMargin', +e.target.value)} className="bg-muted border-border" />
          </div>
          <div>
            <Label className="text-foreground">Taxa de imposto padrão (%)</Label>
            <Input type="number" value={settings.defaultTaxRate} onChange={e => update('defaultTaxRate', +e.target.value)} className="bg-muted border-border" />
          </div>
          <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground neon-glow">Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
}

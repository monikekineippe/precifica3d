import { useState, useEffect } from "react";
import { Printer as PrinterIcon, Plus, Trash2, Edit2, RotateCcw, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { KinematicsType } from "@/lib/types";
import { PRESET_PRINTERS } from "@/lib/printers-data";
import { computePrinterFields } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

interface PrinterRow {
  id: string;
  name: string;
  kinematics: string;
  acquisition_cost: number;
  lifespan: number;
  power_consumption: number;
  maintenance_cost_monthly: number;
  monthly_usage_hours: number;
  max_filaments: number;
  is_preset: boolean;
  user_id: string;
}

const EMPTY_FORM = {
  name: '', kinematics: 'Cartesiana' as string, acquisition_cost: 0, lifespan: 0,
  power_consumption: 0, maintenance_cost_monthly: 0, monthly_usage_hours: 160, max_filaments: 1,
};

export default function PrintersPage() {
  const { user } = useAuth();
  const { canCreatePrinter, customPrintersCount, FREE_PRINTER_LIMIT, refresh } = usePlanLimits();
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrinterRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [presetsLoaded, setPresetsLoaded] = useState(false);

  const loadPrinters = async () => {
    if (!user) return;
    const { data } = await supabase.from("printers").select("*").eq("user_id", user.id);
    if (data) {
      setPrinters(data);
      if (data.length === 0 && !presetsLoaded) {
        // Seed presets
        const presets = PRESET_PRINTERS.map(p => ({
          user_id: user.id,
          name: p.name,
          kinematics: p.kinematics,
          acquisition_cost: p.acquisitionCost,
          lifespan: p.lifespan,
          power_consumption: p.powerConsumption,
          maintenance_cost_monthly: p.maintenanceCostMonthly,
          monthly_usage_hours: p.monthlyUsageHours,
          max_filaments: p.maxFilaments,
          is_preset: true,
        }));
        await supabase.from("printers").insert(presets);
        setPresetsLoaded(true);
        loadPrinters();
      }
    }
  };

  useEffect(() => { loadPrinters(); }, [user]);

  const openNew = () => {
    if (!canCreatePrinter) {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (p: PrinterRow) => {
    if (p.is_preset) {
      toast.info("Impressoras pré-cadastradas não podem ser editadas.");
      return;
    }
    setEditing(p);
    setForm({
      name: p.name, kinematics: p.kinematics, acquisition_cost: p.acquisition_cost,
      lifespan: p.lifespan, power_consumption: p.power_consumption,
      maintenance_cost_monthly: p.maintenance_cost_monthly,
      monthly_usage_hours: p.monthly_usage_hours, max_filaments: p.max_filaments,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;

    if (editing) {
      await supabase.from("printers").update({
        name: form.name, kinematics: form.kinematics, acquisition_cost: form.acquisition_cost,
        lifespan: form.lifespan, power_consumption: form.power_consumption,
        maintenance_cost_monthly: form.maintenance_cost_monthly,
        monthly_usage_hours: form.monthly_usage_hours, max_filaments: form.max_filaments,
      }).eq("id", editing.id);
      toast.success("Impressora atualizada!");
    } else {
      await supabase.from("printers").insert({
        user_id: user.id, name: form.name, kinematics: form.kinematics,
        acquisition_cost: form.acquisition_cost, lifespan: form.lifespan,
        power_consumption: form.power_consumption, maintenance_cost_monthly: form.maintenance_cost_monthly,
        monthly_usage_hours: form.monthly_usage_hours, max_filaments: form.max_filaments, is_preset: false,
      });
      toast.success("Impressora adicionada!");
      refresh();
    }
    setDialogOpen(false);
    loadPrinters();
  };

  const handleDelete = async (p: PrinterRow) => {
    if (p.is_preset) { toast.info("Impressoras pré-cadastradas não podem ser removidas."); return; }
    await supabase.from("printers").delete().eq("id", p.id);
    toast.success("Impressora removida!");
    loadPrinters();
    refresh();
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const computed = computePrinterFields({
    monthlyUsageHours: form.monthly_usage_hours,
    maintenanceCostMonthly: form.maintenance_cost_monthly,
    lifespan: form.lifespan,
    acquisitionCost: form.acquisition_cost,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Impressoras</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seu parque de impressoras 3D</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground neon-glow">
          {canCreatePrinter ? <Plus size={14} className="mr-1" /> : <Lock size={14} className="mr-1" />}
          Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map(p => {
          const depPerHour = p.lifespan > 0 ? p.acquisition_cost / p.lifespan : 0;
          const maintPerHour = p.monthly_usage_hours > 0 ? p.maintenance_cost_monthly / p.monthly_usage_hours : 0;
          return (
            <Card key={p.id} className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground leading-tight">{p.name}</CardTitle>
                  {!p.is_preset && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  )}
                  {p.is_preset && <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">Padrão</Badge>}
                </div>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{p.kinematics}</Badge>
                  <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{p.max_filaments} fil.</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Custo</span><span className="font-mono text-foreground">R$ {p.acquisition_cost.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Vida útil</span><span className="font-mono text-foreground">{p.lifespan.toLocaleString()}h</span></div>
                <div className="flex justify-between"><span>Consumo</span><span className="font-mono text-foreground">{p.power_consumption}W</span></div>
                <div className="flex justify-between"><span>Depreciação/h</span><span className="font-mono text-primary">R$ {depPerHour.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Manutenção/h</span><span className="font-mono text-primary">R$ {maintPerHour.toFixed(2)}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Editar" : "Nova"} Impressora</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-foreground">Nome/Modelo</Label><Input value={form.name} onChange={e => setField('name', e.target.value)} className="bg-muted border-border" /></div>
            <div><Label className="text-foreground">Cinemática</Label>
              <Select value={form.kinematics} onValueChange={v => setField('kinematics', v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Cartesiana">Cartesiana</SelectItem><SelectItem value="Delta">Delta</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-foreground">Custo (R$)</Label><Input type="number" value={form.acquisition_cost || ''} onChange={e => setField('acquisition_cost', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Vida útil (h)</Label><Input type="number" value={form.lifespan || ''} onChange={e => setField('lifespan', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Consumo (W)</Label><Input type="number" value={form.power_consumption || ''} onChange={e => setField('power_consumption', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Manutenção/mês (R$)</Label><Input type="number" value={form.maintenance_cost_monthly || ''} onChange={e => setField('maintenance_cost_monthly', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Horas uso/mês</Label><Input type="number" value={form.monthly_usage_hours || ''} onChange={e => setField('monthly_usage_hours', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Máx filamentos</Label>
                <Select value={String(form.max_filaments)} onValueChange={v => setField('max_filaments', +v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,4,5,8,16].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-3 pb-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Depreciação/h</span><span className="font-mono text-primary">R$ {computed.depreciationPerHour.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Manutenção/h</span><span className="font-mono text-primary">R$ {computed.maintenanceCostPerHour.toFixed(4)}</span></div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

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
// presets now live in the DB
import { computePrinterFields } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

interface PrinterRow {
  id: string;
  nome: string;
  cinematica: string;
  custo_aquisicao: number;
  vida_util_horas: number;
  consumo_watts: number;
  custo_manutencao_mensal: number;
  horas_uso_mensal: number;
  max_filamentos: number;
  is_precadastrada: boolean;
  user_id: string;
}

const EMPTY_FORM = {
  nome: '', cinematica: 'Cartesiana' as string, custo_aquisicao: 0, vida_util_horas: 0,
  consumo_watts: 0, custo_manutencao_mensal: 0, horas_uso_mensal: 160, max_filamentos: 1,
};

export default function PrintersPage() {
  const { user } = useAuth();
  const { canCreatePrinter, customPrintersCount, FREE_PRINTER_LIMIT, refresh } = usePlanLimits();
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrinterRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  

  const loadPrinters = async () => {
    if (!user) return;
    // Load user's own printers + all presets (RLS allows viewing is_precadastrada=true)
    const { data } = await supabase.from("impressoras").select("*")
      .or(`user_id.eq.${user.id},is_precadastrada.eq.true`);
    if (data) {
      setPrinters(data as any);
    }
  };

  useEffect(() => { loadPrinters(); }, [user]);

  const openNew = () => {
    if (!canCreatePrinter) { setUpgradeOpen(true); return; }
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (p: PrinterRow) => {
    if (p.is_precadastrada) { toast.info("Impressoras pré-cadastradas não podem ser editadas."); return; }
    setEditing(p);
    setForm({
      nome: p.nome, cinematica: p.cinematica, custo_aquisicao: p.custo_aquisicao,
      vida_util_horas: p.vida_util_horas, consumo_watts: p.consumo_watts,
      custo_manutencao_mensal: p.custo_manutencao_mensal,
      horas_uso_mensal: p.horas_uso_mensal, max_filamentos: p.max_filamentos,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;

    if (editing) {
      await supabase.from("impressoras").update({
        nome: form.nome, cinematica: form.cinematica, custo_aquisicao: form.custo_aquisicao,
        vida_util_horas: form.vida_util_horas, consumo_watts: form.consumo_watts,
        custo_manutencao_mensal: form.custo_manutencao_mensal,
        horas_uso_mensal: form.horas_uso_mensal, max_filamentos: form.max_filamentos,
      } as any).eq("id", editing.id);
      toast.success("Impressora atualizada!");
    } else {
      await supabase.from("impressoras").insert({
        user_id: user.id, nome: form.nome, cinematica: form.cinematica,
        custo_aquisicao: form.custo_aquisicao, vida_util_horas: form.vida_util_horas,
        consumo_watts: form.consumo_watts, custo_manutencao_mensal: form.custo_manutencao_mensal,
        horas_uso_mensal: form.horas_uso_mensal, max_filamentos: form.max_filamentos, is_precadastrada: false,
      } as any);
      toast.success("Impressora adicionada!");
      refresh();
    }
    setDialogOpen(false);
    loadPrinters();
  };

  const handleDelete = async (p: PrinterRow) => {
    if (p.is_precadastrada) { toast.info("Impressoras pré-cadastradas não podem ser removidas."); return; }
    await supabase.from("impressoras").delete().eq("id", p.id);
    toast.success("Impressora removida!");
    loadPrinters();
    refresh();
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const computed = computePrinterFields({
    monthlyUsageHours: form.horas_uso_mensal,
    maintenanceCostMonthly: form.custo_manutencao_mensal,
    lifespan: form.vida_util_horas,
    acquisitionCost: form.custo_aquisicao,
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
          const depPerHour = p.vida_util_horas > 0 ? p.custo_aquisicao / p.vida_util_horas : 0;
          const maintPerHour = p.horas_uso_mensal > 0 ? p.custo_manutencao_mensal / p.horas_uso_mensal : 0;
          return (
            <Card key={p.id} className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground leading-tight">{p.nome}</CardTitle>
                  {!p.is_precadastrada && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  )}
                  {p.is_precadastrada && <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">Padrão</Badge>}
                </div>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{p.cinematica}</Badge>
                  <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{p.max_filamentos} fil.</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Custo</span><span className="font-mono text-foreground">R$ {p.custo_aquisicao.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Vida útil</span><span className="font-mono text-foreground">{p.vida_util_horas.toLocaleString()}h</span></div>
                <div className="flex justify-between"><span>Consumo</span><span className="font-mono text-foreground">{p.consumo_watts}W</span></div>
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
            <div><Label className="text-foreground">Nome/Modelo</Label><Input value={form.nome} onChange={e => setField('nome', e.target.value)} className="bg-muted border-border" /></div>
            <div><Label className="text-foreground">Cinemática</Label>
              <Select value={form.cinematica} onValueChange={v => setField('cinematica', v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Cartesiana">Cartesiana</SelectItem><SelectItem value="Delta">Delta</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-foreground">Custo (R$)</Label><Input type="number" value={form.custo_aquisicao || ''} onChange={e => setField('custo_aquisicao', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Vida útil (h)</Label><Input type="number" value={form.vida_util_horas || ''} onChange={e => setField('vida_util_horas', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Consumo (W)</Label><Input type="number" value={form.consumo_watts || ''} onChange={e => setField('consumo_watts', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Manutenção/mês (R$)</Label><Input type="number" value={form.custo_manutencao_mensal || ''} onChange={e => setField('custo_manutencao_mensal', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Horas uso/mês</Label><Input type="number" value={form.horas_uso_mensal || ''} onChange={e => setField('horas_uso_mensal', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Máx filamentos</Label>
                <Select value={String(form.max_filamentos)} onValueChange={v => setField('max_filamentos', +v)}>
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

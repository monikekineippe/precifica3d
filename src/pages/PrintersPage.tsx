import { useState, useEffect } from "react";
import { Printer as PrinterIcon, Plus, Trash2, Edit2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Printer, KinematicsType } from "@/lib/types";
import { getPrinters, savePrinters, computePrinterFields } from "@/lib/store";
import { PRESET_PRINTERS } from "@/lib/printers-data";

const EMPTY_PRINTER: Omit<Printer, 'id' | 'maintenanceCostPerHour' | 'depreciationPerHour'> = {
  name: '', kinematics: 'Cartesiana', acquisitionCost: 0, lifespan: 0,
  powerConsumption: 0, maintenanceCostMonthly: 0, monthlyUsageHours: 160, maxFilaments: 1,
};

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const [form, setForm] = useState<typeof EMPTY_PRINTER>({ ...EMPTY_PRINTER });

  useEffect(() => {
    const stored = getPrinters();
    if (stored.length === 0) {
      savePrinters(PRESET_PRINTERS);
      setPrinters(PRESET_PRINTERS);
    } else {
      setPrinters(stored);
    }
  }, []);

  const save = (list: Printer[]) => { setPrinters(list); savePrinters(list); };

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_PRINTER }); setDialogOpen(true); };
  const openEdit = (p: Printer) => {
    setEditing(p);
    const { id, maintenanceCostPerHour, depreciationPerHour, ...rest } = p;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const computed = computePrinterFields(form);
    if (editing) {
      save(printers.map(p => p.id === editing.id ? { ...form, id: editing.id, ...computed } : p));
      toast.success("Impressora atualizada!");
    } else {
      const newP: Printer = { ...form, id: crypto.randomUUID(), ...computed };
      save([...printers, newP]);
      toast.success("Impressora adicionada!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    save(printers.filter(p => p.id !== id));
    toast.success("Impressora removida!");
  };

  const resetPresets = () => {
    save(PRESET_PRINTERS);
    toast.success("Impressoras resetadas para os padrões!");
  };

  const setField = <K extends keyof typeof EMPTY_PRINTER>(k: K, v: typeof EMPTY_PRINTER[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const computed = computePrinterFields(form);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Impressoras</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seu parque de impressoras 3D</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetPresets} className="border-border">
            <RotateCcw size={14} className="mr-1" /> Resetar Padrões
          </Button>
          <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground neon-glow">
            <Plus size={14} className="mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map(p => (
          <Card key={p.id} className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold text-foreground leading-tight">{p.name}</CardTitle>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1 text-muted-foreground hover:text-primary">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {p.kinematics}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-neon-blue/30 text-neon-blue">
                  {p.maxFilaments} fil.
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>Custo</span><span className="font-mono text-foreground">R$ {p.acquisitionCost.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Vida útil</span><span className="font-mono text-foreground">{p.lifespan.toLocaleString()}h</span></div>
              <div className="flex justify-between"><span>Consumo</span><span className="font-mono text-foreground">{p.powerConsumption}W</span></div>
              <div className="flex justify-between"><span>Depreciação/h</span><span className="font-mono text-primary">R$ {p.depreciationPerHour.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Manutenção/h</span><span className="font-mono text-primary">R$ {p.maintenanceCostPerHour.toFixed(2)}</span></div>
            </CardContent>
          </Card>
        ))}
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
              <Select value={form.kinematics} onValueChange={v => setField('kinematics', v as KinematicsType)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Cartesiana">Cartesiana</SelectItem><SelectItem value="Delta">Delta</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-foreground">Custo (R$)</Label><Input type="number" value={form.acquisitionCost || ''} onChange={e => setField('acquisitionCost', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Vida útil (h)</Label><Input type="number" value={form.lifespan || ''} onChange={e => setField('lifespan', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Consumo (W)</Label><Input type="number" value={form.powerConsumption || ''} onChange={e => setField('powerConsumption', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Manutenção/mês (R$)</Label><Input type="number" value={form.maintenanceCostMonthly || ''} onChange={e => setField('maintenanceCostMonthly', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Horas uso/mês</Label><Input type="number" value={form.monthlyUsageHours || ''} onChange={e => setField('monthlyUsageHours', +e.target.value)} className="bg-muted border-border" /></div>
              <div><Label className="text-foreground">Máx filamentos</Label>
                <Select value={String(form.maxFilaments)} onValueChange={v => setField('maxFilaments', +v)}>
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
    </div>
  );
}

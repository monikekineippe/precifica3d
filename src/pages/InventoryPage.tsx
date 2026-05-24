import { useState, useEffect } from "react";
import { Package, Plus, Trash2, Edit2, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  min_stock: number;
  color?: string;
  brand?: string;
  user_id: string;
}

const EMPTY_FORM = {
  name: '', type: 'filament', quantity: 0, unit: 'g',
  cost_per_unit: 0, min_stock: 0, color: '', brand: '',
};

export default function InventoryPage() {
  const { user, isAnual } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const loadInventory = async () => {
    if (!user) return;
    const { data } = await supabase.from("inventory").select("*").eq("user_id", user.id).order("name");
    if (data) setItems(data as any);
  };

  useEffect(() => { loadInventory(); }, [user]);

  if (!isAnual) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
        <div className="relative">
          <div className="filter blur-sm pointer-events-none opacity-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Card key={i} className="border-border bg-card h-40" />)}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20 rounded-xl">
            <Lock size={40} className="text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Recurso exclusivo do Plano Anual</p>
            <p className="text-muted-foreground text-sm mb-4">Gerencie seu estoque de filamentos e materiais</p>
            <Button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground neon-glow">
               Fazer Upgrade para Anual
            </Button>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </div>
    );
  }

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name, type: item.type, quantity: item.quantity, unit: item.unit,
      cost_per_unit: item.cost_per_unit, min_stock: item.min_stock, 
      color: item.color || '', brand: item.brand || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;

    const payload = {
      ...form,
      user_id: user.id
    };

    if (editing) {
      await supabase.from("inventory").update(payload).eq("id", editing.id);
      toast.success("Item atualizado!");
    } else {
      await supabase.from("inventory").insert(payload);
      toast.success("Item adicionado ao estoque!");
    }
    setDialogOpen(false);
    loadInventory();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    toast.success("Item removido!");
    loadInventory();
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus filamentos e suprimentos</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground neon-glow">
          <Plus size={14} className="mr-1" /> Adicionar Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold text-foreground leading-tight truncate max-w-[150px]">
                  {item.name}
                </CardTitle>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary capitalize">{item.type}</Badge>
                {item.color && <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{item.color}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Quantidade</span>
                <span className={`font-mono font-bold ${item.quantity <= item.min_stock ? 'text-destructive' : 'text-foreground'}`}>
                  {item.quantity} {item.unit}
                </span>
              </div>
              {item.quantity <= item.min_stock && (
                <div className="flex items-center gap-1 text-destructive font-medium text-[10px]">
                  <AlertTriangle size={10} /> Estoque baixo! (Mín: {item.min_stock}{item.unit})
                </div>
              )}
              <div className="flex justify-between">
                <span>Custo/Unidade</span>
                <span className="font-mono text-foreground">R$ {item.cost_per_unit.toFixed(2)}/{item.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Marca</span>
                <span className="text-foreground">{item.brand || '-'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <Package size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-muted-foreground">Seu estoque está vazio.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Editar" : "Novo"} Item de Estoque</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Material</Label>
              <Input id="name" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ex: PLA Premium Branco" className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filament">Filamento</SelectItem>
                    <SelectItem value="resin">Resina</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={v => setField('unit', v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Gramas (g)</SelectItem>
                    <SelectItem value="kg">Quilos (kg)</SelectItem>
                    <SelectItem value="ml">Mililitros (ml)</SelectItem>
                    <SelectItem value="unit">Unidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Qtd. Atual</Label>
                <Input type="number" value={form.quantity} onChange={e => setField('quantity', +e.target.value)} className="bg-muted border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Estoque Mín.</Label>
                <Input type="number" value={form.min_stock} onChange={e => setField('min_stock', +e.target.value)} className="bg-muted border-border" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Custo por {form.unit} (R$)</Label>
              <Input type="number" value={form.cost_per_unit} onChange={e => setField('cost_per_unit', +e.target.value)} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Input value={form.color} onChange={e => setField('color', e.target.value)} placeholder="Ex: Branco" className="bg-muted border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Ex: 3D Lab" className="bg-muted border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

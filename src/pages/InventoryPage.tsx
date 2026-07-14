import { useState, useEffect } from "react";
import { Package, Plus, Trash2, Edit2, Lock, AlertTriangle, TrendingUp, History, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UpgradeModal from "@/components/UpgradeModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  sale_price: number;
  min_stock: number;
  color?: string;
  brand?: string;
  user_id: string;
  category: 'raw_material' | 'finished_product';
  last_purchase_date?: string;
  created_at: string;
}

const EMPTY_FORM = {
  name: '', type: 'filament', quantity: 0, unit: 'g',
  cost_per_unit: 0, sale_price: 0, min_stock: 0, color: '', brand: '',
  category: 'raw_material' as 'raw_material' | 'finished_product',
  last_purchase_date: '',
};

const PURCHASE_FORM = {
  itemId: '',
  quantity: 0,
  cost: 0,
  date: new Date().toISOString().slice(0, 10),
};

export default function InventoryPage() {
  const { user, isAnual } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [purchaseForm, setPurchaseForm] = useState(PURCHASE_FORM);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw_material' | 'finished_product'>('raw_material');

  const loadInventory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
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

  const openNew = (category: 'raw_material' | 'finished_product') => {
    setEditing(null);
    setForm({ 
      ...EMPTY_FORM, 
      category, 
      type: category === 'raw_material' ? 'filament' : 'product',
      unit: category === 'raw_material' ? 'g' : 'unit'
    });
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name, 
      type: item.type, 
      quantity: item.quantity, 
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
      sale_price: Number(item.sale_price) || 0,
      min_stock: item.min_stock, 
      color: item.color || '', 
      brand: item.brand || '',
      category: item.category,
      last_purchase_date: item.last_purchase_date ? item.last_purchase_date.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const openPurchase = (item: InventoryItem) => {
    setPurchaseForm({
      itemId: item.id,
      quantity: 0,
      cost: item.cost_per_unit,
      date: new Date().toISOString().slice(0, 10),
    });
    setPurchaseDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;

    const payload: any = {
      ...form,
      user_id: user.id,
      last_purchase_date: form.last_purchase_date ? new Date(form.last_purchase_date).toISOString() : null,
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

  const handlePurchase = async () => {
    if (purchaseForm.quantity <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    
    const item = items.find(i => i.id === purchaseForm.itemId);
    if (!item) return;

    const currentQty = Number(item.quantity) || 0;
    const currentCost = Number(item.cost_per_unit) || 0;
    const addedQty = Number(purchaseForm.quantity);
    const addedCost = Number(purchaseForm.cost);

    const newQuantity = currentQty + addedQty;
    const weightedCost = newQuantity > 0
      ? ((currentQty * currentCost) + (addedQty * addedCost)) / newQuantity
      : addedCost;

    await supabase.from("inventory").update({
      quantity: newQuantity,
      cost_per_unit: weightedCost,
      last_purchase_date: purchaseForm.date ? new Date(purchaseForm.date).toISOString() : new Date().toISOString()
    }).eq("id", item.id);

    toast.success(`Entrada registrada! Novo custo médio: R$ ${weightedCost.toFixed(2)}`);
    setPurchaseDialogOpen(false);
    loadInventory();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    toast.success("Item removido!");
    loadInventory();
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const isCritical = (item: InventoryItem) =>
    item.category === 'raw_material' && Number(item.min_stock) > 0 && Number(item.quantity) <= Number(item.min_stock);

  const sortByCritical = (list: InventoryItem[]) =>
    [...list].sort((a, b) => Number(isCritical(b)) - Number(isCritical(a)));

  const rawMaterials = sortByCritical(items.filter(i => i.category === 'raw_material'));
  const finishedProducts = items.filter(i => i.category === 'finished_product');

  const InventoryGrid = ({ itemsList }: { itemsList: InventoryItem[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {itemsList.map(item => (
        <Card key={item.id} className={`bg-card transition-colors ${isCritical(item) ? 'border-destructive ring-1 ring-destructive/40' : 'border-border hover:border-primary/30'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-semibold text-foreground leading-tight truncate max-w-[150px]">
                {item.name}
              </CardTitle>
              <div className="flex gap-1">
                {item.category === 'raw_material' && (
                  <button onClick={() => openPurchase(item)} title="Registrar Entrada" className="p-1 text-muted-foreground hover:text-green-500"><Plus size={14} /></button>
                )}
                <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {isCritical(item) && (
                <Badge className="text-[10px] bg-destructive text-destructive-foreground border-transparent">
                  <AlertTriangle size={10} className="mr-1" /> Estoque crítico
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary capitalize">
                {item.type === 'filament' ? 'Filamento' : 
                 item.type === 'packaging' ? 'Embalagem' : 
                 item.type === 'accessory' ? 'Acessório' : 
                 item.type === 'product' ? 'Produto' : 'Outro'}
              </Badge>
              {item.color && <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{item.color}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <div className="flex justify-between items-center">
              <span>{item.category === 'raw_material' ? 'Quantidade' : 'Disponível'}</span>
              <span className={`font-mono font-bold ${item.category === 'raw_material' && item.quantity <= item.min_stock ? 'text-destructive' : 'text-foreground'}`}>
                {item.quantity} {item.unit}
              </span>
            </div>
            
            {item.category === 'raw_material' && item.quantity <= item.min_stock && (
              <div className="flex items-center gap-1 text-destructive font-medium text-[10px]">
                <AlertTriangle size={10} /> Estoque baixo! (Mín: {item.min_stock}{item.unit})
              </div>
            )}

            <div className="flex justify-between">
              <span>Custo/Unidade</span>
              <span className="font-mono text-foreground">R$ {Number(item.cost_per_unit).toFixed(2)}/{item.unit}</span>
            </div>

            {item.category === 'raw_material' ? (
              <>
                <div className="flex justify-between">
                  <span>Marca</span>
                  <span className="text-foreground">{item.brand || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última Compra</span>
                  <span className="text-foreground">
                    {item.last_purchase_date ? format(new Date(item.last_purchase_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>Data Entrada</span>
                <span className="text-foreground">
                  {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {itemsList.length === 0 && (
        <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
          <Package size={40} className="mx-auto text-muted-foreground mb-3 opacity-20" />
          <p className="text-muted-foreground">Nenhum item nesta categoria.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus materiais e produtos</p>
        </div>
        <Button size="sm" onClick={() => openNew(activeTab)} className="bg-primary text-primary-foreground neon-glow">
          <Plus size={14} className="mr-1" /> Adicionar {activeTab === 'raw_material' ? 'Material' : 'Produto'}
        </Button>
      </div>

      <Tabs defaultValue="raw_material" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="raw_material" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Matéria-Prima
          </TabsTrigger>
          <TabsTrigger value="finished_product" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Produtos Prontos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="raw_material">
          <InventoryGrid itemsList={rawMaterials} />
        </TabsContent>

        <TabsContent value="finished_product">
          <InventoryGrid itemsList={finishedProducts} />
        </TabsContent>
      </Tabs>

      {/* Main Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editing ? "Editar" : "Novo"} {form.category === 'raw_material' ? 'Material' : 'Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                {form.category === 'raw_material' ? 'Nome do Material' : 'Nome da Peça'}
              </Label>
              <Input 
                id="name" 
                value={form.name} 
                onChange={e => setField('name', e.target.value)} 
                placeholder={form.category === 'raw_material' ? "Ex: PLA Premium" : "Ex: Vaso Articulado"} 
                className="bg-muted border-border" 
              />
            </div>

            {form.category === 'raw_material' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setField('type', v)}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filament">Filamento</SelectItem>
                      <SelectItem value="packaging">Embalagem</SelectItem>
                      <SelectItem value="accessory">Acessório</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Marca</Label>
                  <Input value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Ex: 3D Lab" className="bg-muted border-border" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{form.category === 'raw_material' ? 'Cor/Descrição' : 'Cor/Variação'}</Label>
                <Input value={form.color} onChange={e => setField('color', e.target.value)} placeholder="Ex: Branco" className="bg-muted border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={v => setField('unit', v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Gramas (g)</SelectItem>
                    <SelectItem value="kg">Quilos (kg)</SelectItem>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{form.category === 'raw_material' ? 'Qtd. Atual' : 'Qtd. Disponível'}</Label>
                <Input type="number" value={form.quantity} onChange={e => setField('quantity', +e.target.value)} className="bg-muted border-border" />
              </div>
              {form.category === 'raw_material' && (
                <div className="grid gap-2">
                  <Label>Estoque Mín.</Label>
                  <Input type="number" value={form.min_stock} onChange={e => setField('min_stock', +e.target.value)} className="bg-muted border-border" />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Custo Unitário (R$)</Label>
              <Input type="number" value={form.cost_per_unit} onChange={e => setField('cost_per_unit', +e.target.value)} className="bg-muted border-border" />
            </div>

            {form.category === 'raw_material' && (
              <div className="grid gap-2">
                <Label>Data da última compra</Label>
                <Input type="date" value={form.last_purchase_date} onChange={e => setField('last_purchase_date', e.target.value)} className="bg-muted border-border" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Registrar Compra</DialogTitle>
            <DialogDescription>
              Adicione estoque para o material selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Quantidade a Adicionar</Label>
              <Input 
                type="number" 
                value={purchaseForm.quantity} 
                onChange={e => setPurchaseForm(f => ({ ...f, quantity: +e.target.value }))} 
                className="bg-muted border-border" 
              />
            </div>
            <div className="grid gap-2">
              <Label>Novo Custo Unitário (R$)</Label>
              <Input 
                type="number" 
                value={purchaseForm.cost} 
                onChange={e => setPurchaseForm(f => ({ ...f, cost: +e.target.value }))} 
                className="bg-muted border-border" 
              />
              <p className="text-[10px] text-muted-foreground">O custo médio ponderado será recalculado automaticamente.</p>
            </div>
            <div className="grid gap-2">
              <Label>Data da compra</Label>
              <Input
                type="date"
                value={purchaseForm.date}
                onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePurchase} className="bg-green-600 hover:bg-green-700 text-white">
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

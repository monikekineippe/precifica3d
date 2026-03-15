export type KinematicsType = 'Cartesiana' | 'Delta';

export interface Printer {
  id: string;
  name: string;
  kinematics: KinematicsType;
  acquisitionCost: number;
  lifespan: number; // hours
  powerConsumption: number; // watts
  maintenanceCostMonthly: number;
  monthlyUsageHours: number;
  maxFilaments: number;
  // Computed
  maintenanceCostPerHour: number;
  depreciationPerHour: number;
}

export interface FilamentEntry {
  id: string;
  color: string;
  type: string;
  brand: string;
  costPerKg: number;
  weightUsed: number; // grams
  computedCost: number;
}

export interface Quote {
  id: string;
  pieceName: string;
  printerId: string;
  printerName: string;
  printTimeHours: number;
  printTimeMinutes: number;
  filaments: FilamentEntry[];
  totalWeight: number;
  totalFilamentCost: number;
  state: string;
  city: string;
  distributor: string;
  tariff: number;
  energyCost: number;
  laborRate: number;
  laborHours: number;
  laborCost: number;
  laborPercentage: number;
  maintenanceCost: number;
  depreciationCost: number;
  packagingType: string;
  packagingCost: number;
  profitMargin: number;
  taxRate: number;
  totalCost: number;
  suggestedPrice: number;
  minimumPrice: number;
  createdAt: string;
}

export interface AppSettings {
  defaultTariff: number;
  defaultMargin: number;
  defaultTaxRate: number;
}

export const FILAMENT_TYPES = [
  'PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'FLEX', 'Nylon', 'PC', 'HIPS', 'PVA', 'Wood', 'Carbon Fiber'
];

export const PACKAGING_TYPES = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'bag', label: 'Saquinho' },
  { value: 'simple-box', label: 'Caixa simples' },
  { value: 'custom-box', label: 'Caixa personalizada' },
];

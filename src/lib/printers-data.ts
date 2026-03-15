import type { Printer, KinematicsType } from './types';
import { computePrinterFields } from './store';

let _id = 0;
function makeId() { return `preset-${++_id}`; }

function p(
  name: string, cost: number, life: number, watts: number,
  maint: number, maxFil: number, kin: KinematicsType, monthlyHours = 160
): Printer {
  const base = {
    id: makeId(), name, kinematics: kin,
    acquisitionCost: cost, lifespan: life,
    powerConsumption: watts, maintenanceCostMonthly: maint,
    monthlyUsageHours: monthlyHours, maxFilaments: maxFil,
  };
  return { ...base, ...computePrinterFields(base) } as Printer;
}

export const PRESET_PRINTERS: Printer[] = [
  // Bambu Lab
  p('Bambu Lab A1', 2800, 5000, 350, 50, 1, 'Cartesiana'),
  p('Bambu Lab A1 + AMS Lite', 3400, 5000, 360, 55, 4, 'Cartesiana'),
  p('Bambu Lab P1S', 5500, 6000, 400, 60, 1, 'Cartesiana'),
  p('Bambu Lab P1S + AMS', 6800, 6000, 420, 70, 4, 'Cartesiana'),
  p('Bambu Lab X1 Carbon', 8500, 7000, 500, 80, 1, 'Cartesiana'),
  p('Bambu Lab X1 Carbon + AMS', 10000, 7000, 520, 90, 4, 'Cartesiana'),
  p('Bambu Lab X1 Carbon + 4x AMS', 15000, 7000, 580, 120, 16, 'Cartesiana'),
  // Creality
  p('Creality Ender 3 V2', 1200, 4000, 270, 30, 1, 'Cartesiana'),
  p('Creality Ender 3 S1 Pro', 1800, 4500, 300, 35, 1, 'Cartesiana'),
  p('Creality CR-10', 2000, 4500, 400, 40, 1, 'Cartesiana'),
  p('Creality CR-10 Smart Pro', 3200, 5000, 450, 50, 1, 'Cartesiana'),
  // Prusa
  p('Prusa MK4', 3500, 8000, 300, 50, 1, 'Cartesiana'),
  p('Prusa MK4 + MMU3', 4800, 8000, 320, 65, 5, 'Cartesiana'),
  p('Prusa Mini+', 1800, 6000, 180, 30, 1, 'Cartesiana'),
  p('Prusa XL (5 toolheads)', 12000, 7000, 600, 100, 5, 'Cartesiana'),
  // FLSUN
  p('FLSUN Q5', 900, 3500, 200, 25, 1, 'Delta'),
  p('FLSUN Super Racer (SR)', 1800, 5000, 360, 40, 1, 'Delta'),
  p('FLSUN V400', 3500, 5500, 400, 55, 1, 'Delta'),
  p('FLSUN V400 Pro', 4800, 6000, 450, 65, 1, 'Delta'),
];

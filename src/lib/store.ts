import type { Printer, Quote, AppSettings } from './types';

const KEYS = {
  printers: 'pp_printers',
  quotes: 'pp_quotes',
  settings: 'pp_settings',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Printers
export function getPrinters(): Printer[] {
  return get<Printer[]>(KEYS.printers, []);
}
export function savePrinters(printers: Printer[]) {
  set(KEYS.printers, printers);
}
export function addPrinter(printer: Printer) {
  const all = getPrinters();
  all.push(printer);
  savePrinters(all);
}
export function updatePrinter(printer: Printer) {
  const all = getPrinters().map(p => p.id === printer.id ? printer : p);
  savePrinters(all);
}
export function deletePrinter(id: string) {
  savePrinters(getPrinters().filter(p => p.id !== id));
}

// Quotes
export function getQuotes(): Quote[] {
  return get<Quote[]>(KEYS.quotes, []);
}
export function saveQuotes(quotes: Quote[]) {
  set(KEYS.quotes, quotes);
}
export function addQuote(quote: Quote) {
  const all = getQuotes();
  all.push(quote);
  saveQuotes(all);
}
export function updateQuote(quote: Quote) {
  const all = getQuotes().map(q => q.id === quote.id ? quote : q);
  saveQuotes(all);
}
export function deleteQuote(id: string) {
  saveQuotes(getQuotes().filter(q => q.id !== id));
}

// Settings
export const DEFAULT_SETTINGS: AppSettings = {
  defaultTariff: 0.85,
  defaultMargin: 50,
  defaultTaxRate: 6,
};
export function getSettings(): AppSettings {
  return get<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}
export function saveSettings(settings: AppSettings) {
  set(KEYS.settings, settings);
}

// Compute printer derived fields
export function computePrinterFields(p: Partial<Printer>): Pick<Printer, 'maintenanceCostPerHour' | 'depreciationPerHour'> {
  const maintenanceCostPerHour = (p.monthlyUsageHours && p.maintenanceCostMonthly)
    ? p.maintenanceCostMonthly / p.monthlyUsageHours
    : 0;
  const depreciationPerHour = (p.lifespan && p.acquisitionCost)
    ? p.acquisitionCost / p.lifespan
    : 0;
  return { maintenanceCostPerHour, depreciationPerHour };
}

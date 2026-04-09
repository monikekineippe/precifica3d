// Tarifas médias residenciais por estado (ANEEL / distribuidoras principais)
// Fonte: dados públicos ANEEL — valores médios em R$/kWh (sem bandeira tarifária)
// Atualizado: referência 2024/2025

export interface TariffInfo {
  distribuidora: string;
  tarifa: number;
  referencia: string;
}

// Mapa UF → lista de distribuidoras com suas tarifas
const TARIFFS_BY_STATE: Record<string, TariffInfo[]> = {
  AC: [{ distribuidora: "Energisa Acre", tarifa: 0.92, referencia: "ANEEL 2024" }],
  AL: [{ distribuidora: "Equatorial Alagoas", tarifa: 0.82, referencia: "ANEEL 2024" }],
  AP: [{ distribuidora: "CEA Equatorial", tarifa: 0.73, referencia: "ANEEL 2024" }],
  AM: [{ distribuidora: "Amazonas Energia", tarifa: 0.89, referencia: "ANEEL 2024" }],
  BA: [
    { distribuidora: "Neoenergia Coelba", tarifa: 0.78, referencia: "ANEEL 2024" },
  ],
  CE: [{ distribuidora: "Enel Ceará", tarifa: 0.76, referencia: "ANEEL 2024" }],
  DF: [{ distribuidora: "Neoenergia Brasília", tarifa: 0.74, referencia: "ANEEL 2024" }],
  ES: [{ distribuidora: "EDP Espírito Santo", tarifa: 0.79, referencia: "ANEEL 2024" }],
  GO: [{ distribuidora: "Equatorial Goiás", tarifa: 0.82, referencia: "ANEEL 2024" }],
  MA: [{ distribuidora: "Equatorial Maranhão", tarifa: 0.80, referencia: "ANEEL 2024" }],
  MT: [{ distribuidora: "Energisa Mato Grosso", tarifa: 0.85, referencia: "ANEEL 2024" }],
  MS: [{ distribuidora: "Energisa MS", tarifa: 0.80, referencia: "ANEEL 2024" }],
  MG: [
    { distribuidora: "CEMIG", tarifa: 0.85, referencia: "ANEEL 2024" },
  ],
  PA: [{ distribuidora: "Equatorial Pará", tarifa: 0.86, referencia: "ANEEL 2024" }],
  PB: [{ distribuidora: "Energisa Paraíba", tarifa: 0.78, referencia: "ANEEL 2024" }],
  PR: [{ distribuidora: "Copel", tarifa: 0.72, referencia: "ANEEL 2024" }],
  PE: [{ distribuidora: "Neoenergia Pernambuco", tarifa: 0.77, referencia: "ANEEL 2024" }],
  PI: [{ distribuidora: "Equatorial Piauí", tarifa: 0.76, referencia: "ANEEL 2024" }],
  RJ: [
    { distribuidora: "Enel Rio", tarifa: 0.90, referencia: "ANEEL 2024" },
    { distribuidora: "Light", tarifa: 0.88, referencia: "ANEEL 2024" },
  ],
  RN: [{ distribuidora: "Neoenergia Cosern", tarifa: 0.77, referencia: "ANEEL 2024" }],
  RS: [
    { distribuidora: "CEEE Equatorial", tarifa: 0.82, referencia: "ANEEL 2024" },
    { distribuidora: "RGE Sul", tarifa: 0.80, referencia: "ANEEL 2024" },
  ],
  RO: [{ distribuidora: "Energisa Rondônia", tarifa: 0.84, referencia: "ANEEL 2024" }],
  RR: [{ distribuidora: "Roraima Energia", tarifa: 0.89, referencia: "ANEEL 2024" }],
  SC: [{ distribuidora: "Celesc", tarifa: 0.71, referencia: "ANEEL 2024" }],
  SP: [
    { distribuidora: "Enel São Paulo", tarifa: 0.78, referencia: "ANEEL 2024" },
    { distribuidora: "CPFL Paulista", tarifa: 0.80, referencia: "ANEEL 2024" },
    { distribuidora: "EDP São Paulo", tarifa: 0.76, referencia: "ANEEL 2024" },
  ],
  SE: [{ distribuidora: "Energisa Sergipe", tarifa: 0.79, referencia: "ANEEL 2024" }],
  TO: [{ distribuidora: "Energisa Tocantins", tarifa: 0.81, referencia: "ANEEL 2024" }],
};

/**
 * Retorna a tarifa para um estado. Se houver múltiplas distribuidoras,
 * retorna a primeira (mais comum / maior área de cobertura).
 */
export function getTariffByState(uf: string): TariffInfo {
  const list = TARIFFS_BY_STATE[uf];
  if (list && list.length > 0) return list[0];
  return { distribuidora: "Distribuidora local", tarifa: 0.85, referencia: "padrão" };
}

/**
 * Retorna todas as distribuidoras de um estado (para seleção manual se necessário).
 */
export function getDistributorsByState(uf: string): TariffInfo[] {
  return TARIFFS_BY_STATE[uf] || [{ distribuidora: "Distribuidora local", tarifa: 0.85, referencia: "padrão" }];
}

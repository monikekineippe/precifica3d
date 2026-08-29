export interface SalesChannel {
  id: string;
  name: string;
  /** Comissão percentual sobre o preço de venda */
  percent: number;
  /** Taxa fixa por item, em reais */
  fixed: number;
  /** Se informado, a taxa fixa só vale para preços abaixo deste valor */
  fixedBelow?: number;
  /** Aplica a taxa de cartão configurada pelo usuário */
  applyCardFee?: boolean;
}

export const DEFAULT_SALES_CHANNELS: SalesChannel[] = [
  { id: "shopee", name: "Shopee", percent: 20, fixed: 4 },
  { id: "mercado_livre", name: "Mercado Livre", percent: 13, fixed: 6.75, fixedBelow: 79 },
  { id: "amazon", name: "Amazon", percent: 15, fixed: 0 },
  { id: "tiktok", name: "TikTok Shop", percent: 8, fixed: 0 },
  { id: "loja_propria", name: "Loja própria/Tray", percent: 5, fixed: 0, applyCardFee: true },
  { id: "venda_direta", name: "Venda direta", percent: 0, fixed: 0 },
];

export function mergeChannelConfig(saved: any): SalesChannel[] {
  if (!saved || typeof saved !== "object") return DEFAULT_SALES_CHANNELS;
  return DEFAULT_SALES_CHANNELS.map((c) => {
    const s = saved[c.id];
    if (!s) return c;
    return {
      ...c,
      percent: typeof s.percent === "number" ? s.percent : c.percent,
      fixed: typeof s.fixed === "number" ? s.fixed : c.fixed,
    };
  });
}

export function channelConfigToJson(channels: SalesChannel[]) {
  return channels.reduce<Record<string, { percent: number; fixed: number }>>((acc, c) => {
    acc[c.id] = { percent: c.percent, fixed: c.fixed };
    return acc;
  }, {});
}

export interface ChannelResult {
  id: string;
  name: string;
  percent: number;
  fixed: number;
  price: number;
  profit: number;
}

/**
 * Calcula o preço no canal preservando a margem líquida escolhida.
 * P - P*(impostos + comissão + cartão) - taxa fixa - custo = margem * P
 */
export function calcChannelPrice(
  channel: SalesChannel,
  opts: {
    totalCost: number;
    taxRate: number;
    cardFeePercent: number;
    applyCardFee: boolean;
    targetMarginPct: number;
  }
): ChannelResult {
  const { totalCost, taxRate, cardFeePercent, applyCardFee, targetMarginPct } = opts;
  const useCard = applyCardFee || channel.applyCardFee;
  const deductions = (taxRate + channel.percent + (useCard ? cardFeePercent : 0)) / 100;
  const m = Math.max(0, Math.min(0.95, targetMarginPct / 100));
  const denom = 1 - deductions - m;

  const solve = (fixed: number) =>
    denom > 0 ? (totalCost + fixed) / denom : 0;

  let fixed = channel.fixed;
  let price = solve(fixed);
  if (channel.fixedBelow !== undefined && price >= channel.fixedBelow) {
    fixed = 0;
    price = solve(0);
    if (price < channel.fixedBelow) {
      fixed = channel.fixed;
      price = solve(fixed);
    }
  }

  const profit = price - price * deductions - fixed - totalCost;
  return {
    id: channel.id,
    name: channel.name,
    percent: channel.percent,
    fixed,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    profit: Number.isFinite(profit) ? profit : 0,
  };
}

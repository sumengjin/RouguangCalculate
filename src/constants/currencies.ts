export interface CurrencyMeta {
  code: string;
  symbol: string;
  nameZh: string;
  decimals: number;
}

export const GLOBAL_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', symbol: '$', nameZh: '美元', decimals: 2 },
  { code: 'EUR', symbol: '€', nameZh: '歐元', decimals: 2 },
  { code: 'JPY', symbol: '¥', nameZh: '日圓', decimals: 0 },
  { code: 'KRW', symbol: '₩', nameZh: '韓元', decimals: 0 },
  { code: 'GBP', symbol: '£', nameZh: '英鎊', decimals: 2 },
  { code: 'TWD', symbol: 'NT$', nameZh: '新台幣', decimals: 0 },
  { code: 'HKD', symbol: 'HK$', nameZh: '港元', decimals: 2 },
  { code: 'CNY', symbol: '¥', nameZh: '人民幣', decimals: 2 },
  { code: 'SGD', symbol: 'S$', nameZh: '新加坡幣', decimals: 2 },
  { code: 'THB', symbol: '฿', nameZh: '泰銖', decimals: 2 },
  { code: 'AUD', symbol: 'A$', nameZh: '澳幣', decimals: 2 },
  { code: 'CAD', symbol: 'C$', nameZh: '加幣', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', nameZh: '瑞士法郎', decimals: 2 },
  { code: 'MYR', symbol: 'RM', nameZh: '馬來西亞令吉', decimals: 2 },
  { code: 'VND', symbol: '₫', nameZh: '越南盾', decimals: 0 },
  { code: 'NZD', symbol: 'NZ$', nameZh: '紐西蘭幣', decimals: 2 },
  { code: 'PHP', symbol: '₱', nameZh: '菲律賓披索', decimals: 2 },
  { code: 'IDR', symbol: 'Rp', nameZh: '印尼盾', decimals: 0 },
  { code: 'INR', symbol: '₹', nameZh: '印度盧比', decimals: 2 },
];

export const CURRENCY_MAP: Record<string, CurrencyMeta> = Object.fromEntries(
  GLOBAL_CURRENCIES.map((c) => [c.code, c])
);

export function getCurrencyMeta(code: string): CurrencyMeta {
  return CURRENCY_MAP[code] || { code, symbol: code, nameZh: code, decimals: 2 };
}

export function formatCurrencyAmount(amount: number, code: string, forceDecimals?: number): string {
  const meta = getCurrencyMeta(code);
  const decimals = forceDecimals !== undefined ? forceDecimals : meta.decimals;
  const fixed = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals === 0 ? 0 : 0,
      maximumFractionDigits: decimals,
    }).format(fixed);
  } catch {
    return fixed.toFixed(decimals);
  }
}

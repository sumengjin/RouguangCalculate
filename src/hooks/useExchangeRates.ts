import { useState, useEffect, useCallback } from 'react';
import { writeNativePref, readNativePref } from '../utils/persistentStorage';

interface RateCache {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  fetchedAtMs: number;
  source: 'live' | 'cache' | 'fallback';
}

const RATES_CACHE_KEY = 'atelier_calc_fx_rates_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Baseline offline fallback relative to 1 USD (used only if both cache and network are unavailable)
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.94,
  JPY: 154.5,
  KRW: 1395,
  GBP: 0.79,
  TWD: 32.5,
  HKD: 7.78,
  CNY: 7.24,
  SGD: 1.34,
  THB: 34.8,
  AUD: 1.54,
  CAD: 1.4,
  CHF: 0.88,
  MYR: 4.47,
  VND: 25400,
  NZD: 1.7,
  PHP: 58.8,
  IDR: 15900,
  INR: 84.4,
};

function readCachedRates(): RateCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateCache;
    if (parsed && parsed.rates && parsed.rates.USD) {
      return { ...parsed, source: 'cache' };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function useExchangeRates() {
  const [cache, setCache] = useState<RateCache>(() => {
    const existing = readCachedRates();
    if (existing) return existing;
    return {
      base: 'USD',
      rates: FALLBACK_USD_RATES,
      updatedAt: '離線預設基準',
      fetchedAtMs: 0,
      source: 'fallback',
    };
  });

  useEffect(() => {
    readNativePref<RateCache>(RATES_CACHE_KEY).then((nativeCache) => {
      if (nativeCache && nativeCache.rates && nativeCache.rates.USD) {
        setCache((prev) =>
          nativeCache.fetchedAtMs > prev.fetchedAtMs
            ? { ...nativeCache, source: 'cache' }
            : prev
        );
      }
    });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        result?: string;
        time_last_update_utc?: string;
        rates?: Record<string, number>;
      };
      if (data.result !== 'success' || !data.rates) {
        throw new Error('無效的匯率資料格式');
      }

      const dateText = data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toLocaleDateString('zh-Hant', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : new Date().toLocaleDateString('zh-Hant');

      const next: RateCache = {
        base: 'USD',
        rates: data.rates,
        updatedAt: dateText,
        fetchedAtMs: Date.now(),
        source: 'live',
      };
      setCache(next);
      void writeNativePref(RATES_CACHE_KEY, next);
    } catch {
      setError('無法連線取得即時匯率，目前使用本機快取或基準匯率');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isStale = Date.now() - cache.fetchedAtMs > CACHE_TTL_MS;
    if (isStale) {
      void refreshRates();
    }
  }, [cache.fetchedAtMs, refreshRates]);

  const convert = useCallback(
    (amount: number, fromCode: string, toCode: string): number => {
      if (fromCode === toCode) return amount;
      const fromRate = cache.rates[fromCode] ?? FALLBACK_USD_RATES[fromCode];
      const toRate = cache.rates[toCode] ?? FALLBACK_USD_RATES[toCode];
      if (!fromRate || !toRate) return amount;
      return (amount / fromRate) * toRate;
    },
    [cache.rates]
  );

  const getRate = useCallback(
    (fromCode: string, toCode: string): number => {
      if (fromCode === toCode) return 1;
      const fromRate = cache.rates[fromCode] ?? FALLBACK_USD_RATES[fromCode];
      const toRate = cache.rates[toCode] ?? FALLBACK_USD_RATES[toCode];
      if (!fromRate || !toRate) return 1;
      return toRate / fromRate;
    },
    [cache.rates]
  );

  return {
    rates: cache.rates,
    updatedAt: cache.updatedAt,
    source: cache.source,
    isLoading,
    error,
    refreshRates,
    convert,
    getRate,
  };
}

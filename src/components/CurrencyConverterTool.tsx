import React, { useState } from 'react';
import { ArrowUpDown, RefreshCw, Copy, Check, BookmarkPlus, AlertCircle } from 'lucide-react';
import { ThemeTokens } from '../constants/themes';
import {
  GLOBAL_CURRENCIES,
  getCurrencyMeta,
  formatCurrencyAmount,
} from '../constants/currencies';
import { usePersistedState } from '../hooks/usePersistedState';

interface CurrencyConverterToolProps {
  tokens: ThemeTokens;
  updatedAt: string;
  source: 'live' | 'cache' | 'fallback';
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  convert: (amount: number, fromCode: string, toCode: string) => number;
  getRate: (fromCode: string, toCode: string) => number;
  onSaveToHistory: (expression: string, result: string, note?: string) => void;
}

const BOARD_CURRENCIES = ['USD', 'EUR', 'JPY', 'KRW', 'GBP', 'TWD', 'HKD', 'CNY', 'SGD', 'THB'];

export const CurrencyConverterTool: React.FC<CurrencyConverterToolProps> = ({
  tokens,
  updatedAt,
  source,
  isLoading,
  error,
  onRefresh,
  convert,
  getRate,
  onSaveToHistory,
}) => {
  const [amountInput, setAmountInput] = usePersistedState<string>('atelier_fx_amount_v1', '100');
  const [fromCode, setFromCode] = usePersistedState<string>('atelier_fx_from_v1', 'USD');
  const [toCode, setToCode] = usePersistedState<string>('atelier_fx_to_v1', 'JPY');
  const [useCustomRate, setUseCustomRate] = usePersistedState<boolean>('atelier_fx_use_custom_v1', false);
  const [customRateInput, setCustomRateInput] = usePersistedState<string>('atelier_fx_custom_rate_v1', '');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const amountNum = Math.max(0, parseFloat(amountInput) || 0);
  const marketRate = getRate(fromCode, toCode);
  const parsedCustom = parseFloat(customRateInput);
  const activeRate = useCustomRate && parsedCustom > 0 ? parsedCustom : marketRate;
  const convertedAmount = useCustomRate && parsedCustom > 0
    ? amountNum * parsedCustom
    : convert(amountNum, fromCode, toCode);

  const fromMeta = getCurrencyMeta(fromCode);
  const toMeta = getCurrencyMeta(toCode);

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
    if (useCustomRate && parsedCustom > 0) {
      setCustomRateInput((1 / parsedCustom).toFixed(4));
    }
  };

  const handleCopy = () => {
    const text = `${formatCurrencyAmount(amountNum, fromCode)} ${fromCode} = ${formatCurrencyAmount(convertedAmount, toCode)} ${toCode}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  const handleSave = () => {
    if (amountNum <= 0) return;
    const expr = `${formatCurrencyAmount(amountNum, fromCode)} ${fromCode} → ${toCode}`;
    const res = `${toMeta.symbol} ${formatCurrencyAmount(convertedAmount, toCode)}`;
    onSaveToHistory(expr, res, '匯率換算');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1600);
  };

  const sourceLabel =
    source === 'live' ? '即時市場匯率' : source === 'cache' ? '本機快取匯率' : '離線基準匯率';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Card: Main Dual Currency Converter */}
      <section
        aria-label="雙幣別匯率換算"
        className={`lg:col-span-6 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className={`text-xl font-semibold ${tokens.textPrimary}`}>全球匯率轉換</h2>
              <p className={`text-xs mt-1 ${tokens.textMuted}`}>
                {sourceLabel} · 更新：{updatedAt}
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isLoading ? '更新中' : '更新匯率'}</span>
            </button>
          </div>

          {error && (
            <div className={`mb-4 px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${tokens.surfaceMuted} ${tokens.border} ${tokens.accentText}`}>
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Source Currency */}
          <div className={`rounded-2xl border p-4 mb-3 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor="fx-from-amount" className={`text-xs font-medium ${tokens.textSecondary}`}>
                持有金額 ({fromMeta.nameZh})
              </label>
              <select
                aria-label="選擇來源幣別"
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl border text-xs font-semibold focus:outline-none ${tokens.surface} ${tokens.border} ${tokens.textPrimary}`}
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.nameZh}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-calc-mono text-lg font-medium ${tokens.textMuted}`}>
                {fromMeta.symbol}
              </span>
              <input
                id="fx-from-amount"
                type="number"
                min="0"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={`w-full bg-transparent font-calc-mono text-3xl font-semibold focus:outline-none tabular-nums ${tokens.textPrimary}`}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {['100', '500', '1000', '10000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountInput(preset)}
                  className={`min-h-[36px] rounded-lg border font-calc-mono text-xs font-medium transition-colors ${tokens.keyDigit}`}
                >
                  {Number(preset).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1.5 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="互換來源與目標幣別"
              className={`min-h-[44px] min-w-[44px] px-4 rounded-xl border inline-flex items-center gap-2 text-xs font-medium transition-transform duration-150 active:scale-[0.97] ${tokens.surface} ${tokens.border} ${tokens.textPrimary}`}
            >
              <ArrowUpDown className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
              <span>互換幣別</span>
            </button>
          </div>

          {/* Target Currency */}
          <div className={`rounded-2xl border p-4 mt-1.5 mb-5 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`text-xs font-medium ${tokens.textSecondary}`}>
                換算結果 ({toMeta.nameZh})
              </span>
              <select
                aria-label="選擇目標幣別"
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl border text-xs font-semibold focus:outline-none ${tokens.surface} ${tokens.border} ${tokens.textPrimary}`}
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.nameZh}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-calc-mono text-lg font-medium ${tokens.textMuted}`}>
                {toMeta.symbol}
              </span>
              <div className={`font-calc-mono text-3xl sm:text-4xl font-semibold tabular-nums break-all ${tokens.accentText}`}>
                {formatCurrencyAmount(convertedAmount, toCode)}
              </div>
            </div>
            <div className={`mt-2 font-calc-mono text-xs ${tokens.textMuted}`}>
              1 {fromCode} = {activeRate >= 10 ? activeRate.toFixed(2) : activeRate.toFixed(4)} {toCode}
            </div>
          </div>

          {/* Optional custom bank/card rate */}
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                <input
                  type="checkbox"
                  checked={useCustomRate}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseCustomRate(checked);
                    if (checked && !customRateInput) {
                      setCustomRateInput(
                        marketRate >= 10 ? marketRate.toFixed(2) : marketRate.toFixed(4)
                      );
                    }
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className={tokens.textSecondary}>自訂刷卡 / 換匯匯率</span>
              </label>
              {useCustomRate && (
                <div className="flex items-center gap-2">
                  <span className={`font-calc-mono text-xs ${tokens.textMuted}`}>1 {fromCode} =</span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={customRateInput}
                    onChange={(e) => setCustomRateInput(e.target.value)}
                    aria-label="自訂匯率數值"
                    className={`w-24 px-2.5 py-1.5 min-h-[36px] rounded-lg border font-calc-mono text-xs ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                  />
                  <span className={`font-calc-mono text-xs ${tokens.textMuted}`}>{toCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`min-h-[44px] rounded-xl border inline-flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${tokens.keyDigit}`}
          >
            {copied ? (
              <>
                <Check className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
                <span className={tokens.accentText}>已複製換算</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>複製換算結果</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`min-h-[44px] rounded-xl inline-flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${tokens.accentBg} ${tokens.accentBgHover} ${tokens.accentFg}`}
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>已存入紀錄</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
                <span>存入計算紀錄</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Right Card: Global Multi-Currency Reference Board */}
      <aside
        aria-label="全球主要幣別即時對照"
        className={`lg:col-span-6 rounded-3xl border p-5 sm:p-7 flex flex-col ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div className={`pb-4 border-b ${tokens.border}`}>
          <h3 className={`text-lg font-semibold ${tokens.textPrimary}`}>多國幣別即時對照</h3>
          <p className={`text-xs mt-1 ${tokens.textMuted}`}>
            以目前輸入的 <span className="font-calc-mono">{formatCurrencyAmount(amountNum, fromCode)} {fromCode}</span> 同步試算，點擊任一列可切換為目標幣別
          </p>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/5 mt-2 flex-1">
          {BOARD_CURRENCIES.filter((code) => code !== fromCode).map((code) => {
            const meta = getCurrencyMeta(code);
            const val = convert(amountNum, fromCode, code);
            const unitRate = getRate(fromCode, code);
            const isTarget = code === toCode;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setToCode(code)}
                className={`w-full py-3.5 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 text-left transition-colors ${
                  isTarget ? tokens.accentSoftBg : tokens.hoverSurfaceMuted
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-calc-mono text-sm font-semibold ${isTarget ? tokens.accentText : tokens.textPrimary}`}>
                      {meta.code}
                    </span>
                    <span className={`text-xs ${tokens.textSecondary}`}>{meta.nameZh}</span>
                  </div>
                  <div className={`font-calc-mono text-[11px] mt-0.5 ${tokens.textMuted}`}>
                    1 {fromCode} = {unitRate >= 10 ? unitRate.toFixed(2) : unitRate.toFixed(4)} {code}
                  </div>
                </div>

                <div className={`font-calc-mono text-base sm:text-lg font-semibold tabular-nums shrink-0 ${isTarget ? tokens.accentText : tokens.textPrimary}`}>
                  {meta.symbol} {formatCurrencyAmount(val, code)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

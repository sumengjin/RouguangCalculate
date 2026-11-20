import React, { useState } from 'react';
import { Copy, Check, Plus, Minus, BookmarkPlus } from 'lucide-react';
import { ThemeTokens } from '../constants/themes';
import {
  GLOBAL_CURRENCIES,
  getCurrencyMeta,
  formatCurrencyAmount,
} from '../constants/currencies';

interface ShoppingSplitToolProps {
  tokens: ThemeTokens;
  convert: (amount: number, fromCode: string, toCode: string) => number;
  onSaveToHistory: (expression: string, result: string, note?: string) => void;
}

const OFF_PRESETS = [10, 15, 20, 25, 30, 50];

const TIP_PRESETS = [
  { label: '0%', val: 0 },
  { label: '10%', val: 10 },
  { label: '15%', val: 15 },
  { label: '18%', val: 18 },
  { label: '20%', val: 20 },
  { label: '自訂', val: -1 },
];

export const ShoppingSplitTool: React.FC<ShoppingSplitToolProps> = ({
  tokens,
  convert,
  onSaveToHistory,
}) => {
  // Reference home currency for travel comparison
  const [homeCurrency, setHomeCurrency] = useState<string>('TWD');

  // Global Discount & Tax calculator state
  const [shopCurrency, setShopCurrency] = useState<string>('USD');
  const [originalPrice, setOriginalPrice] = useState<string>('120');
  const [discountMode, setDiscountMode] = useState<'off' | 'fold'>('off');
  const [offPercent, setOffPercent] = useState<number>(20); // 20 = 20% OFF (8折)
  const [taxPercent, setTaxPercent] = useState<string>('0'); // positive = sales tax, negative = tax-free refund
  const [thresholdAmount, setThresholdAmount] = useState<string>('');
  const [thresholdDeduct, setThresholdDeduct] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Global Split bill state
  const [billCurrency, setBillCurrency] = useState<string>('USD');
  const [billAmount, setBillAmount] = useState<string>('96');
  const [billTaxRate, setBillTaxRate] = useState<string>('0');
  const [tipRate, setTipRate] = useState<number>(15);
  const [customTip, setCustomTip] = useState<string>('12');
  const [peopleCount, setPeopleCount] = useState<number>(4);
  const [roundingMode, setRoundingMode] = useState<'exact' | 'roundInt' | 'ceilInt'>('exact');
  const [copiedSplit, setCopiedSplit] = useState<boolean>(false);

  // Discount math (supports global % OFF, tax/tax-free, and threshold rebate)
  const shopMeta = getCurrencyMeta(shopCurrency);
  const homeMeta = getCurrencyMeta(homeCurrency);
  const priceNum = Math.max(0, parseFloat(originalPrice) || 0);
  const payRatio = (100 - offPercent) / 100;
  const afterDiscount = priceNum * payRatio;

  const threshNum = Math.max(0, parseFloat(thresholdAmount) || 0);
  const deductNum = Math.max(0, parseFloat(thresholdDeduct) || 0);
  const qualifiesThreshold = threshNum > 0 && deductNum > 0 && afterDiscount >= threshNum;
  const thresholdTimes = qualifiesThreshold ? Math.floor(afterDiscount / threshNum) : 0;
  const afterRebate = Math.max(0, afterDiscount - thresholdTimes * deductNum);

  const taxNum = parseFloat(taxPercent) || 0;
  const finalPrice = Math.max(0, afterRebate * (1 + taxNum / 100));
  const totalSaved = Math.max(0, priceNum - afterRebate);
  const effectiveOff = priceNum > 0 ? Math.max(0, (1 - finalPrice / priceNum) * 100) : 0;
  const convertedFinalPrice = convert(finalPrice, shopCurrency, homeCurrency);

  const formatFoldLabel = (offPct: number) => {
    const fold = (100 - offPct) / 10;
    return Number.isInteger(fold) ? `${fold} 折` : `${fold.toFixed(1)} 折`;
  };

  const handleSaveDiscount = () => {
    if (priceNum <= 0) return;
    const taxStr = taxNum !== 0 ? ` (${taxNum > 0 ? `+${taxNum}%稅` : `${taxNum}%退稅`})` : '';
    const expr = `${shopMeta.symbol}${priceNum} × ${100 - offPercent}%${taxStr}`;
    const res = `${shopMeta.symbol} ${formatCurrencyAmount(finalPrice, shopCurrency)}`;
    onSaveToHistory(expr, res, '全球購物折扣');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  // Global Split bill math
  const billMeta = getCurrencyMeta(billCurrency);
  const billNum = Math.max(0, parseFloat(billAmount) || 0);
  const localTaxPct = Math.max(0, parseFloat(billTaxRate) || 0);
  const activeTipPct = tipRate === -1 ? Math.max(0, parseFloat(customTip) || 0) : tipRate;

  const billTaxAmount = billNum * (localTaxPct / 100);
  const billTipAmount = billNum * (activeTipPct / 100);
  const totalBill = billNum + billTaxAmount + billTipAmount;
  const rawPerPerson = peopleCount > 0 ? totalBill / peopleCount : 0;

  let perPersonDisplay = rawPerPerson;
  let perPersonDecimals = billMeta.decimals;
  if (roundingMode === 'roundInt') {
    perPersonDisplay = Math.round(rawPerPerson);
    perPersonDecimals = 0;
  } else if (roundingMode === 'ceilInt') {
    perPersonDisplay = Math.ceil(rawPerPerson);
    perPersonDecimals = 0;
  }

  const convertedPerPerson = convert(perPersonDisplay, billCurrency, homeCurrency);

  const handleCopySplit = () => {
    const lines = [
      `聚餐分帳明細 (${billCurrency})`,
      `帳單小計：${billMeta.symbol}${formatCurrencyAmount(billNum, billCurrency)}`,
    ];
    if (localTaxPct > 0) {
      lines.push(`稅金 (${localTaxPct}%)：${billMeta.symbol}${formatCurrencyAmount(billTaxAmount, billCurrency)}`);
    }
    lines.push(
      `小費 / 服務費 (${activeTipPct}%)：${billMeta.symbol}${formatCurrencyAmount(billTipAmount, billCurrency)}`,
      `含稅費總計：${billMeta.symbol}${formatCurrencyAmount(totalBill, billCurrency)}`,
      `分攤人數：${peopleCount} 位`,
      `每人應付：${billMeta.symbol}${formatCurrencyAmount(perPersonDisplay, billCurrency, perPersonDecimals)}`
    );
    if (billCurrency !== homeCurrency) {
      lines.push(`約合 ${homeCurrency}：${homeMeta.symbol}${formatCurrencyAmount(convertedPerPerson, homeCurrency)} / 人`);
    }

    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopiedSplit(true);
      setTimeout(() => setCopiedSplit(false), 1800);
    }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Shared Reference Home Currency Strip */}
      <div className={`rounded-2xl border px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 ${tokens.surface} ${tokens.border}`}>
        <div className={`text-xs sm:text-sm ${tokens.textSecondary}`}>
          即時匯率換算參考幣別：結果將同步顯示約合金額，方便出國或海淘購物比價
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="ref-home-currency" className={`text-xs font-medium ${tokens.textMuted}`}>
            參考本國幣別
          </label>
          <select
            id="ref-home-currency"
            value={homeCurrency}
            onChange={(e) => setHomeCurrency(e.target.value)}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl border text-xs font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
          >
            {GLOBAL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.nameZh}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Global Shopping Discount & Tax Calculator */}
        <section
          aria-label="全球逛街折扣與稅務計算"
          className={`rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h2 className={`text-xl font-semibold ${tokens.textPrimary}`}>全球折扣與稅務計算</h2>
                <p className={`text-xs mt-1 ${tokens.textMuted}`}>
                  支援歐美 % OFF 與亞洲折數切換、消費稅及旅客退稅試算
                </p>
              </div>
              {/* Discount notation switch */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${tokens.surfaceMuted} ${tokens.border}`}>
                <button
                  type="button"
                  onClick={() => setDiscountMode('off')}
                  className={`px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    discountMode === 'off' ? `${tokens.surface} ${tokens.textPrimary} shadow-xs` : tokens.textMuted
                  }`}
                >
                  % OFF
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('fold')}
                  className={`px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    discountMode === 'fold' ? `${tokens.surface} ${tokens.textPrimary} shadow-xs` : tokens.textMuted
                  }`}
                >
                  亞洲折數
                </button>
              </div>
            </div>

            {/* Currency + Price */}
            <div className="grid grid-cols-12 gap-3 mb-5">
              <div className="col-span-5 sm:col-span-4">
                <label htmlFor="shop-currency" className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>
                  消費幣別
                </label>
                <select
                  id="shop-currency"
                  value={shopCurrency}
                  onChange={(e) => setShopCurrency(e.target.value)}
                  className={`w-full px-3 py-3 min-h-[48px] rounded-2xl border text-sm font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                >
                  {GLOBAL_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-7 sm:col-span-8">
                <label htmlFor="orig-price" className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>
                  商品原價 ({shopCurrency})
                </label>
                <input
                  id="orig-price"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className={`w-full px-4 py-3 min-h-[48px] rounded-2xl border font-calc-mono text-xl font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
              </div>
            </div>

            {/* Discount Presets */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${tokens.textSecondary}`}>選擇折扣幅度</span>
                <span className={`font-calc-mono text-xs font-semibold ${tokens.accentText}`}>
                  {offPercent}% OFF · {formatFoldLabel(offPercent)}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {OFF_PRESETS.map((offVal) => {
                  const active = offPercent === offVal;
                  const label = discountMode === 'off' ? `${offVal}% OFF` : formatFoldLabel(offVal).replace(' ', '');
                  return (
                    <button
                      key={offVal}
                      type="button"
                      onClick={() => setOffPercent(offVal)}
                      className={`min-h-[42px] px-1 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? `${tokens.accentBg} ${tokens.accentFg} border-transparent`
                          : `${tokens.keyDigit}`
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOffPercent(25)}
                  className={`min-h-[40px] px-2 rounded-xl border text-xs font-medium transition-colors ${
                    offPercent === 25 ? `${tokens.accentSoftBg} ${tokens.accentText} border-transparent` : `${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`
                  }`}
                >
                  第二件半價 (25% OFF)
                </button>
                <button
                  type="button"
                  onClick={() => setOffPercent(50)}
                  className={`min-h-[40px] px-2 rounded-xl border text-xs font-medium transition-colors ${
                    offPercent === 50 ? `${tokens.accentSoftBg} ${tokens.accentText} border-transparent` : `${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`
                  }`}
                >
                  買一送一 BOGO (50% OFF)
                </button>
              </div>

              <div className="mt-3">
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={offPercent}
                  onChange={(e) => setOffPercent(Number(e.target.value))}
                  aria-label="自訂折扣百分比滑桿"
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Tax / Tax-Free + Optional Threshold Coupon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div>
                <label htmlFor="shop-tax" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                  消費稅 / 退稅 (%)
                </label>
                <input
                  id="shop-tax"
                  type="number"
                  min="-30"
                  max="35"
                  step="0.5"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  placeholder="+加稅 或 -退稅"
                  className={`w-full px-3 py-2.5 min-h-[44px] rounded-xl border font-calc-mono text-sm focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[
                    { label: '含稅0%', v: '0' },
                    { label: '+10%稅', v: '10' },
                    { label: '-10%退稅', v: '-10' },
                  ].map((q) => (
                    <button
                      key={q.v}
                      type="button"
                      onClick={() => setTaxPercent(q.v)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap ${tokens.keyDigit}`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="thresh-min" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                  滿額門檻 (選填)
                </label>
                <input
                  id="thresh-min"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  value={thresholdAmount}
                  onChange={(e) => setThresholdAmount(e.target.value)}
                  className={`w-full px-3 py-2.5 min-h-[44px] rounded-xl border font-calc-mono text-sm focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
              </div>
              <div>
                <label htmlFor="thresh-deduct" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                  滿額折抵 (選填)
                </label>
                <input
                  id="thresh-deduct"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  value={thresholdDeduct}
                  onChange={(e) => setThresholdDeduct(e.target.value)}
                  className={`w-full px-3 py-2.5 min-h-[44px] rounded-xl border font-calc-mono text-sm focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
              </div>
            </div>
          </div>

          {/* Discount Result Summary */}
          <div className={`rounded-2xl border p-5 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className={`text-xs font-medium ${tokens.textMuted}`}>折後含稅/退稅實付</div>
                <div className={`font-calc-mono text-3xl sm:text-4xl font-semibold mt-1 tabular-nums ${tokens.textPrimary}`}>
                  {shopMeta.symbol} {formatCurrencyAmount(finalPrice, shopCurrency)}
                </div>
                {shopCurrency !== homeCurrency && (
                  <div className={`font-calc-mono text-xs mt-1 font-medium ${tokens.accentText}`}>
                    約合 {homeMeta.symbol} {formatCurrencyAmount(convertedFinalPrice, homeCurrency)} {homeCurrency}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveDiscount}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${tokens.accentBg} ${tokens.accentBgHover} ${tokens.accentFg}`}
              >
                {savedNotice ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>已存入紀錄</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
                    <span>存入紀錄</span>
                  </>
                )}
              </button>
            </div>

            <div className={`mt-4 pt-3 border-t ${tokens.border} flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${tokens.textSecondary}`}>
              <span>
                折扣省下 <strong className={`font-calc-mono ${tokens.accentText}`}>{shopMeta.symbol} {formatCurrencyAmount(totalSaved, shopCurrency)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                實質總折扣約 <strong className="font-calc-mono">{effectiveOff.toFixed(1)}% OFF</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Right Card: Global Split Bill Calculator */}
        <section
          aria-label="全球聚餐分帳計算"
          className={`rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
        >
          <div>
            <div className="mb-5">
              <h2 className={`text-xl font-semibold ${tokens.textPrimary}`}>全球聚餐分帳</h2>
              <p className={`text-xs mt-1 ${tokens.textMuted}`}>
                支援各國幣別、當地稅率、小費文化 (0%–20%) 與即時匯率換算
              </p>
            </div>

            {/* Bill Currency + Subtotal */}
            <div className="grid grid-cols-12 gap-3 mb-5">
              <div className="col-span-5 sm:col-span-4">
                <label htmlFor="bill-currency" className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>
                  結帳幣別
                </label>
                <select
                  id="bill-currency"
                  value={billCurrency}
                  onChange={(e) => setBillCurrency(e.target.value)}
                  className={`w-full px-3 py-3 min-h-[48px] rounded-2xl border text-sm font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                >
                  {GLOBAL_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-7 sm:col-span-8">
                <label htmlFor="bill-total" className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>
                  帳單小計 ({billCurrency})
                </label>
                <input
                  id="bill-total"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className={`w-full px-4 py-3 min-h-[48px] rounded-2xl border font-calc-mono text-xl font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
              </div>
            </div>

            {/* Optional Tax + Global Tip Presets */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${tokens.textSecondary}`}>小費 / 服務費比例 (Tip / Service)</span>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="bill-tax-rate" className={`text-xs ${tokens.textMuted}`}>外加稅金 %</label>
                  <input
                    id="bill-tax-rate"
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={billTaxRate}
                    onChange={(e) => setBillTaxRate(e.target.value)}
                    className={`w-16 px-2 py-1 min-h-[32px] rounded-lg border font-calc-mono text-xs text-right ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIP_PRESETS.map((opt) => {
                  const active = tipRate === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTipRate(opt.val)}
                      className={`min-h-[42px] px-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? `${tokens.accentBg} ${tokens.accentFg} border-transparent`
                          : `${tokens.keyDigit}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {tipRate === -1 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    aria-label="自訂小費或服務費百分比"
                    className={`w-28 px-3 py-2 min-h-[40px] rounded-xl border font-calc-mono text-sm ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                  />
                  <span className={`text-xs ${tokens.textSecondary}`}>% 小費 / 服務費</span>
                </div>
              )}
            </div>

            {/* People count stepper */}
            <div className="mb-5">
              <span className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>分攤人數</span>
              <div className={`flex items-center justify-between rounded-2xl border p-2 ${tokens.surfaceMuted} ${tokens.border}`}>
                <button
                  type="button"
                  onClick={() => setPeopleCount((c) => Math.max(1, c - 1))}
                  aria-label="減少一人"
                  className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors ${tokens.keyDigit}`}
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <div className="text-center">
                  <span className={`font-calc-mono text-2xl font-semibold tabular-nums ${tokens.textPrimary}`}>
                    {peopleCount}
                  </span>
                  <span className={`text-xs ml-1.5 ${tokens.textMuted}`}>位</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPeopleCount((c) => Math.min(30, c + 1))}
                  aria-label="增加一人"
                  className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors ${tokens.keyDigit}`}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Rounding options */}
            <div className="mb-6">
              <span className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>每人金額進位方式</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'exact' as const, label: '幣別精確值' },
                  { id: 'roundInt' as const, label: '整數四捨五入' },
                  { id: 'ceilInt' as const, label: '無條件進位整數' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRoundingMode(mode.id)}
                    className={`min-h-[40px] px-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                      roundingMode === mode.id
                        ? `${tokens.accentSoftBg} ${tokens.accentText} border-transparent`
                        : `${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Split Bill Result */}
          <div className={`rounded-2xl border p-5 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className={`text-xs font-medium ${tokens.textMuted}`}>每人平均應付</div>
                <div className={`font-calc-mono text-3xl sm:text-4xl font-semibold mt-1 tabular-nums ${tokens.textPrimary}`}>
                  {billMeta.symbol} {formatCurrencyAmount(perPersonDisplay, billCurrency, perPersonDecimals)}
                </div>
                {billCurrency !== homeCurrency && (
                  <div className={`font-calc-mono text-xs mt-1 font-medium ${tokens.accentText}`}>
                    約合 {homeMeta.symbol} {formatCurrencyAmount(convertedPerPerson, homeCurrency)} {homeCurrency} / 人
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopySplit}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${tokens.accentBg} ${tokens.accentBgHover} ${tokens.accentFg}`}
              >
                {copiedSplit ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>已複製明細</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>複製明細</span>
                  </>
                )}
              </button>
            </div>

            <div className={`mt-4 pt-3 border-t ${tokens.border} flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${tokens.textSecondary}`}>
              <span>
                總計金額 <strong className="font-calc-mono">{billMeta.symbol} {formatCurrencyAmount(totalBill, billCurrency)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                小費 {activeTipPct}%（{billMeta.symbol} {formatCurrencyAmount(billTipAmount, billCurrency)}）
              </span>
              {localTaxPct > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>稅金 {localTaxPct}%</span>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

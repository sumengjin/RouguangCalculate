import React from 'react';
import { Droplets, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { ThemeTokens } from '../constants/themes';
import { usePersistedState } from '../hooks/usePersistedState';

interface WellnessToolProps {
  tokens: ThemeTokens;
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '久坐辦公 (少運動)', factor: 1.2 },
  { id: 'light', label: '輕度活動 (每週 1–3 天)', factor: 1.375 },
  { id: 'moderate', label: '中度運動 (每週 3–5 天)', factor: 1.55 },
  { id: 'active', label: '高度運動 (每週 6–7 天)', factor: 1.725 },
];

const WATER_STORAGE_KEY = 'atelier_calc_water_v1';

function getLocalDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const WellnessTool: React.FC<WellnessToolProps> = ({ tokens }) => {
  const [heightCm, setHeightCm] = usePersistedState<string>('atelier_well_height_v1', '162');
  const [weightKg, setWeightKg] = usePersistedState<string>('atelier_well_weight_v1', '52');
  const [age, setAge] = usePersistedState<string>('atelier_well_age_v1', '27');
  const [activityFactor, setActivityFactor] = usePersistedState<number>('atelier_well_activity_v1', 1.375);

  const [waterRecord, setWaterRecord] = usePersistedState<{ date: string; ml: number }>(
    WATER_STORAGE_KEY,
    () => ({ date: getLocalDateStr(), ml: 0 })
  );

  const todayStr = getLocalDateStr();
  const waterMl = waterRecord.date === todayStr ? waterRecord.ml : 0;
  const setWaterMl = (updater: number | ((prev: number) => number)) => {
    setWaterRecord((prev) => {
      const current = prev.date === todayStr ? prev.ml : 0;
      const nextVal = typeof updater === 'function' ? updater(current) : updater;
      return { date: todayStr, ml: nextVal };
    });
  };

  // Skincare / daily unit converter
  const [mlInput, setMlInput] = usePersistedState<string>('atelier_well_ml_v1', '50');
  const [ozInput, setOzInput] = usePersistedState<string>('atelier_well_oz_v1', '1.69');
  const [shoeCm, setShoeCm] = usePersistedState<string>('atelier_well_shoe_v1', '23.5');

  const h = Math.max(100, Math.min(220, parseFloat(heightCm) || 160));
  const w = Math.max(30, Math.min(180, parseFloat(weightKg) || 50));
  const a = Math.max(12, Math.min(100, parseFloat(age) || 26));

  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  const idealMin = 18.5 * heightM * heightM;
  const idealMax = 24.0 * heightM * heightM;

  let bmiLabel = '標準理想範圍';
  if (bmi < 18.5) bmiLabel = '體重偏輕';
  else if (bmi >= 24 && bmi < 27) bmiLabel = '微幅過重';
  else if (bmi >= 27) bmiLabel = '體重過重';

  // Female Mifflin-St Jeor equation
  const bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
  const tdee = Math.round(bmr * activityFactor);
  const gentleCut = Math.max(bmr, tdee - 300);

  const waterTarget = Math.round(w * 35);
  const waterProgress = Math.min(100, Math.round((waterMl / waterTarget) * 100));

  const handleMlChange = (val: string) => {
    setMlInput(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num)) {
      setOzInput((num / 29.5735).toFixed(2));
    } else {
      setOzInput('');
    }
  };

  const handleOzChange = (val: string) => {
    setOzInput(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num)) {
      setMlInput((num * 29.5735).toFixed(1));
    } else {
      setMlInput('');
    }
  };

  const cmNum = parseFloat(shoeCm) || 23.5;
  const euSize = Math.round((cmNum + 1.5) * 1.5);
  const usWomenSize = (cmNum - 18).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Body & Calorie Metrics */}
      <section
        aria-label="女性體態與代謝計算"
        className={`lg:col-span-7 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div>
          <div className="mb-5">
            <h2 className={`text-xl font-semibold ${tokens.textPrimary}`}>體態、代謝與健康計算</h2>
            <p className={`text-xs mt-1 ${tokens.textMuted}`}>
              依女性 Mifflin-St Jeor 公式推算基礎代謝率 (BMR)、每日總消耗熱量 (TDEE) 與衛福部 BMI 標準
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label htmlFor="w-height" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                身高 (cm)
              </label>
              <input
                id="w-height"
                type="number"
                min="120"
                max="210"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[46px] rounded-xl border font-calc-mono text-base font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
              />
            </div>
            <div>
              <label htmlFor="w-weight" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                體重 (kg)
              </label>
              <input
                id="w-weight"
                type="number"
                min="30"
                max="150"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[46px] rounded-xl border font-calc-mono text-base font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
              />
            </div>
            <div>
              <label htmlFor="w-age" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                年齡 (歲)
              </label>
              <input
                id="w-age"
                type="number"
                min="14"
                max="90"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[46px] rounded-xl border font-calc-mono text-base font-semibold focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
              />
            </div>
          </div>

          <div className="mb-6">
            <span className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>日常活動量</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map((lvl) => {
                const active = activityFactor === lvl.factor;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setActivityFactor(lvl.factor)}
                    className={`min-h-[42px] px-3.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                      active
                        ? `${tokens.accentBg} ${tokens.accentFg} border-transparent`
                        : `${tokens.keyDigit}`
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Computed Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-2xl border p-4 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className={`text-xs font-medium ${tokens.textMuted}`}>BMI 指數</div>
            <div className={`font-calc-mono text-2xl font-semibold mt-1 tabular-nums ${tokens.textPrimary}`}>
              {bmi.toFixed(1)}
            </div>
            <div className={`text-xs mt-1 font-medium ${tokens.accentText}`}>
              {bmiLabel}
            </div>
            <div className={`text-[11px] mt-1 ${tokens.textMuted}`}>
              健康範圍 {idealMin.toFixed(1)}–{idealMax.toFixed(1)} kg
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className={`text-xs font-medium ${tokens.textMuted}`}>基礎代謝 (BMR)</div>
            <div className={`font-calc-mono text-2xl font-semibold mt-1 tabular-nums ${tokens.textPrimary}`}>
              {bmr} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className={`text-xs mt-1 ${tokens.textSecondary}`}>
              維持基本生理機能所需
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className={`text-xs font-medium ${tokens.textMuted}`}>每日總消耗 (TDEE)</div>
            <div className={`font-calc-mono text-2xl font-semibold mt-1 tabular-nums ${tokens.textPrimary}`}>
              {tdee} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className={`text-xs mt-1 ${tokens.textSecondary}`}>
              輕盈減脂參考：{gentleCut} kcal
            </div>
          </div>
        </div>
      </section>

      {/* Right: Hydration Tracker & Beauty Unit Converters */}
      <section
        aria-label="每日喝水紀錄與美妝單位換算"
        className={`lg:col-span-5 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between gap-6 ${tokens.surfaceElevated} ${tokens.border}`}
      >
        {/* Daily Water Tracker */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className={`text-lg font-semibold ${tokens.textPrimary}`}>今日喝水小算盤</h3>
              <p className={`text-xs mt-0.5 ${tokens.textMuted}`}>
                依體重建議每日 {waterTarget} ml
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWaterMl(0)}
              aria-label="重置今日喝水紀錄"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl border text-xs font-medium ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>歸零</span>
            </button>
          </div>

          <div className={`rounded-2xl border p-4 ${tokens.surfaceMuted} ${tokens.border}`}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
                <span className={`font-calc-mono text-2xl font-semibold tabular-nums ${tokens.textPrimary}`}>
                  {waterMl} ml
                </span>
              </div>
              <span className={`font-calc-mono text-xs font-semibold ${tokens.accentText}`}>
                {waterProgress}%
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tokens.accentBg}`}
                style={{ width: `${waterProgress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWaterMl((m) => m + 250)}
                className={`min-h-[42px] rounded-xl text-xs font-semibold transition-colors ${tokens.accentBg} ${tokens.accentBgHover} ${tokens.accentFg}`}
              >
                + 1 杯 (250 ml)
              </button>
              <button
                type="button"
                onClick={() => setWaterMl((m) => m + 500)}
                className={`min-h-[42px] rounded-xl border text-xs font-semibold transition-colors ${tokens.keyDigit}`}
              >
                + 1 瓶 (500 ml)
              </button>
            </div>
          </div>
        </div>

        {/* Beauty & Size Unit Converters */}
        <div className={`pt-5 border-t ${tokens.border}`}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
            <h3 className={`text-base font-semibold ${tokens.textPrimary}`}>保養品容量與鞋碼換算</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="conv-ml" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                毫升 (ml)
              </label>
              <input
                id="conv-ml"
                type="number"
                min="0"
                step="1"
                value={mlInput}
                onChange={(e) => handleMlChange(e.target.value)}
                className={`w-full px-3 py-2 min-h-[42px] rounded-xl border font-calc-mono text-sm ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
              />
            </div>
            <div>
              <label htmlFor="conv-oz" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
                液盎司 (fl.oz)
              </label>
              <input
                id="conv-oz"
                type="number"
                min="0"
                step="0.1"
                value={ozInput}
                onChange={(e) => handleOzChange(e.target.value)}
                className={`w-full px-3 py-2 min-h-[42px] rounded-xl border font-calc-mono text-sm ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="shoe-cm" className={`block text-xs font-medium mb-1.5 ${tokens.textSecondary}`}>
              女鞋腳長對照 (cm)：<span className="font-calc-mono">{cmNum.toFixed(1)} cm</span>
            </label>
            <input
              id="shoe-cm"
              type="range"
              min="21.5"
              max="26.5"
              step="0.5"
              value={shoeCm}
              onChange={(e) => setShoeCm(e.target.value)}
              className="w-full cursor-pointer mb-2"
            />
            <div className={`flex items-center justify-between text-xs font-calc-mono px-3 py-2 rounded-xl border ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}>
              <span>台灣 / 日本碼：{cmNum.toFixed(1)}</span>
              <span>歐碼 EU：{euSize}</span>
              <span>美碼 US：{usWomenSize}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calendar } from 'lucide-react';
import { ThemeTokens } from '../constants/themes';

interface CycleEstimatorToolProps {
  tokens: ThemeTokens;
}

interface CycleConfig {
  lastStartDate: string;
  cycleLength: number;
  periodLength: number;
}

const STORAGE_KEY = 'atelier_calc_cycle_v1';

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return dt;
}

function formatZhDate(date: Date): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m} 月 ${d} 日（週${w}）`;
}

function getDefaultStartDate(): string {
  const today = new Date();
  today.setDate(today.getDate() - 12);
  return toLocalIsoDate(today);
}

export const CycleEstimatorTool: React.FC<CycleEstimatorToolProps> = ({ tokens }) => {
  const [config, setConfig] = useState<CycleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as CycleConfig;
    } catch {
      // ignore storage errors
    }
    return {
      lastStartDate: getDefaultStartDate(),
      cycleLength: 28,
      periodLength: 5,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStart = addDays(config.lastStartDate, 0);
  lastStart.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleIndex = diffDays >= 0 ? Math.floor(diffDays / config.cycleLength) : 0;
  const currentCycleStart = addDays(config.lastStartDate, currentCycleIndex * config.cycleLength);
  const dayInCycle = diffDays >= 0 ? (diffDays % config.cycleLength) + 1 : 1;

  const nextPeriodStart = new Date(currentCycleStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + config.cycleLength);
  const daysUntilNext = Math.ceil((nextPeriodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Ovulation ~14 days before next period
  const ovulationOffset = Math.max(10, config.cycleLength - 14);
  const ovulationDate = new Date(currentCycleStart);
  ovulationDate.setDate(ovulationDate.getDate() + ovulationOffset);
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(fertileStart.getDate() - 4);
  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(fertileEnd.getDate() + 1);

  // Determine current phase & gentle self-care tip
  let phaseName = '濾泡期';
  let phaseTip = '體力與專注力逐步回升，適合安排日常運動、補充足夠蛋白質與水分。';
  if (dayInCycle <= config.periodLength) {
    phaseName = '月經期';
    phaseTip = '身體正在代謝更新，留意腹部保暖、適度補充含鐵食材與溫熱開水，保持充足睡眠。';
  } else if (dayInCycle >= ovulationOffset - 4 && dayInCycle <= ovulationOffset + 1) {
    phaseName = '排卵與易孕期';
    phaseTip = '荷爾蒙處於高峰期，代謝較旺盛，可留意分泌物變化並維持規律作息。';
  } else if (dayInCycle > ovulationOffset + 1) {
    phaseName = '黃體期';
    phaseTip = '容易出現輕微水腫或情緒起伏，建議減少重鹹與高糖飲食，可做柔和伸展舒緩緊繃。';
  }

  // Generate next 3 cycle forecasts
  const forecasts = [1, 2, 3].map((step) => {
    const start = addDays(toLocalIsoDate(currentCycleStart), step * config.cycleLength);
    const end = new Date(start);
    end.setDate(end.getDate() + config.periodLength - 1);
    const ov = new Date(start);
    ov.setDate(ov.getDate() + ovulationOffset);
    const fStart = new Date(ov);
    fStart.setDate(fStart.getDate() - 4);
    const fEnd = new Date(ov);
    fEnd.setDate(fEnd.getDate() + 1);
    return {
      index: step,
      periodStart: start,
      periodEnd: end,
      ovulation: ov,
      fertileStart: fStart,
      fertileEnd: fEnd,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Cycle Inputs & Current Status */}
      <section
        aria-label="生理期參數設定與週期狀態"
        className={`lg:col-span-5 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div>
          <div className="mb-5">
            <h2 className={`text-xl font-semibold ${tokens.textPrimary}`}>經期日曆推算</h2>
            <p className={`text-xs mt-1 ${tokens.textMuted}`}>
              資料僅保存於您的瀏覽器本機端，不會上傳任何個人紀錄
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="last-period-date" className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>
                最近一次經期開始日
              </label>
              <div className="relative">
                <input
                  id="last-period-date"
                  type="date"
                  value={config.lastStartDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setConfig((prev) => ({ ...prev, lastStartDate: e.target.value }));
                    }
                  }}
                  className={`w-full px-4 py-3 min-h-[48px] rounded-2xl border font-calc-mono text-sm focus:outline-none ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>平均週期長度</span>
                <div className={`flex items-center justify-between rounded-2xl border p-1.5 ${tokens.surfaceMuted} ${tokens.border}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, cycleLength: Math.max(21, p.cycleLength - 1) }))
                    }
                    aria-label="減少週期天數"
                    className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center ${tokens.keyDigit}`}
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className={`font-calc-mono text-base font-semibold tabular-nums ${tokens.textPrimary}`}>
                    {config.cycleLength} 天
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, cycleLength: Math.min(45, p.cycleLength + 1) }))
                    }
                    aria-label="增加週期天數"
                    className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center ${tokens.keyDigit}`}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <span className={`block text-xs font-medium mb-2 ${tokens.textSecondary}`}>平均經期天數</span>
                <div className={`flex items-center justify-between rounded-2xl border p-1.5 ${tokens.surfaceMuted} ${tokens.border}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, periodLength: Math.max(2, p.periodLength - 1) }))
                    }
                    aria-label="減少經期天數"
                    className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center ${tokens.keyDigit}`}
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className={`font-calc-mono text-base font-semibold tabular-nums ${tokens.textPrimary}`}>
                    {config.periodLength} 天
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, periodLength: Math.min(10, p.periodLength + 1) }))
                    }
                    aria-label="增加經期天數"
                    className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center ${tokens.keyDigit}`}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Phase Card */}
        <div className={`rounded-2xl border p-5 ${tokens.surfaceMuted} ${tokens.border}`}>
          <div className={`text-xs font-medium ${tokens.textMuted}`}>
            今日週期狀態 · 第 <span className="font-calc-mono">{dayInCycle}</span> 天
          </div>
          <div className={`text-2xl font-semibold mt-1 ${tokens.accentText}`}>
            {phaseName}
          </div>
          <p className={`text-sm leading-relaxed mt-2 ${tokens.textSecondary}`}>
            {phaseTip}
          </p>
        </div>
      </section>

      {/* Right: Key Predictions & 3-Month Forecast Table */}
      <section
        aria-label="未來三個月經期與排卵預測"
        className={`lg:col-span-7 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            <div className={`rounded-2xl border p-5 ${tokens.surfaceMuted} ${tokens.border}`}>
              <div className={`text-xs font-medium ${tokens.textMuted}`}>下次預計經期</div>
              <div className={`text-2xl font-semibold mt-1.5 tabular-nums ${tokens.textPrimary}`}>
                {formatZhDate(nextPeriodStart)}
              </div>
              <div className={`text-xs mt-1.5 font-medium ${tokens.accentText}`}>
                {daysUntilNext === 0
                  ? '預計今天開始'
                  : `距離還有 ${daysUntilNext} 天`}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${tokens.surfaceMuted} ${tokens.border}`}>
              <div className={`text-xs font-medium ${tokens.textMuted}`}>本週期預計排卵日</div>
              <div className={`text-2xl font-semibold mt-1.5 tabular-nums ${tokens.textPrimary}`}>
                {formatZhDate(ovulationDate)}
              </div>
              <div className={`text-xs mt-1.5 ${tokens.textSecondary}`}>
                易孕期：{fertileStart.getMonth() + 1}/{fertileStart.getDate()} – {fertileEnd.getMonth() + 1}/{fertileEnd.getDate()}
              </div>
            </div>
          </div>

          <div className={`border-t pt-5 ${tokens.border}`}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
              <h3 className={`text-base font-semibold ${tokens.textPrimary}`}>未來三次週期預估</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs ${tokens.border} ${tokens.textMuted}`}>
                    <th className="py-2.5 pr-3 font-medium">預估輪次</th>
                    <th className="py-2.5 px-3 font-medium">預計經期區間</th>
                    <th className="py-2.5 px-3 font-medium">預計排卵日</th>
                    <th className="py-2.5 pl-3 font-medium">參考易孕期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm tabular-nums">
                  {forecasts.map((row) => (
                    <tr key={row.index}>
                      <td className={`py-3.5 pr-3 font-medium ${tokens.textSecondary}`}>
                        第 {row.index} 次
                      </td>
                      <td className={`py-3.5 px-3 font-calc-mono text-xs sm:text-sm ${tokens.textPrimary}`}>
                        {row.periodStart.getMonth() + 1}/{row.periodStart.getDate()} – {row.periodEnd.getMonth() + 1}/{row.periodEnd.getDate()}
                      </td>
                      <td className={`py-3.5 px-3 font-calc-mono text-xs sm:text-sm ${tokens.accentText} font-medium`}>
                        {row.ovulation.getMonth() + 1}/{row.ovulation.getDate()}
                      </td>
                      <td className={`py-3.5 pl-3 font-calc-mono text-xs sm:text-sm ${tokens.textSecondary}`}>
                        {row.fertileStart.getMonth() + 1}/{row.fertileStart.getDate()} – {row.fertileEnd.getMonth() + 1}/{row.fertileEnd.getDate()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className={`mt-6 pt-4 border-t text-xs leading-relaxed ${tokens.border} ${tokens.textMuted}`}>
          貼心提醒：週期推算以固定日數模型估算，實際生理期可能受壓力、作息或體質影響而提前或延後，本結果僅供日常規劃參考，非醫療診斷依據。
        </p>
      </section>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ThemeId, ToolTab, HistoryItem } from './types/calculator';
import { THEME_TOKENS, THEME_PALETTES } from './constants/themes';
import { TopBar } from './components/TopBar';
import { StandardCalculator } from './components/StandardCalculator';
import { ShoppingSplitTool } from './components/ShoppingSplitTool';
import { CurrencyConverterTool } from './components/CurrencyConverterTool';
import { CycleEstimatorTool } from './components/CycleEstimatorTool';
import { WellnessTool } from './components/WellnessTool';
import { useExchangeRates } from './hooks/useExchangeRates';
import { usePersistedState } from './hooks/usePersistedState';

const THEME_KEY = 'atelier_calc_theme_v1';
const TAB_KEY = 'atelier_calc_active_tab_v1';
const SOUND_KEY = 'atelier_calc_sound_v1';
const HISTORY_KEY = 'atelier_calc_history_v1';

const TAB_DESCRIPTIONS: Record<ToolTab, { title: string; subtitle: string }> = {
  calculator: {
    title: '日常觸感計算機',
    subtitle: '支援鍵盤快捷輸入、進階科學函數與可加註備忘的計算紀錄。',
  },
  shopping: {
    title: '全球折扣與聚餐分帳',
    subtitle: '支援各國幣別、歐美 % OFF 與亞洲折數切換、稅率退稅及全球小費分帳。',
  },
  currency: {
    title: '全球即時匯率轉換',
    subtitle: '提供全球主要幣別即時換算、多國同步比價與自訂刷卡匯率。',
  },
  cycle: {
    title: '生理期日曆推算',
    subtitle: '估算下次經期、排卵日與週期階段提醒，資料僅存於本機裝置。',
  },
  wellness: {
    title: '體態、喝水與日常換算',
    subtitle: '計算 BMI、基礎代謝率與每日喝水目標，附帶保養品容量與鞋碼換算。',
  },
};

export default function App() {
  const [themeId, setThemeId] = usePersistedState<ThemeId>(THEME_KEY, 'rose-porcelain');
  const [activeTab, setActiveTab] = usePersistedState<ToolTab>(TAB_KEY, 'calculator');
  const [soundEnabled, setSoundEnabled] = usePersistedState<boolean>(SOUND_KEY, true);
  const [history, setHistory] = usePersistedState<HistoryItem[]>(HISTORY_KEY, []);

  const tokens = THEME_TOKENS[themeId] ?? THEME_TOKENS['rose-porcelain'];
  const activePalette = THEME_PALETTES.find((p) => p.id === themeId);
  const fx = useExchangeRates();

  useEffect(() => {
    if (activePalette?.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activePalette]);

  const handleAddHistory = useCallback((expression: string, result: string, note?: string) => {
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      expression,
      result,
      note,
      timestamp: Date.now(),
    };
    setHistory((prev) => [item, ...prev].slice(0, 50));
  }, []);

  const handleUpdateHistoryNote = useCallback((id: string, note: string) => {
    setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const tabMeta = TAB_DESCRIPTIONS[activeTab];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${tokens.canvas}`}>
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        themeId={themeId}
        onSelectTheme={setThemeId}
        tokens={tokens}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 md:pb-12">
        {/* Clean Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight text-balance ${tokens.textPrimary}`}>
              {tabMeta.title}
            </h1>
            <p className={`text-sm mt-1 ${tokens.textSecondary}`}>
              {tabMeta.subtitle}
            </p>
          </div>
          <div className={`text-xs ${tokens.textMuted}`}>
            色系：{activePalette?.name}
          </div>
        </div>

        {/* Active Tool Workspace */}
        {activeTab === 'calculator' && (
          <StandardCalculator
            tokens={tokens}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((s) => !s)}
            history={history}
            onAddHistory={handleAddHistory}
            onUpdateHistoryNote={handleUpdateHistoryNote}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingSplitTool
            tokens={tokens}
            convert={fx.convert}
            onSaveToHistory={handleAddHistory}
          />
        )}

        {activeTab === 'currency' && (
          <CurrencyConverterTool
            tokens={tokens}
            updatedAt={fx.updatedAt}
            source={fx.source}
            isLoading={fx.isLoading}
            error={fx.error}
            onRefresh={fx.refreshRates}
            convert={fx.convert}
            getRate={fx.getRate}
            onSaveToHistory={handleAddHistory}
          />
        )}

        {activeTab === 'cycle' && <CycleEstimatorTool tokens={tokens} />}

        {activeTab === 'wellness' && <WellnessTool tokens={tokens} />}
      </main>

      <footer className={`hidden md:block border-t py-5 ${tokens.border}`}>
        <div className={`max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between text-xs ${tokens.textMuted}`}>
          <span>柔光計算器 · 為細緻日常打造的計算工具</span>
          <span>所有個人紀錄皆僅保存於您的瀏覽器本機</span>
        </div>
      </footer>
    </div>
  );
}

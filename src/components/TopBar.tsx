import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Calculator, ShoppingBag, ArrowLeftRight, CalendarHeart, HeartPulse } from 'lucide-react';
import { ThemeId, ToolTab } from '../types/calculator';
import { THEME_PALETTES, ThemeTokens } from '../constants/themes';

interface TopBarProps {
  activeTab: ToolTab;
  onSelectTab: (tab: ToolTab) => void;
  themeId: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  tokens: ThemeTokens;
}

const NAV_ITEMS: { id: ToolTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'calculator', label: '計算機', shortLabel: '計算機', icon: Calculator },
  { id: 'shopping', label: '折數與分帳', shortLabel: '折數分帳', icon: ShoppingBag },
  { id: 'currency', label: '匯率轉換', shortLabel: '匯率', icon: ArrowLeftRight },
  { id: 'cycle', label: '經期推算', shortLabel: '經期', icon: CalendarHeart },
  { id: 'wellness', label: '健康計算', shortLabel: '健康', icon: HeartPulse },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  themeId,
  onSelectTheme,
  tokens,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    if (themeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [themeMenuOpen]);

  return (
    <>
      <header className={`w-full border-b ${tokens.border} ${tokens.surface} transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('calculator')}
            className={`font-display text-xl sm:text-[22px] font-semibold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 ${tokens.textPrimary}`}
          >
            柔光計算器
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav aria-label="主要功能" className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                    isActive ? tokens.textPrimary : `${tokens.textMuted} ${tokens.hoverTextPrimary}`
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${tokens.accentBg}`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action (Theme selector) */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              aria-expanded={themeMenuOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-medium border whitespace-nowrap shrink-0 transition-colors duration-150 ${tokens.surfaceMuted} ${tokens.border} ${tokens.textPrimary}`}
            >
              <Palette className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>外觀色調</span>
            </button>

            {themeMenuOpen && (
              <div
                role="menu"
                aria-label="選擇計算器色調"
                className={`absolute right-0 mt-2 w-60 rounded-2xl border p-2 z-50 ${tokens.surfaceElevated} ${tokens.border}`}
              >
                <div className={`px-3 py-1.5 text-xs font-medium ${tokens.textMuted}`}>
                  切換質感色系
                </div>
                <div className="mt-1 space-y-1">
                  {THEME_PALETTES.map((palette) => {
                    const selected = palette.id === themeId;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          onSelectTheme(palette.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-left transition-colors duration-150 ${
                          selected ? tokens.accentSoftBg : tokens.hoverSurfaceMuted
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg border border-black/10 shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: palette.swatchBg }}
                            aria-hidden="true"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: palette.swatchAccent }}
                            />
                          </span>
                          <div className="min-w-0">
                            <div className={`text-sm font-medium truncate ${tokens.textPrimary}`}>
                              {palette.name}
                            </div>
                            <div className={`text-xs truncate ${tokens.textMuted}`}>
                              {palette.subtitle}
                            </div>
                          </div>
                        </div>
                        {selected && (
                          <Check className={`w-4 h-4 shrink-0 ${tokens.accentText}`} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (56px height, well under 15% mobile sticky cap) */}
      <nav
        aria-label="行動版功能切換"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${tokens.border} ${tokens.surface} backdrop-blur-md`}
      >
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  isActive ? tokens.accentText : tokens.textMuted
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

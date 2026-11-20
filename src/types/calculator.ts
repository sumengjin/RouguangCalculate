export type ThemeId = 'rose-porcelain' | 'oat-latte' | 'sage-linen' | 'velvet-plum';

export type ToolTab = 'calculator' | 'shopping' | 'currency' | 'cycle' | 'wellness';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  note?: string;
  timestamp: number;
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  swatchBg: string;
  swatchAccent: string;
}

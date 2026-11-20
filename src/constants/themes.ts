import { ThemeId, ThemePalette } from '../types/calculator';

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'rose-porcelain',
    name: '柔霧粉瓷',
    subtitle: '淺粉瓷白 · 玫瑰木紅',
    isDark: false,
    swatchBg: '#FAF7F5',
    swatchAccent: '#B44B63',
  },
  {
    id: 'oat-latte',
    name: '燕麥奶茶',
    subtitle: '溫潤米白 · 烘培焦糖',
    isDark: false,
    swatchBg: '#F9F7F4',
    swatchAccent: '#9A553A',
  },
  {
    id: 'sage-linen',
    name: '鼠尾草白',
    subtitle: '亞麻淺綠 · 深森鼠尾草',
    isDark: false,
    swatchBg: '#F5F7F5',
    swatchAccent: '#366353',
  },
  {
    id: 'velvet-plum',
    name: '絲絨夜櫻',
    subtitle: '深邃梅黑 · 暮色櫻粉',
    isDark: true,
    swatchBg: '#161316',
    swatchAccent: '#DF8498',
  },
];

export interface ThemeTokens {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  hoverSurfaceMuted: string;
  focusSurfaceMuted: string;
  border: string;
  focusBorder: string;
  textPrimary: string;
  hoverTextPrimary: string;
  textSecondary: string;
  textMuted: string;
  placeholderMuted: string;
  accentBg: string;
  accentBgHover: string;
  accentText: string;
  hoverAccentText: string;
  accentFg: string;
  accentSoftBg: string;
  keyDigit: string;
  keyOperator: string;
  keyUtility: string;
}

export const THEME_TOKENS: Record<ThemeId, ThemeTokens> = {
  'rose-porcelain': {
    canvas: 'bg-[#FAF7F5] text-[#2A1F23]',
    surface: 'bg-white',
    surfaceElevated: 'bg-white shadow-[0_12px_36px_-12px_rgba(42,31,35,0.08)]',
    surfaceMuted: 'bg-[#F4EEEC]',
    hoverSurfaceMuted: 'hover:bg-[#F4EEEC]',
    focusSurfaceMuted: 'focus:bg-[#F4EEEC]',
    border: 'border-[#E9DFE0]',
    focusBorder: 'focus:border-[#D9C7CA]',
    textPrimary: 'text-[#2A1F23]',
    hoverTextPrimary: 'hover:text-[#2A1F23]',
    textSecondary: 'text-[#5C4950]',
    textMuted: 'text-[#8C777E]',
    placeholderMuted: 'placeholder:text-[#8C777E]',
    accentBg: 'bg-[#B44B63]',
    accentBgHover: 'hover:bg-[#9E3D54]',
    accentText: 'text-[#B44B63]',
    hoverAccentText: 'hover:text-[#B44B63]',
    accentFg: 'text-white',
    accentSoftBg: 'bg-[#F8EBEE]',
    keyDigit: 'bg-[#FCFAFA] hover:bg-[#F5EFF0] text-[#2A1F23] border-[#EAE1E2]',
    keyOperator: 'bg-[#F5E9EC] hover:bg-[#EDDADF] text-[#9E3D54] border-[#E8D4D9]',
    keyUtility: 'bg-[#F2ECEB] hover:bg-[#E8E0DF] text-[#5C4950] border-[#E4DBDA]',
  },
  'oat-latte': {
    canvas: 'bg-[#F9F7F4] text-[#2B241E]',
    surface: 'bg-white',
    surfaceElevated: 'bg-white shadow-[0_12px_36px_-12px_rgba(43,36,30,0.08)]',
    surfaceMuted: 'bg-[#F1ECE4]',
    hoverSurfaceMuted: 'hover:bg-[#F1ECE4]',
    focusSurfaceMuted: 'focus:bg-[#F1ECE4]',
    border: 'border-[#E6DDD2]',
    focusBorder: 'focus:border-[#D4C5B4]',
    textPrimary: 'text-[#2B241E]',
    hoverTextPrimary: 'hover:text-[#2B241E]',
    textSecondary: 'text-[#5E5246]',
    textMuted: 'text-[#8B7D6F]',
    placeholderMuted: 'placeholder:text-[#8B7D6F]',
    accentBg: 'bg-[#9A553A]',
    accentBgHover: 'hover:bg-[#82452E]',
    accentText: 'text-[#9A553A]',
    hoverAccentText: 'hover:text-[#9A553A]',
    accentFg: 'text-white',
    accentSoftBg: 'bg-[#F5EAE4]',
    keyDigit: 'bg-[#FCFBF9] hover:bg-[#F3EFE9] text-[#2B241E] border-[#E7E0D6]',
    keyOperator: 'bg-[#F3EAE4] hover:bg-[#EADBD1] text-[#82452E] border-[#E4D4C9]',
    keyUtility: 'bg-[#EFEAE2] hover:bg-[#E5DDD2] text-[#5E5246] border-[#E2D9CD]',
  },
  'sage-linen': {
    canvas: 'bg-[#F5F7F5] text-[#1D2824]',
    surface: 'bg-white',
    surfaceElevated: 'bg-white shadow-[0_12px_36px_-12px_rgba(29,40,36,0.08)]',
    surfaceMuted: 'bg-[#EAF0EC]',
    hoverSurfaceMuted: 'hover:bg-[#EAF0EC]',
    focusSurfaceMuted: 'focus:bg-[#EAF0EC]',
    border: 'border-[#DCE4DF]',
    focusBorder: 'focus:border-[#BFCFC6]',
    textPrimary: 'text-[#1D2824]',
    hoverTextPrimary: 'hover:text-[#1D2824]',
    textSecondary: 'text-[#485952]',
    textMuted: 'text-[#73857E]',
    placeholderMuted: 'placeholder:text-[#73857E]',
    accentBg: 'bg-[#366353]',
    accentBgHover: 'hover:bg-[#2A5042]',
    accentText: 'text-[#366353]',
    hoverAccentText: 'hover:text-[#366353]',
    accentFg: 'text-white',
    accentSoftBg: 'bg-[#E5EFEA]',
    keyDigit: 'bg-[#FBFCFB] hover:bg-[#EFF3F0] text-[#1D2824] border-[#DFE6E1]',
    keyOperator: 'bg-[#E6EFEA] hover:bg-[#D7E6DD] text-[#2A5042] border-[#CFE0D6]',
    keyUtility: 'bg-[#EBF0ED] hover:bg-[#DFE6E2] text-[#485952] border-[#DCE3DF]',
  },
  'velvet-plum': {
    canvas: 'bg-[#161316] text-[#F5EEF2]',
    surface: 'bg-[#201B20]',
    surfaceElevated: 'bg-[#201B20] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]',
    surfaceMuted: 'bg-[#2A232A]',
    hoverSurfaceMuted: 'hover:bg-[#2A232A]',
    focusSurfaceMuted: 'focus:bg-[#2A232A]',
    border: 'border-[#382F38]',
    focusBorder: 'focus:border-[#544654]',
    textPrimary: 'text-[#F5EEF2]',
    hoverTextPrimary: 'hover:text-[#F5EEF2]',
    textSecondary: 'text-[#D0C2CA]',
    textMuted: 'text-[#9A8A93]',
    placeholderMuted: 'placeholder:text-[#9A8A93]',
    accentBg: 'bg-[#DF8498]',
    accentBgHover: 'hover:bg-[#EC97AA]',
    accentText: 'text-[#EA9CAE]',
    hoverAccentText: 'hover:text-[#EA9CAE]',
    accentFg: 'text-[#1C1116]',
    accentSoftBg: 'bg-[#35242B]',
    keyDigit: 'bg-[#292229] hover:bg-[#332B33] text-[#F5EEF2] border-[#3B313B]',
    keyOperator: 'bg-[#36272F] hover:bg-[#44303B] text-[#F2A6B7] border-[#4A3440]',
    keyUtility: 'bg-[#241E24] hover:bg-[#2E272E] text-[#D0C2CA] border-[#352C35]',
  },
};

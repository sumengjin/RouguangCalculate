import React, { useState, useEffect, useCallback } from 'react';
import {
  Delete,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Sigma,
  AlertCircle,
  ArrowUpLeft,
} from 'lucide-react';
import { HistoryItem } from '../types/calculator';
import { ThemeTokens } from '../constants/themes';
import {
  evaluateExpression,
  tryEvaluatePreview,
  formatDisplayNumber,
  stripCommas,
} from '../utils/mathEngine';
import { playKeySound } from '../utils/sound';
import { usePersistedState } from '../hooks/usePersistedState';

interface StandardCalculatorProps {
  tokens: ThemeTokens;
  soundEnabled: boolean;
  onToggleSound: () => void;
  history: HistoryItem[];
  onAddHistory: (expression: string, result: string, note?: string) => void;
  onUpdateHistoryNote: (id: string, note: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

const OPERATORS = ['+', '−', '×', '÷'];

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  tokens,
  soundEnabled,
  onToggleSound,
  history,
  onAddHistory,
  onUpdateHistoryNote,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  const [expression, setExpression] = usePersistedState<string>('atelier_calc_expr_v1', '');
  const [displayResult, setDisplayResult] = usePersistedState<string>('atelier_calc_res_v1', '0');
  const [justEvaluated, setJustEvaluated] = usePersistedState<boolean>('atelier_calc_eval_v1', false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showScientific, setShowScientific] = usePersistedState<boolean>('atelier_calc_sci_v1', false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const livePreview = !justEvaluated && expression ? tryEvaluatePreview(expression) : null;

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard?.writeText(stripCommas(text)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
    }).catch(() => {});
  }, []);

  const handleClear = useCallback(() => {
    playKeySound('clear', soundEnabled);
    setExpression('');
    setDisplayResult('0');
    setJustEvaluated(false);
    setErrorMsg(null);
  }, [soundEnabled]);

  const handleBackspace = useCallback(() => {
    playKeySound('clear', soundEnabled);
    setErrorMsg(null);
    if (justEvaluated) {
      setExpression('');
      setDisplayResult('0');
      setJustEvaluated(false);
      return;
    }
    setExpression((prev) => {
      const next = prev.slice(0, -1);
      if (!next) setDisplayResult('0');
      return next;
    });
  }, [justEvaluated, soundEnabled]);

  const appendDigit = useCallback(
    (digit: string) => {
      playKeySound('digit', soundEnabled);
      setErrorMsg(null);
      if (justEvaluated) {
        setExpression(digit === '.' ? '0.' : digit);
        setDisplayResult(digit === '.' ? '0.' : digit);
        setJustEvaluated(false);
        return;
      }

      setExpression((prev) => {
        if (digit === '.') {
          // Check current number segment for existing decimal point
          const lastSegment = prev.split(/[+\−×÷()^√]/).pop() ?? '';
          if (lastSegment.includes('.')) return prev;
          if (!lastSegment) return prev + '0.';
          return prev + '.';
        }
        if (prev === '0' && digit !== '.') {
          return digit;
        }
        return prev + digit;
      });
    },
    [justEvaluated, soundEnabled]
  );

  const appendOperator = useCallback(
    (op: string) => {
      playKeySound('op', soundEnabled);
      setErrorMsg(null);

      if (justEvaluated) {
        const cleanVal = stripCommas(displayResult);
        setExpression(cleanVal + op);
        setJustEvaluated(false);
        return;
      }

      setExpression((prev) => {
        if (!prev) {
          return op === '−' ? '−' : '0' + op;
        }
        const lastChar = prev.slice(-1);
        if (OPERATORS.includes(lastChar)) {
          return prev.slice(0, -1) + op;
        }
        if (lastChar === '(' && op !== '−') {
          return prev;
        }
        return prev + op;
      });
    },
    [displayResult, justEvaluated, soundEnabled]
  );

  const appendScientific = useCallback(
    (token: string) => {
      playKeySound('op', soundEnabled);
      setErrorMsg(null);

      if (token === 'sq') {
        if (justEvaluated) {
          const cleanVal = stripCommas(displayResult);
          const nextExpr = `(${cleanVal})^2`;
          try {
            const val = evaluateExpression(nextExpr);
            const formatted = formatDisplayNumber(val);
            setExpression(nextExpr);
            setDisplayResult(formatted);
            onAddHistory(nextExpr, formatted);
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '計算錯誤');
          }
          return;
        }
        setExpression((prev) => (prev ? `${prev}^2` : '0^2'));
        return;
      }

      if (token === 'inv') {
        const target = justEvaluated ? stripCommas(displayResult) : expression || '0';
        const nextExpr = `1÷(${target})`;
        try {
          const val = evaluateExpression(nextExpr);
          const formatted = formatDisplayNumber(val);
          setExpression(nextExpr);
          setDisplayResult(formatted);
          setJustEvaluated(true);
          onAddHistory(nextExpr, formatted);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : '無法除以零');
        }
        return;
      }

      if (justEvaluated) {
        if (token === '√(' || token === '(' || token === 'π') {
          setExpression(token);
          setJustEvaluated(false);
          return;
        }
      }

      setExpression((prev) => prev + token);
    },
    [displayResult, expression, justEvaluated, onAddHistory, soundEnabled]
  );

  const handleToggleSign = useCallback(() => {
    playKeySound('op', soundEnabled);
    setErrorMsg(null);
    if (justEvaluated) {
      const cleanVal = stripCommas(displayResult);
      if (cleanVal === '0') return;
      const toggled = cleanVal.startsWith('-') ? cleanVal.slice(1) : `-${cleanVal}`;
      const formatted = formatDisplayNumber(parseFloat(toggled));
      setDisplayResult(formatted);
      setExpression(toggled);
      return;
    }

    setExpression((prev) => {
      if (!prev) return '−';
      if (prev.startsWith('−')) return prev.slice(1);
      if (prev.startsWith('-')) return prev.slice(1);
      return `−(${prev})`;
    });
  }, [displayResult, justEvaluated, soundEnabled]);

  const handlePercent = useCallback(() => {
    playKeySound('op', soundEnabled);
    setErrorMsg(null);
    if (justEvaluated) {
      const cleanVal = stripCommas(displayResult);
      const nextExpr = `${cleanVal}%`;
      try {
        const val = evaluateExpression(nextExpr);
        const formatted = formatDisplayNumber(val);
        setExpression(nextExpr);
        setDisplayResult(formatted);
        onAddHistory(nextExpr, formatted);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : '計算錯誤');
      }
      return;
    }
    setExpression((prev) => {
      if (!prev) return prev;
      const lastChar = prev.slice(-1);
      if (/[0-9)%π]/.test(lastChar)) {
        return prev + '%';
      }
      return prev;
    });
  }, [displayResult, justEvaluated, onAddHistory, soundEnabled]);

  const handleEvaluate = useCallback(() => {
    const targetExpr = expression.trim();
    if (!targetExpr) return;

    try {
      const val = evaluateExpression(targetExpr);
      const formatted = formatDisplayNumber(val);
      playKeySound('equal', soundEnabled);
      setDisplayResult(formatted);
      setJustEvaluated(true);
      setErrorMsg(null);
      if (!/^-?[0-9.]+$/.test(targetExpr)) {
        onAddHistory(targetExpr, formatted);
      }
    } catch (err) {
      playKeySound('clear', soundEnabled);
      setErrorMsg(err instanceof Error ? err.message : '算式格式錯誤');
    }
  }, [expression, onAddHistory, soundEnabled]);

  // Global keyboard support when not typing in an input/textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (/^[0-9.]$/.test(e.key)) {
        e.preventDefault();
        appendDigit(e.key);
      } else if (e.key === '+') {
        e.preventDefault();
        appendOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendOperator('−');
      } else if (e.key === '*') {
        e.preventDefault();
        appendOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendOperator('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercent();
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        appendScientific(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    appendDigit,
    appendOperator,
    appendScientific,
    handleBackspace,
    handleClear,
    handleEvaluate,
    handlePercent,
  ]);

  const injectFromHistory = (val: string) => {
    playKeySound('digit', soundEnabled);
    const raw = stripCommas(val);
    setErrorMsg(null);
    if (justEvaluated || !expression) {
      setExpression(raw);
      setDisplayResult(val);
      setJustEvaluated(false);
    } else {
      setExpression((prev) => prev + raw);
    }
  };

  const mainDisplayText = justEvaluated
    ? displayResult
    : expression
      ? expression
      : displayResult;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Main Tactile Calculator */}
      <section
        aria-label="日常觸感計算機"
        className={`lg:col-span-7 rounded-3xl border p-5 sm:p-7 flex flex-col justify-between ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div>
          {/* Workspace utility strip */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScientific((prev) => !prev)}
                aria-pressed={showScientific}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${
                  showScientific
                    ? `${tokens.accentSoftBg} ${tokens.accentText} border-transparent`
                    : `${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`
                }`}
              >
                <Sigma className="w-3.5 h-3.5" aria-hidden="true" />
                <span>進階函數</span>
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? '關閉按鍵音' : '開啟按鍵音'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{soundEnabled ? '按鍵音 開' : '按鍵音 關'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => copyText(justEvaluated ? displayResult : livePreview || mainDisplayText, 'main-result')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}
            >
              {copiedId === 'main-result' ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${tokens.accentText}`} aria-hidden="true" />
                  <span className={tokens.accentText}>已複製</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>複製數值</span>
                </>
              )}
            </button>
          </div>

          {/* Calculator Display Screen */}
          <div
            className={`rounded-2xl border px-5 py-5 mb-5 flex flex-col justify-end min-h-[144px] ${tokens.surfaceMuted} ${tokens.border}`}
          >
            {/* Upper expression line */}
            <div className={`min-h-[24px] text-right font-calc-mono text-sm overflow-x-auto whitespace-nowrap ${tokens.textMuted}`}>
              {justEvaluated ? `${expression} =` : expression ? '輸入中' : '準備就緒'}
            </div>

            {/* Primary number line */}
            <div
              role="status"
              aria-live="polite"
              className={`mt-2 text-right font-calc-mono font-semibold tracking-tight overflow-x-auto whitespace-nowrap ${
                mainDisplayText.length > 14 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
              } ${tokens.textPrimary}`}
            >
              {mainDisplayText}
            </div>

            {/* Live preview or Error */}
            <div className="mt-2 min-h-[24px] flex items-center justify-end gap-2">
              {errorMsg ? (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tokens.accentText}`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </span>
              ) : livePreview !== null ? (
                <span className={`font-calc-mono text-sm ${tokens.textSecondary}`}>
                  = {livePreview}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Scientific Row (Optional) */}
        <div>
          {showScientific && (
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5 mb-3">
              {[
                { label: '(', action: () => appendScientific('(') },
                { label: ')', action: () => appendScientific(')') },
                { label: '√', action: () => appendScientific('√(') },
                { label: 'x²', action: () => appendScientific('sq') },
                { label: 'π', action: () => appendScientific('π') },
                { label: '1/x', action: () => appendScientific('inv') },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.action}
                  className={`min-h-[44px] rounded-xl border font-calc-mono text-sm font-medium transition-transform duration-100 active:scale-[0.96] ${tokens.keyUtility}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Main 4x5 Tactile Keypad */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {/* Row 1 */}
            <button
              type="button"
              onClick={handleClear}
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-semibold text-base transition-transform duration-100 active:scale-[0.96] ${tokens.keyUtility}`}
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              aria-label="倒退刪除"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border flex items-center justify-center transition-transform duration-100 active:scale-[0.96] ${tokens.keyUtility}`}
            >
              <Delete className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handlePercent}
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-lg transition-transform duration-100 active:scale-[0.96] ${tokens.keyUtility}`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => appendOperator('÷')}
              aria-label="除以"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyOperator}`}
            >
              ÷
            </button>

            {/* Row 2 */}
            {['7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => appendDigit(n)}
                className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => appendOperator('×')}
              aria-label="乘以"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyOperator}`}
            >
              ×
            </button>

            {/* Row 3 */}
            {['4', '5', '6'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => appendDigit(n)}
                className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => appendOperator('−')}
              aria-label="減去"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyOperator}`}
            >
              −
            </button>

            {/* Row 4 */}
            {['1', '2', '3'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => appendDigit(n)}
                className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => appendOperator('+')}
              aria-label="加上"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyOperator}`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={handleToggleSign}
              aria-label="正負號切換"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-lg transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => appendDigit('.')}
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl border font-calc-mono font-semibold text-xl transition-transform duration-100 active:scale-[0.96] ${tokens.keyDigit}`}
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              aria-label="等於"
              className={`min-h-[54px] sm:min-h-[60px] rounded-2xl font-calc-mono font-semibold text-2xl transition-transform duration-100 active:scale-[0.96] ${tokens.accentBg} ${tokens.accentBgHover} ${tokens.accentFg}`}
            >
              =
            </button>
          </div>
        </div>
      </section>

      {/* Right Companion Column: Calculation Tape & Notes */}
      <aside
        aria-label="計算紀錄與備忘"
        className={`lg:col-span-5 rounded-3xl border p-5 sm:p-7 flex flex-col ${tokens.surfaceElevated} ${tokens.border}`}
      >
        <div className={`flex items-center justify-between gap-4 pb-4 border-b ${tokens.border}`}>
          <div>
            <h2 className={`text-lg font-semibold ${tokens.textPrimary}`}>計算紀錄</h2>
            <p className={`text-xs mt-0.5 ${tokens.textMuted}`}>
              共 {history.length} 筆 · 點擊結果可帶回算式
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${tokens.surfaceMuted} ${tokens.border} ${tokens.textSecondary}`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>全部清除</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-black/5 dark:divide-white/5 mt-2">
          {history.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <p className={`text-sm font-medium ${tokens.textSecondary}`}>目前還沒有計算紀錄</p>
              <p className={`text-xs mt-2 leading-relaxed max-w-xs mx-auto ${tokens.textMuted}`}>
                完成運算後會自動保存在這裡，也能為每筆花費加上備忘名稱，方便對帳或記帳。
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-2 group">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => injectFromHistory(item.result)}
                    className="text-left flex-1 min-w-0 rounded-xl p-1.5 -m-1.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    title="點擊帶回此結果"
                  >
                    <div className={`font-calc-mono text-xs truncate ${tokens.textMuted}`}>
                      {item.expression}
                    </div>
                    <div className={`font-calc-mono text-lg font-semibold mt-0.5 flex items-center gap-1.5 ${tokens.textPrimary}`}>
                      <span>= {item.result}</span>
                      <ArrowUpLeft
                        className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity ${tokens.accentText}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyText(item.result, item.id)}
                      aria-label="複製此筆結果"
                      className={`min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors ${tokens.textMuted} ${tokens.hoverTextPrimary}`}
                    >
                      {copiedId === item.id ? (
                        <Check className={`w-4 h-4 ${tokens.accentText}`} aria-hidden="true" />
                      ) : (
                        <Copy className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      aria-label="刪除此筆紀錄"
                      className={`min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors ${tokens.textMuted} ${tokens.hoverAccentText}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Inline memo note */}
                <input
                  type="text"
                  value={item.note ?? ''}
                  onChange={(e) => onUpdateHistoryNote(item.id, e.target.value)}
                  placeholder="點此加上備忘（如：保養品、咖啡）"
                  maxLength={32}
                  aria-label="計算項目備忘"
                  className={`mt-2 w-full bg-transparent text-xs px-2.5 py-1.5 rounded-lg border border-transparent focus:outline-none transition-colors ${tokens.textSecondary} ${tokens.placeholderMuted} ${tokens.focusBorder} ${tokens.focusSurfaceMuted}`}
                />
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

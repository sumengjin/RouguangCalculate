import { useState, useEffect, useRef, useCallback } from 'react';
import { readLocalSync, writeNativePref, readNativePref } from '../utils/persistentStorage';

export function usePersistedState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const resolveDefault = () =>
    typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;

  const [state, setState] = useState<T>(() => readLocalSync<T>(key, resolveDefault()));
  const latestRef = useRef<T>(state);
  const userEditedRef = useRef<boolean>(false);

  useEffect(() => {
    latestRef.current = state;
  }, [state]);

  // Hydrate from native SharedPreferences on mount (recovers if Android WebView cleared localStorage)
  useEffect(() => {
    let active = true;
    readNativePref<T>(key).then((nativeVal) => {
      if (active && nativeVal !== null && !userEditedRef.current) {
        latestRef.current = nativeVal;
        setState(nativeVal);
      }
    });
    return () => {
      active = false;
    };
  }, [key]);

  // Flush on pagehide / visibilitychange / beforeunload so swipe-kill on Android never loses latest edits
  useEffect(() => {
    const flush = () => {
      void writeNativePref(key, latestRef.current);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [key]);

  const setPersistedState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      userEditedRef.current = true;
      setState((prev) => {
        const next =
          typeof action === 'function' ? (action as (prevState: T) => T)(prev) : action;
        latestRef.current = next;
        void writeNativePref(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, setPersistedState];
}

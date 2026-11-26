import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export function readLocalSync<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        if (typeof fallback === 'string') {
          return raw as unknown as T;
        }
      }
    }
  } catch {
    // ignore corrupted JSON or restricted storage
  }
  return fallback;
}

export function writeLocalSync<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export async function writeNativePref<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  writeLocalSync(key, value);
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key, value: serialized });
    } catch {
      // ignore native storage error
    }
  }
}

export async function readNativePref<T>(key: string): Promise<T | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  try {
    const { value } = await Preferences.get({ key });
    if (value !== null) {
      const parsed = JSON.parse(value) as T;
      writeLocalSync(key, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

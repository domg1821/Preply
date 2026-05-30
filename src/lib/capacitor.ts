import { Capacitor } from '@capacitor/core';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

export async function openUrl(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (isNative()) {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export async function triggerHaptic(): Promise<void> {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* web — no haptics available */ }
}

/** Returns the correct app URL regardless of whether we are on native (capacitor://) or web. */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  if (typeof window === 'undefined') return '';
  // On native Capacitor the origin is "capacitor://localhost" — never use that for share links or auth redirects
  if (window.location.origin.startsWith('capacitor://')) return '';
  return window.location.origin;
}

'use client';
import { useState, useEffect } from 'react';
import { isNative } from '@/lib/capacitor';

/**
 * Returns true only when running inside the native iOS/Android app.
 * Runs after mount to avoid hydration mismatch — starts false on the server
 * and on first client render, then flips to true if we're in the native shell.
 *
 * Used to hide external (Stripe) purchase UI on iOS, which Apple guideline
 * 3.1.1 prohibits. Web keeps the full upgrade flow.
 */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNative());
  }, []);
  return native;
}

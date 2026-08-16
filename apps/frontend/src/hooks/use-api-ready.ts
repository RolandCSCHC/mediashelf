'use client';

import { useEffect, useState } from 'react';
import { fetchApiHealth, isApiHealthy } from '@/lib/api';

export type ApiReadyState = 'checking' | 'ready' | 'error';

const ATTEMPT_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;
const MAX_WAIT_MS = 90_000;

/**
 * Polls `/api/health` until the Nest API (and DB) respond, or give up.
 * Used to avoid starting OAuth while a sleeping API is still waking.
 */
export function useApiReady(): {
  state: ApiReadyState;
  retry: () => void;
} {
  const [state, setState] = useState<ApiReadyState>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function waitUntilReady(): Promise<void> {
      setState('checking');

      while (!cancelled) {
        const health = await fetchApiHealth(ATTEMPT_TIMEOUT_MS);
        if (cancelled) {
          return;
        }

        if (isApiHealthy(health)) {
          setState('ready');
          return;
        }

        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          setState('error');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    void waitUntilReady();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    state,
    retry: () => setAttempt((value) => value + 1),
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchSecureFile, releaseObjectUrl } from '@/lib/secure-files';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';

/**
 * Resolves a secure file URL into an object URL for rendering.
 *
 * Auth strategy:
 *  1. The fetch uses `credentials: 'include'` so the httpOnly auth cookie
 *     is sent automatically (primary path).
 *  2. The Bearer token is sent as a supplementary header when available.
 *  3. If the first attempt fails (e.g. token not yet refreshed after a page
 *     reload), the hook waits briefly and retries once.
 */
export function useSecureObjectUrl(sourceUrl?: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<string | null>(null);

  const updateObjectUrl = useCallback((nextUrl: string | null) => {
    if (cacheRef.current && cacheRef.current !== nextUrl) {
      releaseObjectUrl(cacheRef.current);
    }
    cacheRef.current = nextUrl;
    setObjectUrl(nextUrl);
  }, []);

  useEffect(() => {
    if (!sourceUrl || !isAuthenticated) {
      updateObjectUrl(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    const attemptFetch = async (): Promise<string | null> => {
      const file = await fetchSecureFile(sourceUrl, {
        token: api.getToken() ?? undefined,
        signal: controller.signal,
        attachObjectUrl: true,
      });
      return file.objectUrl ?? null;
    };

    const loadFile = async () => {
      setIsLoading(true);
      try {
        const url = await attemptFetch();
        if (!cancelled) updateObjectUrl(url);
      } catch (error) {
        // If it looks like an auth error and we have no bearer token yet,
        // wait a moment for the token refresh to complete and retry once.
        const isAuthError =
          error instanceof Error &&
          /\b(40[1-3]|Authentication|Forbidden)\b/i.test(error.message);
        const hasNoToken = !api.getToken();

        if (isAuthError && hasNoToken && !cancelled) {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelled) return;
          try {
            const url = await attemptFetch();
            if (!cancelled) updateObjectUrl(url);
          } catch (retryError) {
            if ((retryError as Error)?.name !== 'AbortError') {
              console.warn('Unable to fetch secure file after retry', retryError);
            }
            if (!cancelled) updateObjectUrl(null);
          }
        } else {
          if ((error as Error)?.name !== 'AbortError') {
            console.warn('Unable to fetch secure file', error);
          }
          if (!cancelled) updateObjectUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sourceUrl, isAuthenticated, updateObjectUrl]);

  useEffect(() => () => {
    if (cacheRef.current) {
      releaseObjectUrl(cacheRef.current);
      cacheRef.current = null;
    }
  }, []);

  return { objectUrl, isLoading: isLoading && Boolean(sourceUrl && isAuthenticated) };
}


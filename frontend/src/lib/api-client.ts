import { env } from './env';
import {
  clearSession,
  getAccessToken,
  setAccessTokenDirect,
} from '@/features/auth/store';

export interface ApiError extends Error {
  status: number;
  body: unknown;
  isApiError: true;
}

export const createApiError = (
  status: number,
  body: unknown,
  message: string,
): ApiError => {
  const err = new Error(message) as ApiError;
  err.name = 'ApiError';
  err.status = status;
  err.body = body;
  err.isApiError = true;
  return err;
};

export const isApiError = (e: unknown): e is ApiError =>
  typeof e === 'object' &&
  e !== null &&
  (e as { isApiError?: unknown }).isApiError === true;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip the auto-refresh-on-401 dance — used by the refresh call itself. */
  skipRefresh?: boolean;
  /** Attach the bearer access token. Defaults to true. */
  auth?: boolean;
}

let inflightRefresh: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const data = (await res.json()) as { accessToken: string };
      setAccessTokenDirect(data.accessToken);
      return data.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
};

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const url = new URL(path.startsWith('http') ? path : `${env.apiUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
};

const doFetch = (
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> => {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && options.auth !== false) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(buildUrl(path, options.query), {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
};

export const apiFetch = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  let res = await doFetch(path, options, getAccessToken());

  if (res.status === 401 && !options.skipRefresh && options.auth !== false) {
    const next = await refreshAccessToken();
    if (next) {
      res = await doFetch(path, options, next);
    }
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body: unknown = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      isJson && typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${res.status}`;
    throw createApiError(res.status, body, message);
  }

  return body as T;
};

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string;
}

/**
 * Cliente HTTP mínimo. Funciona tanto en la ventana como en el service worker
 * (solo usa fetch), por eso el motor de sincronización puede compartirlo.
 */
export async function apiRequest<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, payload?.message ?? `Error ${response.status}`);
  }
  return (await response.json()) as T;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
console.log('API_BASE:', API_BASE);

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh?: string) {
  accessToken = access;
  if (refresh !== undefined) refreshToken = refresh;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') localStorage.removeItem('refreshToken');
}

export function persistRefreshToken(token: string) {
  refreshToken = token;
  if (typeof window !== 'undefined') localStorage.setItem('refreshToken', token);
}

async function refreshAccessToken(): Promise<string> {
  const rt = getRefreshToken();
  if (!rt) throw new Error('No refresh token');
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
    credentials: 'include',
  });
  if (!res.ok) {
    clearTokens();
    throw new Error('Session expired');
  }
  const data = await res.json();
  accessToken = data.accessToken;
  return data.accessToken;
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  let token = accessToken;

  const doFetch = (t: string | null) => {
    const headers: HeadersInit = {
      ...(init.headers as Record<string, string>),
    };
    if (t && !skipAuth) headers['Authorization'] = `Bearer ${t}`;
    return fetch(url, { ...init, headers, credentials: 'include' });
  };

  let res = await doFetch(token);

  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const errorMessage = err.error ? 
      (typeof err.error === 'string' ? err.error : JSON.stringify(err.error)) : 
      (err.message ?? 'Request failed');
    throw new Error(errorMessage);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

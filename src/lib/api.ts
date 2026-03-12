/**
 * API utility for making authenticated requests to the backend
 * Handles JWT token storage and attachment to requests
 */

/** Get API base URL - uses current origin so it always matches where the page is served from. */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

const AUTH_KEYS = {
  admin: 'auth_token_admin',
  instructor: 'auth_token_instructor',
  student: 'auth_token_student',
  default: 'auth_token',
} as const;

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Get the token for the current route context so admin and student can stay logged in in different tabs.
 * /admin/* -> auth_token_admin, /instructor/* -> auth_token_instructor, /student/* -> auth_token_student.
 * On / and /login we return null so the login page shows and the user can choose role (avoids admin tab "crashing" when student logged in another tab).
 */
export const getToken = (): string | null => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/admin')) return safeGetItem(AUTH_KEYS.admin);
  if (path.startsWith('/instructor')) return safeGetItem(AUTH_KEYS.instructor);
  if (path.startsWith('/student')) return safeGetItem(AUTH_KEYS.student);
  if (path === '/login' || path === '/') return null; // Never use default token so each tab stays with its role
  return safeGetItem(AUTH_KEYS.default);
};

/**
 * Store JWT token. If role is provided, stores in role-specific key so the other role sessions stay valid.
 */
export const setToken = (token: string, role?: 'admin' | 'instructor' | 'student'): void => {
  if (role === 'admin') safeSetItem(AUTH_KEYS.admin, token);
  else if (role === 'instructor') safeSetItem(AUTH_KEYS.instructor, token);
  else if (role === 'student') safeSetItem(AUTH_KEYS.student, token);
  safeSetItem(AUTH_KEYS.default, token);
};

/**
 * Remove JWT token for the current route context only, so other role tabs stay logged in.
 * Only removes the path-specific key (and default for that path); does not touch other role keys.
 */
export const removeToken = (): void => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/admin')) {
    safeRemoveItem(AUTH_KEYS.admin);
    safeRemoveItem(AUTH_KEYS.default);
  } else if (path.startsWith('/instructor')) {
    safeRemoveItem(AUTH_KEYS.instructor);
    safeRemoveItem(AUTH_KEYS.default);
  } else if (path.startsWith('/student')) {
    safeRemoveItem(AUTH_KEYS.student);
    safeRemoveItem(AUTH_KEYS.default);
  }
  // For / or /login we don't remove; no role-specific token to clear
};

/**
 * Make an authenticated API request
 * Automatically attaches JWT token if available
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const url = `${getApiBaseUrl()}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle 401 Unauthorized - token expired or invalid; sync auth state so this tab redirects to login
    if (response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }

    return response;
  } catch (error) {
    if (import.meta.env.DEV) console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Safely parse JSON from a response. Handles 503/HTML error pages that would throw "Unexpected token '<'".
 */
export async function safeParseJson<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  const ct = response.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    if (response.status === 503) {
      throw new Error('Server is temporarily unavailable (503). Please try again in a few minutes.');
    }
    if (text.startsWith('<')) {
      throw new Error('Server returned an error page. The backend may not be running. Please try again later.');
    }
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `Invalid response (status ${response.status})`);
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }),

  put: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }),

  patch: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// 1. Dynamic Header Helper - Reads token FRESH on every call
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// 2. Auth Error Handler - Clears token and redirects on 401/403
function handleAuthError(res: Response): never {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('role');
    localStorage.removeItem('org_mode');
    localStorage.removeItem('user_profile');
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login?error=session_expired';
    }
  }
  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

// 3. The API Object - All methods use dynamic headers
async function safeJsonParse(res: Response) {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('[API] Non-JSON response:', text.substring(0, 200));
    throw new Error(`Expected JSON but got ${contentType}`);
  }
  return res.json();
}

export const api = {
  get: async (endpoint: string) => {
    const url = `${API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) handleAuthError(res);
      return { data: await safeJsonParse(res) };
    } catch (error) {
      console.error(`[API] GET ${url} failed:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, body: unknown) => {
    const url = `${API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) handleAuthError(res);
      return { data: await safeJsonParse(res) };
    } catch (error) {
      console.error(`[API] POST ${url} failed:`, error);
      throw error;
    }
  },

  patch: async (endpoint: string, body: unknown) => {
    const url = `${API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) handleAuthError(res);
      return { data: await safeJsonParse(res) };
    } catch (error) {
      console.error(`[API] PATCH ${url} failed:`, error);
      throw error;
    }
  },

  put: async (endpoint: string, body: unknown) => {
    const url = `${API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) handleAuthError(res);
      return { data: await safeJsonParse(res) };
    } catch (error) {
      console.error(`[API] PUT ${url} failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    const url = `${API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) handleAuthError(res);
      return { data: await safeJsonParse(res) };
    } catch (error) {
      console.error(`[API] DELETE ${url} failed:`, error);
      throw error;
    }
  },
};

// 4. Form Data Helper (no Content-Type - browser sets boundary)
export const apiForm = {
  post: async (endpoint: string, formData: FormData) => {
    const headers: HeadersInit = {};

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) handleAuthError(res);
    return { data: await res.json() };
  },
};

// Legacy exports for backward compatibility
export { API_URL };
export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) handleAuthError(res);
  return res;
};

// FormData version - returns raw Response for compatibility
export const apiFormFetch = async (endpoint: string, formData: FormData) => {
  const headers: HeadersInit = {};

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) handleAuthError(res);
  return res;
};

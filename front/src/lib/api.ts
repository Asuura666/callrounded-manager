const API_URL = import.meta.env.VITE_API_URL || "/api";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;
  let url = `${API_URL}${path}`;
  if (params) {
    const sp = new URLSearchParams(params);
    url += `?${sp.toString()}`;
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      // Retry original request
      const retryRes = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...init.headers },
        ...init,
      });
      if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
      return retryRes.json();
    }
    // Redirect to login
    window.location.href = "/login";
    throw new Error("Non authentifié");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};

const API_BASE_URL = 'https://sso-gestion-riesgos-backend.onrender.com/v1';

type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(
  endpoint: string,
  metodo: MetodoHttp,
  body?: unknown,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: metodo,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!respuesta.ok) {
    let mensaje = 'Error en la solicitud';

    try {
      const errorData = await respuesta.json();
      mensaje = errorData.message || errorData.error || mensaje;
    } catch {
      mensaje = `Error HTTP ${respuesta.status}`;
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null as T;
  }

  return respuesta.json();
}

export function apiGet<T>(endpoint: string, token?: string | null) {
  return request<T>(endpoint, 'GET', undefined, token);
}

export function apiPost<T>(endpoint: string, body?: unknown, token?: string | null) {
  return request<T>(endpoint, 'POST', body, token);
}

export function apiPatch<T>(endpoint: string, body?: unknown, token?: string | null) {
  return request<T>(endpoint, 'PATCH', body, token);
}

export function apiDelete<T>(endpoint: string, token?: string | null) {
  return request<T>(endpoint, 'DELETE', undefined, token);
}
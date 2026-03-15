import type { Produto, Restricao } from '@shared/types';

const BASE_URL = 'http://localhost:3000';

async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string })?.error ?? res.statusText);
  }
  return res.json() as Promise<{ url: string }>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

const api = {
  products: {
    /** GET /api/products — retorna todos os produtos */
    getAll: (): Promise<{ products: Produto[] }> =>
      request('/api/products'),

    /** GET /api/products/:id — retorna um produto pelo ID */
    getById: (id: number): Promise<{ product: Produto }> =>
      request(`/api/products/${id}`),

    /** POST /api/products — cria um novo produto */
    create: (data: Omit<Produto, 'id'>): Promise<{ product: Produto }> =>
      request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),

    /** PUT /api/products/:id — atualiza um produto */
    update: (id: number, data: Partial<Omit<Produto, 'id'>>): Promise<{ product: Produto }> =>
      request(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),

    /** DELETE /api/products/:id — remove um produto */
    delete: (id: number): Promise<{ message: string }> =>
      request(`/api/products/${id}`, { method: 'DELETE' }),

    /** POST /api/products/generate-description — gera descrição via IA */
    generateDescription: (
      name: string,
      definicao?: string,
    ): Promise<{ data: { definicao: string | null; descricao: string; restricoes: Restricao[]; ingredientes: string[] } }> =>
      request('/api/products/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, definicao }),
      }),
  },

  ai: {
    /** GET /api/ia — verifica se a IA está configurada */
    ping: (): Promise<{ message: string; apiKeyConfigured: boolean }> =>
      request('/api/ia'),

    /** GET /api/ia/generate?prompt=... — gera texto com IA */
    generate: (prompt: string): Promise<{ generated: string }> =>
      request(`/api/ia/generate?prompt=${encodeURIComponent(prompt)}`),
  },

  /** POST /api/upload — faz upload de uma imagem para o UploadThing */
  uploadImage,
};

export default api;

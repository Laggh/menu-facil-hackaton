import type { Produto, Restricao, PedidoProduto, Pedido } from '@shared/types';

const BASE_URL = 'http://localhost:3000';

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

    /** GET /api/products/busca — busca semântica inteligente (com fallback) */
    search: (query: string): Promise<{ products: Produto[] }> =>
      request(`/api/products/busca?q=${encodeURIComponent(query)}`),
  },

  ai: {
    /** GET /api/ia — verifica se a IA está configurada */
    ping: (): Promise<{ message: string; apiKeyConfigured: boolean }> =>
      request('/api/ia'),

    /** GET /api/ia/generate?prompt=... — gera texto com IA */
    generate: (prompt: string): Promise<{ generated: string }> =>
      request(`/api/ia/generate?prompt=${encodeURIComponent(prompt)}`),
  },

  orders: {
    /** GET /api/orders — lista todos os pedidos */
    getAll: (): Promise<{ orders: Pedido[] }> =>
      request('/api/orders'),

    /** GET /api/orders/:id — busca pedido por ID */
    getById: (id: number): Promise<{ order: Pedido }> =>
      request(`/api/orders/${id}`),

    /** POST /api/orders — cria um novo pedido */
    create: (usuarioId: number, produtos: PedidoProduto[]): Promise<{ order: Pedido }> =>
      request('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, produtos }),
      }),
  },
};

export default api;

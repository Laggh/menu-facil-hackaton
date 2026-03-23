import type { Produto, Restricao, PedidoProduto, Pedido, Usuario } from '@shared/types';

const BASE_URL = 'http://localhost:3000';

// Armazena o userID localmente (será melhorado com AsyncStorage)
let currentUserId: string | null = null;

export const setUserId = (id: string | null) => {
  currentUserId = id;
};

export const getUserId = () => currentUserId;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

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

    /** POST /api/products/suggest — gera sugestões com base no carrinho */
    getSuggestions: (carrinho: PedidoProduto[]): Promise<{ sugestoes: Produto[] }> =>
      request('/api/products/suggest', {
        method: 'POST',
        body: JSON.stringify({ carrinho }),
      }),
  },

  ai: {
    /** GET /api/ia — verifica se a IA está configurada */
    ping: (): Promise<{ message: string; apiKeyConfigured: boolean; aiFunctionsMayBeUnavailable?: boolean; reason?: string | null; lastFlashQuotaErrorAt?: string | null }> =>
      request('/api/ia'),

    /** GET /api/ia/generate?prompt=... — gera texto com IA */
    generate: (prompt: string): Promise<{ generated: string }> =>
      request(`/api/ia/generate?prompt=${encodeURIComponent(prompt)}`),

    /** GET /api/ia/recommendations — retorna recomendações personalizadas para o usuário */
    getRecommendations: (): Promise<{ recommendations: Produto[], error?: string | null }> =>
      request('/api/ia/recommendations'),

    /** POST /api/ia/suggest-from-cart — retorna sugestões baseadas no carrinho */
    suggestFromCart: (cart: PedidoProduto[]): Promise<{ suggestions: Produto[], error?: string | null }> =>
      request('/api/ia/suggest-from-cart', {
        method: 'POST',
        body: JSON.stringify({ cart }),
      }),
  },

  orders: {
    /** GET /api/orders — lista todos os pedidos */
    getAll: (): Promise<{ orders: Pedido[] }> =>
      request('/api/orders'),

    /** GET /api/orders/user — lista pedidos do usuário autenticado */
    getByUser: (): Promise<{ orders: Pedido[]; pendentes: Pedido[]; completos: Pedido[]; arquivados: Pedido[]; cancelados: Pedido[] }> =>
      request('/api/orders/user'),

    /** GET /api/orders/latest — retorna o último pedido do usuário */
    getLastOrder: (): Promise<{ order: Pedido }> =>
      request('/api/orders/latest'),

    /** GET /api/orders/:id — busca pedido por ID */
    getById: (id: string): Promise<{ order: Pedido }> =>
      request(`/api/orders/${id}`),

    /** POST /api/orders — cria um novo pedido */
    create: (produtos: PedidoProduto[]): Promise<{ order: Pedido }> =>
      request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ produtos }),
      }),
  },

  user: {
    /** POST /api/user/register — registrar novo usuário */
    register: (nome: string, email: string, idade: number): Promise<{ user: Usuario }> =>
      request('/api/user/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, idade }),
      }),

    /** POST /api/user/login — fazer login */
    login: (email: string): Promise<{ user: Usuario; token: string }> =>
      request('/api/user/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    /** GET /api/user/me — obter dados do usuário atual */
    getMe: (): Promise<{ user: Usuario }> =>
      request('/api/user/me'),

    /** PUT /api/user/edit — atualizar dados do usuário */
    update: (data: Partial<Omit<Usuario, 'id'>>): Promise<{ user: Usuario }> =>
      request('/api/user/edit', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};

export default api;

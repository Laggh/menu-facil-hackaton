import type { Produto, Restricao, GeminiLog, Usuario, Pedido, StatusPedido, PedidoProduto, Task } from '@shared/types';

const BASE_URL = 'http://localhost:3000';

// Função auxiliar para obter user ID do localStorage (ou de onde estiver armazenado)
function getUserId(): string | null {
  try {
    return localStorage.getItem('userId');
  } catch {
    return null;
  }
}

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

// Request com suporte a headers customizados (para x-user-id)
async function requestWithHeaders<T>(path: string, options?: RequestInit & { headers?: Record<string, string> }): Promise<T> {
  const headers = options?.headers || {};
  const userId = getUserId();
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
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
      requestWithHeaders('/api/ia/recommendations'),

    /** POST /api/ia/suggest-from-cart — retorna sugestões baseadas no carrinho */
    suggestFromCart: (cart: PedidoProduto[]): Promise<{ suggestions: Produto[], error?: string | null }> =>
      requestWithHeaders('/api/ia/suggest-from-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      }),
  },

  logs: {
    /** GET /api/log — retorna os logs do Gemini */
    getAll: (): Promise<{ logs: (GeminiLog | { raw: string })[] }> => 
      request(`/api/log?_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } }),
  },

  users: {
    /** GET /api/user — retorna todos os usuários */
    getAll: (): Promise<{ users: Usuario[] }> => request('/api/user'),
  },

  tasks: {
    /** GET /api/tasks — retorna as tasks do servidor */
    getAll: (): Promise<{ total: number, pending: number, completed: number, failed: number, tasks: Task[] }> => 
      request(`/api/tasks?_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } }),
  },

  orders: {
    /** GET /api/orders — retorna todos os pedidos */
    getAll: (): Promise<{ orders: Pedido[], pendentes: Pedido[], completos: Pedido[], cancelados: Pedido[], arquivados: Pedido[] }> => 
      request('/api/orders'),

    /** PUT /api/orders/:id/status — atualiza o status de um pedido */
    updateStatus: (id: string, status: StatusPedido): Promise<{ order: Pedido }> =>
      request(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),

    /** PUT /api/orders/:id/archive — arquiva um pedido */
    archive: (id: string): Promise<{ order: Pedido }> =>
      request(`/api/orders/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }),
  },

  /** POST /api/upload — faz upload de uma imagem para o UploadThing */
  uploadImage,
};

export default api;

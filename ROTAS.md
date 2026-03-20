# Documentacao de Rotas da API (Menu Facil)

Este arquivo descreve as rotas realmente implementadas no back-end atual.

Todas as rotas de API usam JSON.

---

## Rotas Gerais (server/src/index.ts)

### GET /
Confirma que a API esta no ar.
- Input: nenhum
- Output: { message: "Bem-vindo a API Menu Facil!" }

### GET /ping
Healthcheck simples.
- Input: nenhum
- Output: { message: "Pong!" }

### GET /db
Teste de escrita e leitura no Redis.
- Input: nenhum
- Output: { value: "Hello, Redis!" }

---

## Produtos (/api/products) (server/src/user/productRoutes.ts)

### GET /api/products
Lista todo o catalogo.
- Input: nenhum
- Output: { products: Produto[] }

### GET /api/products/:id
Retorna um produto por ID numerico.
- Input:
	- route param: id (number)
- Output: { product: Produto }
- Erros comuns: 400 (id invalido), 404 (nao encontrado)

### POST /api/products
Cria produto.
- Input: body com Produto sem id
- Output: { product: Produto }
- Erros comuns: 400 (dados invalidos)

### PUT /api/products/:id
Atualiza produto por ID.
- Input:
	- route param: id (number)
	- body: campos parciais de Produto
- Output: { product: Produto | null }
- Erros comuns: 400 (id invalido ou dados invalidos)

### DELETE /api/products/:id
Remove produto por ID.
- Input: route param id (number)
- Output: { message: "Produto excluido com sucesso" }
- Erros comuns: 400 (id invalido)

### POST /api/products/generate-description
Gera descricao, ingredientes e restricoes por IA.
- Input: { name: string, definicao?: string }
- Output:
	- sucesso: { data: { definicao: string | null, descricao: string, restricoes: Restricao[], ingredientes: string[] } }
- Erros comuns: 400 (name ausente), 422 (informacao insuficiente), 503 (IA indisponivel)

### POST /api/products/search
Busca com IA e fallback textual.
- Input:
	- body: { query: string }
	- header opcional: x-user-id
- Output: { produtos: Produto[], error: string | null }
- Observacao: esta rota responde com chave produtos (PT-BR).

### GET /api/products/busca
Busca por query em GET com IA + fallback.
- Input:
	- query param: q (string)
	- header opcional: x-user-id
- Output: { products: Produto[], error: string | null }
- Observacao: esta rota responde com chave products (EN).

### POST /api/products/suggest
Sugere produtos com base no carrinho.
- Input:
	- body: { carrinho: PedidoProduto[] }
	- header opcional: x-user-id
- Output: { sugestoes: Produto[], error: string | null }
- Erros comuns: 400 (carrinho ausente, vazio ou invalido)

---

## Pedidos (/api/orders) (server/src/user/orderRoutes.ts)

### POST /api/orders
Cria pedido do usuario autenticado.
- Input:
	- header obrigatorio: x-user-id
	- body: { produtos: PedidoProduto[], horario?: string }
- Output: { order: Pedido }
- Erros comuns: 401 (sem x-user-id), 400 (payload invalido)

### GET /api/orders/user
Lista pedidos do usuario autenticado.
- Input: header obrigatorio x-user-id
- Output: { orders, pendentes, completos, cancelados, arquivados }
- Erros comuns: 401

### GET /api/orders
Lista pedidos (visao admin).
- Input: nenhum
- Output: { orders, pendentes, completos, cancelados, arquivados }

### GET /api/orders/latest
Retorna o ultimo pedido do usuario autenticado.
- Input: header obrigatorio x-user-id
- Output: { order: Pedido }
- Erros comuns: 401, 404 (sem pedidos)

### GET /api/orders/:id
Busca pedido por ID.
- Input: route param id (string)
- Output: { order: Pedido }
- Erros comuns: 404

### PUT /api/orders/:id/status
Atualiza status de pedido e, em transicao PENDENTE -> COMPLETO, tenta atualizar etiqueta de usuario via IA.
- Input:
	- route param id
	- body: { status: "PENDENTE" | "COMPLETO" | "CANCELADO" | "ARQUIVADO" }
- Output: { order: Pedido }
- Erros comuns: 400 (status invalido), 404

### PUT /api/orders/:id/archive
Arquiva pedido (equivale a status ARQUIVADO).
- Input: route param id
- Output: { order: Pedido }
- Erros comuns: 404

---

## Usuarios (/api/user) (server/src/user/userRoutes.ts)

### GET /api/user
Lista usuarios.
- Input: nenhum
- Output: { users: Usuario[] }

### GET /api/user/me
Retorna dados do usuario autenticado.
- Input: header obrigatorio x-user-id
- Output: { user: Usuario }
- Erros comuns: 401, 404

### POST /api/user/register
Cria novo usuario.
- Input: { nome: string, email: string, idade: number }
- Output: { user: Usuario }
- Erros comuns: 400 (campos invalidos), 409 (email ja registrado)

### POST /api/user/login
Login por email.
- Input: { email: string }
- Output: { user: Usuario, token: string }
- Observacao: token atualmente e o proprio user.id
- Erros comuns: 400, 404

### PUT /api/user/edit
Atualiza campos do usuario autenticado.
- Input:
	- header obrigatorio: x-user-id
	- body parcial: { nome?, email?, idade?, etiqueta? }
- Output: { user: Usuario }
- Erros comuns: 401, 400, 404

---

## IA (/api/ia) (server/src/user/aiRoutes.ts)

### GET /api/ia
Healthcheck da camada de IA.
- Input: nenhum
- Output: { message, apiKey, apiKeyConfigured }
- Observacao: atualmente expõe apiKey na resposta; isso nao e recomendado para producao.

### GET /api/ia/generate
Teste simples de geracao.
- Input: query param opcional prompt
- Output: { generated: string }

### GET /api/ia/recommendations
Recomendacoes por perfil de usuario.
- Input: header opcional x-user-id
- Output: { recommendations: Produto[], error?: string | null }

### POST /api/ia/suggest-from-cart
Sugere itens complementares com base no carrinho.
- Input:
	- body: { cart: PedidoProduto[] }
	- header opcional: x-user-id
- Output: { suggestions: Produto[], error?: string | null }
- Erros comuns: 400 (cart invalido)

---

## Logs, Upload e Tasks

### GET /api/log (server/src/user/logRoutes.ts)
Retorna logs das chamadas Gemini.
- Input: nenhum
- Output: { logs: (GeminiLog | { raw: string })[] }

### POST /api/upload (server/src/uploadRoute.ts)
Upload de imagem (multipart/form-data).
- Input: campo file (imagem)
- Output: { url: string }
- Limites: 4MB, apenas mimetype image/*

### GET /api/tasks (server/src/user/taskRoutes.ts)
Resumo de tasks na fila.
- Output: { total, pending, completed, failed, tasks }

### GET /api/tasks/pending
Tasks com status pending.

### GET /api/tasks/processing
Tasks com status processing.

### GET /api/tasks/stats
Estatisticas de tasks.

### GET /api/tasks/type/:type
Tasks por tipo (atualmente GENERATE_USER_TAG).

### GET /api/tasks/user/:usuarioId
Tasks por usuario.

### GET /api/tasks/:id
Task por ID (aceita busca parcial como fallback).

# 🌐 Documentação de Rotas da API (Menu Fácil)

Este arquivo centraliza e descreve todas as rotas e endpoints disponíveis no App (Back-end: Express.js).

> **Convenção:** A IA é um detalhe de implementação, não parte da URL. Rotas são orientadas a recursos. Onde há inteligência por baixo, está indicado com 🤖.

Todas as rotas (`/api/`) retornam respostas tipificadas em JSON.

---

## 🟢 Rotas Gerais (`server/src/index.ts`)

### GET /
Rota base, confirmação simples de que a API está rodando.
- **Input:** Nenhum
- **Output:** `{ message: "..." }`
- **Comentários:** Usado basicamente para verificar se o Node não "crashou".

### GET /ping
Rota de healthcheck para serviços na nuvem mapearem atividade.
- **Input:** Nenhum
- **Output:** `"pong"` ou `{ status: "ok" }`
- **Comentários:** Retorno extremamente leve, ideal para _liveness probes_.

### GET /db
Rota de suporte para garantir que o banco em memória (ou real) está populado e as tabelas criadas.
- **Input:** Nenhum
- **Output:** Confirmação de status do banco.
- **Comentários:** Útil rodar manualmente na inicialização durante testes ou hackathon.

---

## 🍔 Produtos (`/api/products/`)
*Arquivo:* `server/src/user/productRoutes.ts`

### GET /api/products/
Retorna o catálogo completo de produtos.
- **Input:** Query param opcional: `?categoria=` (ex: `PRATO_PRINCIPAL`)
- **Output:** Array de objetos Produto: `[ { id, nome, preco, categoria, imagem_url, restricoes }, ... ]`
- **Comentários:** Se a categoria solicitada não for encontrada ou a string for inválida, pode retornar `404` ou lista vazia.

### GET /api/products/:id
Retorna os detalhes de um produto específico.
- **Input:** Route param `:id` (UUID do produto)
- **Output:** Objeto detalhado do Produto.
- **Comentários:** Se não encontrado, retorna erro `404 Not Found`.

### POST /api/products/
(Admin) Criação de um novo produto no cardápio.
- **Input:** Objeto JSON no body da requisição (nome, preco, categoria, ingredientes, etc.)
- **Output:** JSON com o objeto criado incluindo seu novo ID.
- **Comentários:** Validações de segurança e tipagem podem rejeitar a requisição com `400` para body incompleto.

### PUT /api/products/:id
(Admin) Atualização dos dados de um produto existente.
- **Input:** Route param `:id` e Body contendo as chaves para atualização.
- **Output:** O objeto do produto atualizado.
- **Comentários:** Se o ID informado não existir na base, retorna erro `404`.

### DELETE /api/products/:id
(Admin) Remove um produto permanentemente.
- **Input:** Route param `:id`
- **Output:** Mensagem de sucesso (ex: `{ success: true }`).
- **Comentários:** Remoção de produtos deve ser feita com cautela por conta de histórico de pedidos.

### GET /api/products/busca
Busca básica de texto por produtos.
- **Input:** Query param `?q=` (ex: `?q=salada`)
- **Output:** Array de objetos Produto filtrados.
- **Comentários:** Retorna `400` caso a busca esteja vazia. Serve como fallback caso a busca semântica esteja inativa.

### POST /api/products/search 🤖
Busca semântica inteligente (NLP). Cruza intenções fluídas ("quero algo leve sem lactose") com itens do cardápio.
- **Input:** Body no formato `{ "query": "texto da busca" }` e/ou Query param `?q=`
- **Output:** Array dos produtos que corresponderem ao perfil filtrado pelo Gemini.
- **Comentários:** Caso o Gemini falhe, levante instabilidades ou o limite da API do Google bata (erro 500), um bloco _catch/fallback_ deve rodar uma busca em texto limpo padrão.

### POST /api/products/suggest 🤖
Recomenda produtos baseados estritamente na etiqueta inteligente preexistente de um usuário.
- **Input:** Body contendo `{ "usuarioId": "uuid-do-usuario" }`
- **Output:** 3 Objetos Produto sob medida.
- **Comentários:** Se o `usuarioId` for inválido: `404`. Caso caia o serviço de IA, retorna sugestões básicas pelo horário do dia.

### POST /api/products/generate-description 🤖
(Admin) Gera metadados de um prato inteiro (definição, ingredientes, restrições alimentares) consumindo a IA, para aliviar atrito no cadastro para o vendedor.
- **Input:** Body contendo o nome: `{ "nome": "Risoto Quatro Queijos", "definicao": "(opcional)" }`
- **Output:** JSON estruturado com os arrays sugeridos.
- **Comentários:** Se o nome vier em branco causa `400`. Pode retornar `null` caso a estrutura do JSON da IA fuja do `responseSchema` obrigatório.

---

## 📦 Pedidos (`/api/orders/`)
*Arquivo:* `server/src/user/orderRoutes.ts`

### GET /api/orders/
(Admin) Lista todos os pedidos registrados de todos os clientes.
- **Input:** Parâmetros de paginação e filtros opcionais.
- **Output:** Array completo de todo o histórico de Pedidos e Carrinhos fechados.
- **Comentários:** Recomenda-se adicionar limites/paginação, pois a lista pode crescer descontroladamente.

### GET /api/orders/user
Retorna os pedidos da conta do usuário que está logado.
- **Input:** O sistema lê os metadados do solicitante logado na requisição (ex: ID na header/cookie).
- **Output:** Lista com histórico de compras do cliente.
- **Comentários:** Array vazio `[]` caso nunca tenha comprado.

### GET /api/orders/:id
Mostra detalhes ou recibo de um pedido passados.
- **Input:** Route param `:id`
- **Output:** Objeto Pedido (com array dos produtos internos contidos).
- **Comentários:** Erro `404` se o Id pesquisado não existir.

### POST /api/orders/
Criação/Checkout de um novo pedido. O final do funil de venda.
- **Input:** JSON estruturado contendo a listagem atual do carrinho. Ex: `{ "usuarioId": "...", "produtos": [...], "preco_total": 45.90, "horario": "..." }`
- **Output:** Recibo contendo as chaves do novo pedido gravado no BD.
- **Comentários:** O sistema confere as restrições dos produtos. Caso algum produto listado tenha sido deletado, poderá engatilhar `400`.

### PUT /api/orders/:id/status 🤖
Atualiza manualmente a "esteira" do pedido.
- **Input:** Rota `:id` com body `{ "status": "FINALIZADO" }`
- **Output:** Status modificado.
- **Comentários:** **Extremamente Importante**: É aqui que o perfil IA do cliente avança em background. Quando um pedido ganha sinal positivo (`Concluído/Finalizado`), um Agent do Gemini atualiza e refina a sua `etiqueta` com base na nova compra de forma assíncrona.

### PUT /api/orders/:id/archive
Movimenta o pedido para uma abas de arquivados num Dashboard (esconde da listagem padrão de preparo).
- **Input:** Route param `:id`
- **Output:** Alteração de "active" ou status equivalente.
- **Comentários:** Oculta para a view admin da cozinha, sem excluir do BD.

---

## 👥 Usuários (`/api/user/`)
*Arquivo:* `server/src/user/userRoutes.ts`

### GET /api/user/
Traz uma listagem geral de contas.
- **Input:** Nenhum.
- **Output:** Array com todos os usuários do app.
- **Comentários:** Rota tipicamente de controle admin generalizado.

### GET /api/user/me
Rota para a interface puxar os atributos básicos do próprio usuário logado a qualquer momento.
- **Input:** Auth guard / contexto da sessão atual.
- **Output:** Objeto Usuário (ex: nome, id, saldo/fidelidade).
- **Comentários:** Pode falhar com `401 Unauthorized` se a requisição via Axios não tiver token/cookie vigente.

### POST /api/user/login
Efetua autenticação ativa do indivíduo.
- **Input:** `{ "email": "teste@email.com", "senha": "abc" }`
- **Output:** Resposta com credenciais ou token assinado para ser ingerido pelo app.
- **Comentários:** Levanta status da casa do `401 - Unauthorized` para falhas de credenciais (ou 404 se email não estiver preexistente).

### POST /api/user/register
Cadastro de um prospecto recomeçado do zero.
- **Input:** Formulário inicial `{ "nome": "...", "email": "...", "senha": "..." }`
- **Output:** Perfil gravado, geralmente já seguido de log-in automático (Token retornado junto com sucesso do objeto novo).
- **Comentários:** Se e-mail já estiver na base pode ejetar um `409 Conflict`.

### PUT /api/user/edit
Alteração de conta/Configurações pelo cliente.
- **Input:** Partes que foram editadas como nome, avatar ou traços.
- **Output:** Seu perfil novo modificado para renderizar de volta na tela de settings.
- **Comentários:** Permissões requeridas.

---

## 🧠 Inteligência Artificial (`/api/ia/`)
*Arquivo:* `server/src/user/aiRoutes.ts`

### GET /api/ia/
Visualizador de Saúde/Logs pontuais das chamadas do Google Gemini.
- **Input:** Nenhum
- **Output:** Status se a chave está configurada e respondendo na porta atual.
- **Comentários:** Essencial nas Hackathons para diagnosticar APIs fora do ar em vez de duvidar do front-end.

### GET /api/ia/generate 🤖
Ferramenta interna para verificação da lib de geração.
- **Input:** Query string ex: `?prompt=meu_prompt`
- **Output:** Retorno simples com a resposta por escrito.
- **Comentários:** Principalmente de uso interno, rota frágil e desencorajada de estar exposta no ambiente de prod. 

### GET /api/ia/recommendations 🤖
Consolidador direto de perfis ("🌟 Feito para Você").
- **Input:** Nenhum payload estrito se a ID for captada sozinha pela sessão da call de API.
- **Output:** Array de pratos (tipicamente 3) baseados nos traços da `etiqueta` comportamental que o Agent vem juntando.
- **Comentários:** Tem um fallback que volta apenas em cima de itens que possuem categorias que melhor combinam com o `horário de relógio do sistema` para não haver seções vazias.

### POST /api/ia/suggest-from-cart 🤖
Motor de _Upsell_ para aumentar receita no momento do checkout e diminuir fricção de descobertas.
- **Input:** Objeto com IDs que já estão na sacola: `{ "usuarioId": "1", "carrinhoIds": ["id1", "id2"] }`
- **Output:** Objeto único (um Produto com match contextual como refrigerante zero para acompanhar, etc). Pode ser `null`.
- **Comentários:** Caso algum dos arrays `carrinhoIds` não for decifrado, falha 404. Seu _fallback_ estúpido no Catch(e) interno tenta jogar uma categoria complementar de qualquer preceito (ex: sobremesas se a pessoa tem salgados) ao invés de desistir e não renderizar recomendação pela quebra do provedor do LLM.

---

## ⚙️ Utilitários

### POST /api/upload/
*Arquivo:* `server/src/uploadRoute.ts`
Processa e sobe binários como fotos de anúncios na tela admin.
- **Input:** FormData `multipart/form-data` portando o campo referenciado do file.
- **Output:** String/JSON da URL em tempo real para pré-visualização ou salvamento posterior em pratos.
- **Comentários:** Encerra no status `400` caso falte o anexo principal, ou `413 Payload Too Large` sobre dimensionado contra as limits de `body-parser`.

### GET /api/log/
*Arquivo:* `server/src/user/logRoutes.ts`
Lê os contêineres de log para o dashboard expor decisões em texto (debug pro painel).
- **Input:** Opções de linhas ou filtro a critério de query parameters.
- **Output:** Trilha de Logs ou Strings.
- **Comentários:** Geralmente útil para uma aba técnica na interface ilustrar pro júri "a IA conversando no back-end".

# 🚀 Arquitetura do Projeto: Menu Fácil Inteligente (Hackathon Colibri 2026)

## 🎯 Objetivo do Projeto

Transformar o "Menu Fácil" de um cardápio digital estático para um **Vendedor Digital Inteligente**. O foco principal é aumentar o ticket médio (Upsell), reduzir a fricção de compra (Simplicidade) e criar um perfil comportamental do cliente (Disruptura).

## 🛠️ Tech Stack

* **Front-end (Cliente):** React Native (com Axios para requisições).
* **Front-end (Admin/Dashboard):** React (Web) ou interface administrativa no próprio app.
* **Back-end:** Express.js (Node.js).
* **Banco de Dados/Cache:** Upstash (Redis) para resgate ultrarrápido de sessões e perfis de IA.
* **Armazenamento de Imagens:** Uploadthing.
* **Inteligência Artificial:** Gemini 3.0 (utilizando `Structured Output` / `responseSchema` para garantir retornos em JSON estritos).

### ⚠️ Nota sobre Autenticação e Fallback

* **Para a Hackathon:** Autenticação mockada. Usuário sempre é ID `1` (Nome: "João da Silva"). Endpoints validam se o `usuarioId` existe no banco.
* **Fallback IA:** Todas as funções que usam IA possuem uma versão "burra" de fallback. Se o Gemini falhar ou os servidores do Google caírem, o sistema continua funcionando com lógica simples (ex: busca por palavras-chave, sugestões por horário/data).

---

## 💾 Modelagem de Dados (Data Structures)

### 1. Entidade: Usuário

Representa o cliente final. O campo mais importante é a `etiqueta`, que funciona como a "memória" da IA.

```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@email.com",
  "idade": 28,
  "etiqueta": "Evita glúten, ticket médio alto, gosta de combos com bebida, fã de sabores picantes." // Texto gerado e atualizado pela IA
}

```

### 2. Entidade: Produto

Rico em metadados para garantir que a IA faça o *match* perfeito e evite sugerir itens que causem alergia.

```json
{
  "id": "uuid",
  "nome": "X-Vulcano",
  "definicao": "Hambúrguer de 160g com creme de cheddar, pepperoni e pimenta jalapeño no pão brioche.", // Para a IA entender
  "descricao": "Uma explosão de sabor para quem ama queijo e pimenta!", // Para o Cliente ler
  "preco": 35.90,
  "categoria": "PRATO_PRINCIPAL",
  "imagem_url": "https://uploadthing.com/...",
  "ingredientes": ["Pão brioche", "Carne bovina", "Cheddar", "Pepperoni", "Jalapeño"],
  "restricoes": ["Glúten", "Lactose", "Carne Vermelha"]
}

```

### 3. Entidade: Categoria

Categorias pré-definidas para organização do cardápio.

```
PRATO_PRINCIPAL
ACOMPANHAMENTOS
BEBIDAS
SOBREMESA
OUTROS
```

### 4. Entidade: Pedido

Registro de compra do usuário. Usado para atualizar o perfil comportamental.

```json
{
  "id": "uuid",
  "usuarioId": "1",
  "produtos": [
    {
      "id": "uuid-produto",
      "nome": "X-Vulcano",
      "preco": 35.90,
      "quantidade": 1
    }
  ],
  "horario": "2026-03-10T19:30:00Z",
  "preco_total": 35.90,
  "criado_em": "2026-03-10T19:30:00Z"
}
```

---

## 🧠 Lógicas de Inteligência Artificial (Core AI Features)

### Funcionalidade 1: Cadastro Inteligente (Dashboard Admin)

* **Como funciona:** O dono do restaurante digita o "Nome" do prato e faz upload da foto. O Gemini recebe o nome e gera automaticamente a `definicao`, `descricao`, `ingredientes` e `restricoes`.
* **UI/UX:** Os ingredientes e restrições aparecem como "Chips" cinzas. O administrador DEVE clicar em "Confere (V)" para aprovar ou "X" para remover. O botão "Salvar" fica bloqueado até todas as tags serem revisadas.
* **Critério do Hackathon:** Pontua em **Simplicidade (1,5)** e **Velocidade (1,5)**.

### Funcionalidade 2: Busca e Filtro Semântico (App Cliente)

* **Como funciona:** O cliente não precisa navegar por categorias se não quiser. Na barra de busca (Ex: *"Quero algo leve sem lactose"*), a IA cruza a frase com as `restricoes` e `definicao` dos produtos, retornando apenas os pratos seguros.

### Funcionalidade 3: Upsell Contextual (Carrinho)

* **Como funciona:** Ao adicionar itens no carrinho, o front-end envia os itens atuais e a `etiqueta` do usuário para o back-end. A IA analisa (Ex: *Tem hambúrguer, o usuário gosta de refri zero*).
* **Retorno:** Sugere proativamente um item (Ex: Coca-Cola Zero).
* **Critério do Hackathon:** Pontua pesado em **Receita (3)**.

### Funcionalidade 4: Resumo Pós-Venda (Memória do Vendedor)

* **Como funciona:** Após o pagamento, uma rotina *background* pega o pedido final e a `etiqueta` antiga. A IA reescreve a etiqueta do usuário para refinar o perfil (Ex: *Adiciona "começou a pedir sobremesas"*).

---

## 📱 Rotas e Fluxo do Usuário (React Native - Front-end)

### Rota 1: Home / Menu Principal

* **Header:** Barra de pesquisa inteligente ("O que você quer comer hoje?").
* **Sessão Dinâmica:** "🌟 Feito para Você" (Aparece se o usuário tiver `etiqueta`, mostrando 3 produtos sugeridos pelo Gemini).
* **Categorias:** Scroll horizontal (Comidas, Bebidas, Sobremesas).
* **Listagem:** Cards com imagem (Uploadthing) à esquerda, Nome (Bold), Preço (Verde) e ícones de alerta (alergias) baseados no perfil do cliente.

### Rota 2: Modal de Produto

* Exibe a `descricao` (texto comercial).
* Botão grande para "Adicionar ao Carrinho".

### Rota 3: Carrinho (Drawer ou Modal)

* Lista de itens adicionados.
* **Banner de Upsell:** Renderiza dinamicamente a sugestão da IA ("Falta só uma bebida! Que tal um Suco de Laranja?").
* Botão "Finalizar Pedido".

### Rota 4: Dashboard Administrativo (Web/Tablet)

* Lista de produtos ativos.
* Tela de "Novo Produto" focada no autocompletar inteligente com os "chips" de validação para segurança alimentar.

---

## 🌐 Endpoints da API (Express.js - Back-end)

Todas as requisições do App passam por aqui via Axios (`api.js`).

### `GET /produtos`

* **Descrição:** Retorna o cardápio completo.
* **Query Params:** `?categoria=` (ex: `PRATO_PRINCIPAL`, `BEBIDAS`).
* **Retorno:** Array com todos os produtos (ou filtrados por categoria).
* **Erros:** `404` se categoria não existir.

### `GET /ia/sugestoes-personalizadas`

* **Descrição:** Retorna 3 produtos sugeridos para o usuário (sessão "🌟 Feito para Você").
* **Query Params:** `?usuarioId=` (ex: `?usuarioId=1`).
* **Lógica:**
  - Se o usuário tiver `etiqueta` preenchida: Gemini analisa a etiqueta e retorna 3 produtos que combinam com o perfil.
  - Se não tiver `etiqueta`: Fallback retorna 3 produtos baseados em **horário do dia** (Ex: café da manhã → pão, suco; almoço → pratos principais; noite → lanches).
* **Retorno:** Array com 3 produtos sugeridos.
* **Erros:** `404` se usuário não existir; `500` se falha (retorna fallback).

### `GET /ia/buscar`

* **Descrição:** Busca semântica inteligente de produtos.
* **Query Params:** `?q=` (ex: `?q=quero algo leve sem lactose`).
* **Lógica:**
  - Gemini analisa a frase conversacional e retorna produtos que correspondem intenção + restrições.
  - Fallback busca por palavras-chave simples nos campos `nome`, `definicao` e `ingredientes`.
* **Retorno:** Array com produtos que combinam.
* **Erros:** `400` se `q` estiver vazio; `500` se falha (retorna fallback).

### `POST /ia/upsell`

* **Payload:** `{ "usuarioId": "1", "carrinhoIds": ["uuid-produto-1", "uuid-produto-2"] }`
* **Ação:** Busca a `etiqueta` do usuário no Upstash. Envia o array de IDs dos produtos no carrinho junto com a etiqueta para o Gemini 3.0 (com `responseSchema`).
* **Lógica:**
  - Gemini analisa os produtos no carrinho + etiqueta e sugere um complemento relevante.
  - Fallback retorna um produto aleatório de uma categoria que não está no carrinho (ex: se só tem prato principal, sugere bebida ou sobremesa).
* **Retorno:** JSON com o objeto do produto sugerido (ID, nome, descrição, preço, imagem). Pode retornar `null` se falhar.
* **Erros:** `404` se usuário não existir ou se algum `carrinhoId` for inválido; `500` se falha (retorna fallback ou null).

### `POST /ia/gerar-produto` (Admin)

* **Payload:** `{ "nome": "Macarrão à Bolonhesa", "definicao": "(opcional)" }`
* **Ação:** Chama o Gemini pedindo a estruturação técnica do prato. Se apenas o nome for enviado, a IA gera a definição. Se a definição também for fornecida, usa ambas para maior precisão.
* **Retorno:** JSON com definição, ingredientes (array) e restrições (array). **Retorna `null` caso a IA não consiga identificar ou estruturar o produto corretamente.**
* **Erros:** `400` se nome estiver vazio; `500` se falha (retorna null).

### `POST /pedidos/checkout`

* **Payload:** `{ "usuarioId": "1", "produtos": [{"id": "uuid", "nome": "X-Vulcano", "preco": 35.90, "quantidade": 1}], "horario": "2026-03-10T19:30:00Z", "preco_total": 35.90 }`
* **Ação:** Salva o pedido no banco. Dispara função assíncrona (não bloqueante) que envia o pedido para o Gemini atualizar a `etiqueta` do usuário, salvando a nova string no Upstash.
* **Lógica Assíncrona:** Gemini reescreve a etiqueta com novos insights sobre preferências do usuário (ex: "começou a pedir sobremesas", "prefere bebidas sem açúcar").
* **Retorno:** JSON com ID do pedido criado e status `200 (Sucesso)`.
* **Erros:** `400` se algum campo obrigatório faltar; `404` se usuário não existir; `500` se falha ao salvar.
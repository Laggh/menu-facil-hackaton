# Arquitetura do Projeto: Menu Facil Inteligente (Hackathon Colibri 2026)

## Objetivo do Projeto

Transformar o Menu Facil de um cardapio digital estatico em um vendedor digital inteligente.

Focos principais:
- Aumentar ticket medio (upsell)
- Reduzir friccao de compra
- Construir perfil comportamental do cliente (etiqueta)

## Tech Stack

- Front-end cliente: React Native (Expo)
- Front-end admin/dashboard: React (Vite)
- Back-end: Express.js (Node.js + TypeScript)
- Dados: Upstash Redis
- Upload de imagens: UploadThing
- IA: Gemini, com retornos estruturados em pontos especificos

## Arquitetura em Camadas

- mobile: app do cliente, consumo de API em mobile/lib/api.ts
- web: dashboard admin, consumo de API em web/src/lib/api.ts
- server: API principal em server/src/index.ts e rotas em server/src/user
- shared: tipos compartilhados entre front e back

## Estado Atual de Autenticacao

O projeto usa autenticacao simples para hackathon:
- Login por email em /api/user/login
- Resposta de login retorna token igual ao user.id
- Rotas protegidas exigem header x-user-id
- Nao ha sessao/cookie JWT completo no estado atual

## Comportamento de IA e Fallback

Fluxos com IA possuem fallback para manter o app funcional:
- Busca de produtos: IA + fallback textual
- Recomendacoes: IA + fallback de heuristica
- Sugestao por carrinho: IA + fallback

No fluxo de pedidos:
- Ao mudar status de PENDENTE para COMPLETO, a API tenta atualizar etiqueta do usuario
- Se falhar, pode criar task de processamento assincrono

## Filas e Tasks

Existe fila de tasks para resiliencia:
- Tipo atual: GENERATE_USER_TAG
- Worker em background processa task_queue
- Endpoints de observabilidade em /api/tasks

## Observacoes Importantes

- Contratos oficiais de endpoints estao em ROTAS.md
- O endpoint /api/ia atualmente expõe apiKey no payload de healthcheck; isso deve ser removido antes de producao
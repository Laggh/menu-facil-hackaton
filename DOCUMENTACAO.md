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
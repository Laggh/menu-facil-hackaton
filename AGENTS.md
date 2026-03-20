# Contexto Rápido para IAs (AGENTS.md)

Este é o ambiente de desenvolvimento de um app para uma **Hackathon**. 

Diretrizes essenciais:
1. **Visão Geral:** Leia o arquivo `README.md` para entender as regras de negócio e a arquitetura básica (Hackathon Colibri).
2. **Serviços Ativos:** Não é necessário subir os servidores, eles já estão rodando em background nestas portas:
   - **API / Back-end:** `http://localhost:3000`
   - **Dashboard Web:** `http://localhost:5173`
   - **App Mobile (Expo):** `http://localhost:8081`
3. **Rotas da API:** **NUNCA** adivinhe URLs. Todas as rotas do backend (com seus inputs e outputs) estão rigorosamente documentadas no arquivo `ROTAS.md`.
4. **Arquivos de teste:** **SEMPRE** lembre de apagar scripts de teste após usar-los
5. **Evite criar arquivos de documentação ou implementação sem necessidade.** Não crie arquivos como `SISTEMA_ETIQUETAS.md` ou `IMPLEMENTACAO_FAVORITOS.md` priorise comentarios no código e atualizações na documentação principal (`DOCUMENTACAO.md`).
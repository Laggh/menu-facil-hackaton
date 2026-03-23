import { GoogleGenAI } from "@google/genai";

import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Restricao, RestricaoArray, Produto, Usuario, PedidoProduto } from "@shared/types";
import db from "./dbHelpers.js";
import { registerFlashQuotaError } from "./aiQuotaState.js";

const genAi = new GoogleGenAI({});

//"gemini-3-flash-preview"
//"gemini-2.5-flash-lite"
const stripMarkdownFences = (text: string): string => {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
};

export const generate = async (prompt: string, schema?: any, model = "gemini-3-flash-preview"): Promise<string | undefined> => {
    const startTime = Date.now();
    
    try {
        const response = await genAi.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: schema ? "application/json" : undefined,
                responseSchema: schema
            }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        const responseText = response.text;
        
        console.log(`[${model}] ${duration}ms`);
        
        // Faz log da requisição com sucesso
        await db.log.gemini({
            prompt: prompt,
            timeMs: duration,
            response: responseText ?? "<no response>",
            model: model,
            timestamp: new Date().toISOString(),
            status: 'success'
        });
        
        return responseText;
    } catch (error: any) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Extrair informações de erro
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code || 
                         (errorMessage.includes('429') ? '429_QUOTA_EXCEEDED' : 
                          errorMessage.includes('403') ? '403_FORBIDDEN' :
                          errorMessage.includes('500') ? '500_INTERNAL_ERROR' :
                          'UNKNOWN_ERROR');
        
        console.error(`[${model}] ERROR (${errorCode}) after ${duration}ms: ${errorMessage}`);

        if (registerFlashQuotaError(model, error)) {
            console.warn(`[AI_QUOTA] Quota de modelo flash detectada em ${model}. Funcoes de IA podem ficar indisponiveis.`);
        }
        
        // Faz log da requisição com erro
        await db.log.gemini({
            prompt: prompt,
            timeMs: duration,
            response: undefined,
            model: model,
            timestamp: new Date().toISOString(),
            status: 'error',
            errorCode: errorCode,
            errorMessage: errorMessage
        });
        
        throw error; // Re-lança o erro para que as funções chamadoras tratem
    }
};

export const quickGenerate = async (prompt: string, schema?: any): Promise<string | undefined> => {
    return await generate(prompt, schema, "gemini-2.5-flash-lite");
}

/**
 * Tenta gerar usando o modelo principal, se falhar tenta o modelo lite como fallback
 * Útil para operações que não podem criar tasks (product descriptions, searches)
 * 
 * Logs:
 * - modelo normal sucesso: model="gemini-3-flash-preview", usedFallback não setado
 * - modelo lite direto: model="gemini-2.5-flash-lite", usedFallback não setado
 * - fallback acionado: model="gemini-2.5-flash-lite", usedFallback=true
 * 
 * IMPORTANTE: NÃO relança erros de quota - tenta fallback em TODOS os erros
 * A detecção de quota para criar tasks fica apenas em generateUserTag()
 */
export const generateWithFallback = async (prompt: string, schema?: any): Promise<string | undefined> => {
    console.log(`[FALLBACK] Iniciando generateWithFallback com modelo 3-flash-preview`);
    
    try {
        console.log(`[FALLBACK] Tentando gerar com gemini-3-flash-preview...`);
        const result = await generate(prompt, schema, "gemini-3-flash-preview");
        console.log(`[FALLBACK] ✅ Sucesso com gemini-3-flash-preview!`);
        return result;
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error(`[FALLBACK] ❌ Erro no gemini-3-flash-preview:`, errorMessage);
        
        // NÃO relança erros de quota aqui - tenta fallback em TODOS os erros
        // A detecção de quota fica apenas em generateUserTag() que cria tasks
        
        console.warn(`[FALLBACK] Modelo principal falhou, tentando fallback com lite: ${errorMessage}`);
        
        const startTime = Date.now();
        
        try {
            console.log(`[FALLBACK] Tentando fallback com gemini-2.5-flash-lite...`);
            const response = await genAi.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: schema ? "application/json" : undefined,
                    responseSchema: schema
                }
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            const responseText = response.text;
            
            console.log(`[gemini-2.5-flash-lite - FALLBACK] ✅ ${duration}ms`);
            
            // Faz log com usedFallback=true para marcar que foi acionado fallback
            await db.log.gemini({
                prompt: prompt,
                timeMs: duration,
                response: responseText ?? "<no response>",
                model: "gemini-2.5-flash-lite",
                timestamp: new Date().toISOString(),
                status: 'success',
                usedFallback: true
            });
            
            return responseText;
        } catch (fallbackError: any) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const fallbackErrorMessage = fallbackError?.message || String(fallbackError);
            const fallbackErrorCode = fallbackError?.code || 
                (fallbackErrorMessage.includes('429') ? '429_QUOTA_EXCEEDED' : 
                 fallbackErrorMessage.includes('403') ? '403_FORBIDDEN' :
                 fallbackErrorMessage.includes('500') ? '500_INTERNAL_ERROR' :
                 'UNKNOWN_ERROR');
            
            console.error(`[FALLBACK] ❌ Ambos modelos falharam (${fallbackErrorCode}): ${fallbackErrorMessage}`);

            if (registerFlashQuotaError("gemini-2.5-flash-lite", fallbackError)) {
                console.warn("[AI_QUOTA] Quota de modelo flash detectada no fallback lite.");
            }
            
            // Faz log do erro do fallback também
            await db.log.gemini({
                prompt: prompt,
                timeMs: duration,
                response: undefined,
                model: "gemini-2.5-flash-lite",
                timestamp: new Date().toISOString(),
                status: 'error',
                errorCode: fallbackErrorCode,
                errorMessage: fallbackErrorMessage,
                usedFallback: true
            });
            
            throw fallbackError;
        }
    }
};


export const generateProductDescription = async (name: string, definicao: string | undefined): Promise<{definicao: string|null, descricao: string, restricoes: Restricao[], ingredientes: string[]} | undefined> => {
    console.log(`[PRODUCT_DESC] Iniciando geração para produto: "${name}"`);
    
    const restricaoString = RestricaoArray.join(", ");

    const prompt = `Gere uma descrição, uma definição (uma breve descrição doque é o produto), as restrições alimentares que IMPEDEM alguém de consumir esse produto, e sua lista de ingredientes para um produto de restaurante com as seguintes informações:\n\nNome: ${name}\nDefinição: ${definicao || "Não fornecida"}\n\nLista de restrições disponíveis: ${restricaoString}\n\nIMPORTANTE: O campo "restricoes" deve conter APENAS as restrições de pessoas que NÃO podem consumir o produto. Exemplo: se o produto tem glúten, inclua "SEM_GLUTEN". Se tem carne, inclua "VEGETARIANO" e "VEGANO". Se tem queijo, inclua "SEM_LACTOSE" e "APLV".\n\nA descrição deve ser atraente e destacar os principais ingredientes e características do prato. Caso você não tenha informações suficientes para gerar, você deve responder com o {"ok": false} e não gerar as informações.`;

    const schema = {
        type: "object",
        properties: {
            ok: { type: "boolean" },
            definicao: { type: "string" },
            descricao: { type: "string" },
            restricoes: { 
                type: "array",
                items: { type: "string", enum: RestricaoArray }
            },
            ingredientes: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: ["ok", "descricao", "restricoes", "ingredientes"]
    };

    try {
        console.log(`[PRODUCT_DESC] Chamando generateWithFallback...`);
        const response = await generateWithFallback(prompt, schema);
        
        if (!response) {
            console.warn(`[PRODUCT_DESC] Resposta vazia do generateWithFallback`);
            return undefined;
        }
        
        console.log(`[PRODUCT_DESC] Parseando resposta...`);
        const parsed = JSON.parse(stripMarkdownFences(response));

        if (!parsed.ok) {
            console.warn(`[PRODUCT_DESC] parsed.ok === false, insuficiente para gerar`);
            return undefined;
        }

        console.log(`[PRODUCT_DESC] ✅ Descrição gerada com sucesso`);
        return {
            definicao: parsed.definicao || null,
            descricao: parsed.descricao,
            restricoes: parsed.restricoes,
            ingredientes: parsed.ingredientes
        };
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error(`[PRODUCT_DESC] ❌ Erro ao gerar descrição:`, {
            errorMessage,
            errorCode: error?.code,
            stack: error?.stack?.split('\n').slice(0, 3)
        });
        throw error; // Relança o erro para que a rota trate
    }
}


export const searchProductsWithAI = async (query: string, usuario: Usuario, produtos: Produto[]): Promise<{ data: Produto[] | undefined, error?: string }> => {
    const restricaoString = RestricaoArray.join(", ");
    
    // Obter informações de data/hora
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = agora.getHours();
    const minuto = agora.getMinutes().toString().padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto}`;
    
    // Determinar período do dia
    let periodo = '';
    if (hora >= 5 && hora < 12) periodo = 'CAFE_DA_MANHA';
    else if (hora >= 12 && hora < 17) periodo = 'ALMOCO';
    else if (hora >= 17 && hora < 21) periodo = 'LANCHE/CAFE_TARDE';
    else if (hora >= 21 && hora < 24) periodo = 'JANTAR';
    else periodo = 'MADRUGADA';
    
    // Formatar lista de produtos para o prompt COM IDs explícitos
    const produtosFormatados = produtos.map(p => 
        `- [${p.id}] ${p.nome}: ${p.descricao} (Restrições: ${p.restricoes.length > 0 ? p.restricoes.join(", ") : "Nenhuma"})`
    ).join("\n");

    const prompt = `Você é um sistema especializado em recomendação de produtos de restaurante.

INFORMAÇÕES TEMPORAIS ATUAIS:
- Data: ${dataFormatada}
- Horário: ${horaFormatada}
- Período do dia: ${periodo}

PERFIL DO USUÁRIO:
- Nome: ${usuario.nome}
- Idade: ${usuario.idade}
${usuario.etiqueta ? `- Preferências/Comportamento: ${usuario.etiqueta}` : ""}

LISTA DE PRODUTOS DISPONÍVEIS:
${produtosFormatados}

LISTAS DE RESTRIÇÕES ALIMENTARES DISPONÍVEIS: ${restricaoString}

TAREFA: O usuário fez a seguinte busca: "${query}"

Baseado na busca do usuário, retorne APENAS os IDs dos produtos que melhor correspondem ao que o usuário está procurando. Use os IDs exatos como mostrados entre colchetes (ex: 1435231, não posições).

IMPORTANTE:
1. Considere o perfil e preferências do usuário indicadas pela etiqueta
2. CONSIDERE O HORÁRIO ATUAL para fazer recomendações apropriadas (ex: café da manhã deve retornar café e pães; almoço deve retornar pratos principais; madrugada deve evitar algo muito pesado)
3. Retorne os produtos ordenados por relevância (sempre coloque as coisas mais relevantes primeiro)
4. Se nenhum produto corresponder à busca, retorne uma lista vazia
5. A resposta deve ser APENAS um array JSON de números (IDs dos produtos)
6. Sua prioridade é PRIMEIRAMENTE a busca textual, mas use o perfil, horário e preferências do usuário para desempatar ou dar mais relevância a certos produtos.

Exemplo de resposta: [1435231, 1435232]`;

    const schema = {
        type: "object",
        properties: {
            ids: {
                type: "array",
                items: { type: "number" }
            }
        },
        required: ["ids"]
    };

    try {
        const response = await quickGenerate(prompt, schema);
        const parsed = JSON.parse(stripMarkdownFences(response!));
        
        // Filtrar e mapear os IDs para produtos reais
        const produtosEncontrados = parsed.ids
            .map((id: number) => produtos.find(p => p.id === id))
            .filter((p: Produto | undefined) => p !== undefined) as Produto[];
        
        return { data: produtosEncontrados };
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error("Erro ao buscar produtos com IA:", errorMessage);
        return { data: undefined, error: errorMessage };
    }
}


export const searchProductsSimple = (query: string, produtos: Produto[]): Produto[] => {
    const queryLower = query.toLowerCase();
    return produtos.filter(p => 
        p.nome.toLowerCase().includes(queryLower) ||
        p.definicao.toLowerCase().includes(queryLower) ||
        p.descricao.toLowerCase().includes(queryLower)
    ).sort((a, b) => {
        const aName = a.nome.toLowerCase();
        const bName = b.nome.toLowerCase();
        if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
        if (!aName.includes(queryLower) && bName.includes(queryLower)) return 1;
        return 0;
    });
}


export const suggestProductsFromCart = async (carrinho: PedidoProduto[], usuario: Usuario, allProducts: Produto[]): Promise<{ data: Produto[] | undefined, error?: string }> => {
    if (!carrinho || carrinho.length === 0) {
        return { data: undefined }; // Sem carrinho, sem sugestões personalizadas
    }

    // Obter informações de data/hora
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = agora.getHours();
    const minuto = agora.getMinutes().toString().padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto}`;
    
    // Determinar período do dia
    let periodo = '';
    if (hora >= 5 && hora < 12) periodo = 'CAFE_DA_MANHA';
    else if (hora >= 12 && hora < 17) periodo = 'ALMOCO';
    else if (hora >= 17 && hora < 21) periodo = 'LANCHE/CAFE_TARDE';
    else if (hora >= 21 && hora < 24) periodo = 'JANTAR';
    else periodo = 'MADRUGADA';

    // Análise do carrinho
    const categoriasNoCarrinho = new Set(carrinho.map(p => p.produto.categoria));
    const produtosNoCarrinho = new Set(carrinho.map(p => p.produto.id));

    // Achar categorias faltantes
    const todasAsCategorias = ['PRATO_PRINCIPAL', 'ACOMPANHAMENTOS', 'BEBIDAS', 'SOBREMESA', 'OUTROS'];
    const categoriasFaltantes = todasAsCategorias.filter(c => !categoriasNoCarrinho.has(c as any));

    // Produtos disponíveis que não estão no carrinho
    const produtosDisponiveis = allProducts.filter(p => !produtosNoCarrinho.has(p.id));

    const carrinhoInfo = carrinho.map(p => `${p.quantidade}x ${p.produto.nome} (${p.produto.categoria})`).join(', ');
    const categoriasFaltantesInfo = categoriasFaltantes.join(', ') || 'Nenhuma';

    const prompt = `Você é um assistente de recomendação de produtos para um restaurante.

INFORMAÇÕES TEMPORAIS ATUAIS:
- Data: ${dataFormatada}
- Horário: ${horaFormatada}
- Período do dia: ${periodo}

PERFIL DO USUÁRIO:
- Nome: ${usuario.nome}
- Idade: ${usuario.idade}
${usuario.etiqueta ? `- Preferências: ${usuario.etiqueta}` : ''}

CARRINHO ATUAL DO CLIENTE:
${carrinhoInfo}

CATEGORIAS FALTANTES NO CARRINHO:
${categoriasFaltantesInfo}

PRODUTOS DISPONÍVEIS PARA SUGERIR:
${produtosDisponiveis.map(p => `- [${p.id}] ${p.nome} (${p.categoria}): ${p.descricao}`).join('\n')}

Baseado no PERFIL, PREFERÊNCIAS e HORÁRIO ATUAL do usuário, recomende até 3 produtos complementares que:
1. Preencham categorias faltantes (bebidas, acompanhamentos, sobremesas, etc)
2. Façam sentido com o perfil/preferências do usuário
3. Sejam apropriados para o período do dia (ex: sobremesa leve no jantar, bebida refrescante no almoço)
4. Sejam complementos naturais ao pedido atual

Retorne APENAS os IDs dos 3 produtos mais relevantes para complementar o carrinho do usuário.`;

    const schema = {
        type: "object",
        properties: {
            ids: {
                type: "array",
                items: { type: "number" },
                maxItems: 3
            }
        },
        required: ["ids"]
    };

    try {
        const response = await quickGenerate(prompt, schema);
        const parsed = JSON.parse(stripMarkdownFences(response!));
        
        // Filtrar e mapear os IDs para produtos reais
        const sugestoes = parsed.ids
            .map((id: number) => allProducts.find(p => p.id === id))
            .filter((p: Produto | undefined) => p !== undefined) as Produto[];
        
        return { data: sugestoes.length > 0 ? sugestoes : undefined };
    } catch (error: any) {
        // Fallback: sugerir 3 produtos de categorias faltantes
        const errorMessage = error?.message || String(error);
        console.error("Erro ao sugerir produtos com IA, usando fallback:", errorMessage);
        
        let sugestoesFallback: Produto[] = [];
        for (const categoria of categoriasFaltantes) {
            const produtoDaCategoria = produtosDisponiveis.find(p => p.categoria === categoria);
            if (produtoDaCategoria) {
                sugestoesFallback.push(produtoDaCategoria);
            }
            if (sugestoesFallback.length >= 3) break;
        }
        
        return { data: sugestoesFallback.length > 0 ? sugestoesFallback : undefined, error: errorMessage };
    }
}


export const getAIRecommendations = async (usuario: Usuario, allProducts: Produto[]): Promise<{ data: Produto[], error?: string }> => {
    // Obter informações de data/hora
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = agora.getHours();
    const minuto = agora.getMinutes().toString().padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto}`;
    
    // Determinar período do dia
    let periodo = '';
    if (hora >= 5 && hora < 12) periodo = 'CAFE_DA_MANHA';
    else if (hora >= 12 && hora < 17) periodo = 'ALMOCO';
    else if (hora >= 17 && hora < 21) periodo = 'LANCHE/CAFE_TARDE';
    else if (hora >= 21 && hora < 24) periodo = 'JANTAR';
    else periodo = 'MADRUGADA';

    const prompt = `Você é um assistente de recomendação de produtos para um restaurante.

INFORMAÇÕES TEMPORAIS ATUAIS:
- Data: ${dataFormatada}
- Horário: ${horaFormatada}
- Período do dia: ${periodo}

PERFIL DO USUÁRIO:
- Nome: ${usuario.nome}
- Idade: ${usuario.idade}
${usuario.etiqueta ? `- Preferências: ${usuario.etiqueta}` : ''}

TODOS OS PRODUTOS DISPONÍVEIS:
${allProducts.map(p => `- [${p.id}] ${p.nome} (${p.categoria}): ${p.descricao}`).join('\n')}

Baseado no PERFIL DO USUÁRIO e no PERÍODO DO DIA ATUAL (${periodo}), recomende até 5 produtos que:
1. Sejam apropriados para o horário/período atual
2. Façam sentido com as preferências/etiquetas do usuário
3. Sejam populares e bem avaliados
4. Proporcionem uma experiência completa (considere variar categorias)

Retorne APENAS os IDs dos 5 produtos mais relevantes para este usuário NESTE horário.`;

    const schema = {
        type: "object",
        properties: {
            ids: {
                type: "array",
                items: { type: "number" },
                maxItems: 5
            }
        },
        required: ["ids"]
    };

    try {
        const response = await generateWithFallback(prompt, schema);
        const parsed = JSON.parse(stripMarkdownFences(response!));
        
        // Filtrar e mapear os IDs para produtos reais
        const recomendacoes = parsed.ids
            .map((id: number) => allProducts.find(p => p.id === id))
            .filter((p: Produto | undefined) => p !== undefined) as Produto[];
        
        return { data: recomendacoes };
    } catch (error: any) {
        // Fallback: retornar 5 produtos aleatórios
        const errorMessage = error?.message || String(error);
        console.error("Erro ao obter recomendações com IA, usando fallback:", errorMessage);
        
        // Embaralhar e pegar 5 produtos aleatórios
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        const recomendacoesFallback = shuffled.slice(0, 5);
        
        return { data: recomendacoesFallback, error: errorMessage };
    }
}


export const generateUserTag = async (usuario: Usuario, completedOrder: any, recentOrders: any[] = []): Promise<{ data: string | undefined, error?: string, taskCreated?: string }> => {
    // Formatar informações do pedido atual
    const produtosInfo = completedOrder.produtos.map((item: PedidoProduto) => 
        `${item.quantidade}x ${item.produto.nome}${item.observacao ? ` (obs: ${item.observacao})` : ''}`
    ).join(', ');

    // Formatar histórico dos últimos 5 pedidos
    const historicoInfo = recentOrders.length > 0 
        ? recentOrders.map((order, idx) => {
            const produtos = order.produtos.map((item: PedidoProduto) => `${item.quantidade}x ${item.produto.nome}`).join(', ');
            return `Pedido ${idx + 1}: ${produtos} (R$ ${order.preco_total.toFixed(2).replace('.', ',')})`;
          }).join('\n')
        : 'Nenhum pedido anterior';

    const prompt = `Você é um assistente especializado em entender comportamento de clientes em restaurantes.

INFORMAÇÕES DO CLIENTE:
- Nome: ${usuario.nome}
- Idade: ${usuario.idade}
${usuario.etiqueta ? `
ETIQUETA ANTERIOR (análise comportamental anterior):
"${usuario.etiqueta}"` : ''}

HISTÓRICO DOS ÚLTIMOS 5 PEDIDOS:
${historicoInfo}

PEDIDO COMPLETADO AGORA:
- Produtos: ${produtosInfo}
- Preço Total: R$ ${completedOrder.preco_total.toFixed(2).replace('.', ',')}
- Horário: ${completedOrder.horario}

TAREFA:
${usuario.etiqueta ? 
`Leia a etiqueta anterior e ATUALIZE-A com as novas informações deste pedido. A etiqueta deve:
- Ser uma string descritiva com padrões comportamentais observados
- Incluir preferências, gostos, hábitos de consumo (ex: "costuma pedir pizza de calabresa", "prefere suco ao invés de refrigerante")
- IMPORTANTE: Identificar e INCLUIR 1-3 PRODUTOS FAVORITOS que mais aparecem no histórico (ex: "Favoritos: Pizza Calabresa, Suco Natural")
- Se não houver mudanças significativas, retorne a etiqueta anterior inalterada
- Se houver novos padrões, atualize descrevendo os comportamentos
- Máximo 200 caracteres, ser concisa mas informativa
Exemplo: "Prefere frango, gosta de refrigerante, pede frequentemente no horário de almoço. Favoritos: Frango à Milanesa"` :
`Crie uma NOVA etiqueta baseada neste primeiro pedido e no histórico. A etiqueta deve:
- Ser uma string descritiva com padrões comportamentais observados
- Descrever preferências, gostos e hábitos (ex: "costuma pedir pizza", "prefere suco")
- IMPORTANTE: Incluir PRODUTOS FAVORITOS identificados no histórico (ex: "Favoritos: Pizza Calabresa, Suco Natural")
- Máximo 200 caracteres, ser concisa mas informativa
Exemplo: "Prefere pizza e massas, gosta de sucos naturais. Favoritos: Pizza Calabresa, Suco de Laranja"`}

IMPORTANTE: Retorne APENAS a string da etiqueta, sem explicações adicionais. O resultado será salvo diretamente no banco de dados.`;

    try {
        const response = await quickGenerate(prompt);
        if (!response) {
            return { data: undefined, error: 'Nenhuma resposta da IA' };
        }
        
        // Limpar a resposta (remover aspas extras se houver)
        const cleanedTag = stripMarkdownFences(response)
            .replace(/^["']|["']$/g, '') // Remove aspas do início/fim
            .trim();
        
        return { data: cleanedTag };
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error("Erro ao gerar etiqueta do usuário:", errorMessage);
        
        // Verificar se é erro de quota (429)
        const isQuotaError = errorMessage.includes('429') || 
                            errorMessage.includes('RESOURCE_EXHAUSTED') ||
                            errorMessage.includes('quota');
        
        if (isQuotaError) {
            try {
                console.log(`[QUOTA LIMIT] Criando task de retry para gerar etiqueta do usuário ${usuario.id}`);
                
                // Criar task para tentar novamente depois
                const task = await db.task.create('GENERATE_USER_TAG', {
                    usuarioId: usuario.id,
                    orderId: completedOrder.id,
                    prompt: prompt,  // Salvar o prompt original para manter o estado
                });
                
                console.log(`[QUOTA LIMIT] Task criada com sucesso: ${task.id}`);
                
                return { 
                    data: undefined, 
                    error: errorMessage,
                    taskCreated: task.id
                };
            } catch (taskError: any) {
                console.error("Erro ao criar task de retry:", taskError?.message);
                return { data: undefined, error: errorMessage };
            }
        }
        
        return { data: undefined, error: errorMessage };
    }
}


export default {
    generate,
    generateProductDescription,
    searchProductsWithAI,
    searchProductsSimple,
    suggestProductsFromCart,
    getAIRecommendations,
    generateUserTag
}

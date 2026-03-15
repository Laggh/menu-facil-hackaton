import { GoogleGenAI } from "@google/genai";

import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Restricao, RestricaoArray, Produto, Usuario } from "@shared/types";
import db from "./dbHelpers";

const genAi = new GoogleGenAI({});

//"gemini-3-flash-preview"
//"gemini-2.5-flash-lite"
const stripMarkdownFences = (text: string): string => {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
};

export const generate = async (prompt: string, schema?: any, model = "gemini-3-flash-preview"): Promise<string | undefined> => {
    const startTime = Date.now();
    
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
    
    // Faz log da requisição
    await db.log.gemini({
        prompt: prompt,
        timeMs: duration,
        response: responseText ?? "<no response>",
        model: model
    });
    
    return responseText;
};

export const quickGenerate = async (prompt: string, schema?: any): Promise<string | undefined> => {
    return await generate(prompt, schema, "gemini-2.5-flash-lite");
}


export const generateProductDescription = async (name: string, definicao: string | undefined): Promise<{definicao: string|null, descricao: string, restricoes: Restricao[], ingredientes: string[]} | undefined> => {
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

    const response = await generate(prompt, schema);
    const parsed = JSON.parse(stripMarkdownFences(response!));

    if (!parsed.ok) {
        return undefined;
    }

    return {
        definicao: parsed.definicao || null,
        descricao: parsed.descricao,
        restricoes: parsed.restricoes,
        ingredientes: parsed.ingredientes
    };
}


export const searchProductsWithAI = async (query: string, usuario: Usuario, produtos: Produto[]): Promise<Produto[] | undefined> => {
    const restricaoString = RestricaoArray.join(", ");
    
    // Formatar lista de produtos para o prompt
    const produtosFormatados = produtos.map(p => 
        `- ${p.nome}: ${p.descricao} (Restrições: ${p.restricoes.length > 0 ? p.restricoes.join(", ") : "Nenhuma"})`
    ).join("\n");

    const prompt = `Você é um sistema especializado em recomendação de produtos de restaurante. 

PERFIL DO USUÁRIO:
- Nome: ${usuario.nome}
- Idade: ${usuario.idade}
${usuario.etiqueta ? `- Preferências/Comportamento: ${usuario.etiqueta}` : ""}

LISTA DE PRODUTOS DISPONÍVEIS:
${produtosFormatados}

LISTAS DE RESTRIÇÕES ALIMENTARES DISPONÍVEIS: ${restricaoString}

TAREFA: O usuário fez a seguinte busca: "${query}"

Baseado na busca do usuário, retorne APENAS os IDs dos produtos que melhor correspondem ao que o usuário está procurando. 

IMPORTANTE:
1. Considere o perfil e preferências do usuário indicadas pela etiqueta
2. Filtre OBRIGATORIAMENTE produtos que violem restrições alimentares comuns ou que o usuário possa não querer
3. Retorne os produtos ordenados por relevância (mais relevante primeiro)
4. Se nenhum produto corresponder à busca, retorne uma lista vazia, mas NUNCA retorne produtos irrelevantes ou que violem restrições apenas para preencher a resposta
5. A resposta deve ser APENAS um array JSON de números (IDs dos produtos)

Exemplo de resposta: [5, 12, 3]`;

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
        
        return produtosEncontrados;
    } catch (error) {
        console.error("Erro ao buscar produtos com IA:", error);
        return undefined;
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


export default {
    generate,
    generateProductDescription,
    searchProductsWithAI,
    searchProductsSimple
}

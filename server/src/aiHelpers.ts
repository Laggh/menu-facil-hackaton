import { GoogleGenAI } from "@google/genai";

import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Restricao, RestricaoArray } from "@shared/types";

const genAi = new GoogleGenAI({});

//"gemini-3-flash-preview"
//"gemini-2.5-flash-lite"
const stripMarkdownFences = (text: string): string => {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
};

export const generate = async (prompt: string, schema?: any): Promise<string | undefined> => {
    const response = await genAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: schema ? "application/json" : undefined,
            responseSchema: schema
        }
    });
    return response.text;
};


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


export default {
    generate,
    generateProductDescription
}

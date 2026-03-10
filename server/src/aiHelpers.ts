import { GoogleGenAI } from "@google/genai";

import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const genAi = new GoogleGenAI({});

async function safe<T>(promise: Promise<T>): Promise<[T, null] | [null, Error]> {
    return promise.then(data => [data, null] as [T, null]).catch(err => [null, err]);
}

export default {
    generate: async(prompt: string, schema?: any): Promise<[string | undefined, null] | [null, Error]> => {
        const [response, error] = await safe(genAi.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseSchema: schema
            }
        }));

        if (error) {
            console.error("Error generating content:", error);
            return [null, error];
        }

        return [response.text, null];
    }
}

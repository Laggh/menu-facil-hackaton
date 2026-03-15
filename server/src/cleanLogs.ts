import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

redis.del('gemini_log').then(() => {
  console.log('Chave gemini_log deletada com sucesso!')
  process.exit(0)
}).catch(e => {
  console.error('Erro ao deletar:', e.message)
  process.exit(1)
})

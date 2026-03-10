// Funcionalidade principal
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inicialização do dotenv para usar variáveis de ambiente (estão no arquivo .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Constantes
const PORT = process.env.PORT || 3000

// Inicialização do servidor
const app = express()

// Configuração do servidor
app.use(bodyParser.json()) // Faz o parse do body das requisições para JSON
app.use(cors()) // Permite requisições de outros domínios (CORS)

// Printa no console o IP, método e URL de cada requisição
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection?.remoteAddress
  const method = req.method
  const url = req.url

  console.log(`${ip} ${method}: ${url}`)

  next()
})

// ========== ROTAS ==========
// IMPORT DAS ROTAS
import aiRoutes from './user/aiRoutes'

// USO DAS ROTAS
app.use('/api/ia/', aiRoutes()) // Rota para funcionalidades de IA


// Rota de ping
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'Pong!' })
})

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à API Menu Fácil!' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🍔 Servidor rodando na porta ${PORT}`)
})
import express from 'express'
import type { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 3000

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req: Request, res: Response) => {
  res.send('hello world 2')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
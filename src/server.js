// Servidor HTTP simples que responde a todas as rotas GET na porta 9999
import http from 'http'

import db from './db.js'
import handler from './routes/handler.js'

const processPid = process.pid
const server = http.createServer(handler)

server.listen(9999).once('listening', () => {
  db.start()
  console.log(
    `Server is running ${new Date().toISOString()} PID: ${processPid}`
  )
})

process.on('SIGTERM', () => {
  console.log('Gracefully shutting down')

  server.close(() => {
    console.log('Server closed', new Date().toISOString())
    process.exit(0)
  })
})

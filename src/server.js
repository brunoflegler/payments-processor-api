// Servidor HTTP simples que responde a todas as rotas GET na porta 9999
import http from 'http'

// import db from './db.js'
import postgres from './database/index.js'
import handler from './routes/handler.js'
import * as queue from './queue/index.js'

const processPid = process.pid
const server = http.createServer(handler)

server.listen(9999).once('listening', () => {
  console.log(`worker ${processPid} is running`)
  postgres.start()
  queue.consumerDefault()
  queue.consumerFallback()
  console.log(
    `Server is running ${new Date().toISOString()} PID: ${processPid}`
  )
})

process.on('SIGUSR2', () => {
  console.log('Gracefully shutting down')

  server.close(() => {
    console.log('Server closed', new Date().toISOString())

    queue.clear()
    postgres.stop()
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Gracefully shutting down')

  server.close(() => {
    console.log('Server closed', new Date().toISOString())

    postgres.stop()
    queue.clear()
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('Gracefully shutting down')

  server.close(() => {
    console.log('Server closed', new Date().toISOString())

    queue.clear()
    postgres.stop()
    process.exit(0)
  })
})

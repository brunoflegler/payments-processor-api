// Servidor HTTP simples que responde a todas as rotas GET na porta 9999
import http from 'http'
const processPid = process.pid
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

const routes = {
  'health:get': (request, response) => {
    response.writeHead(200, DEFAULT_HEADERS)
    return response.end(JSON.stringify({ mensagem: 'server is running' }))
  },
  'payments:post': async (request, response) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', async () => {
      const data = JSON.parse(body)
      const { correlationId, amount } = data

      // fazer uma requisição para API externa
      const processorDefault = process.env.PROCESSOR_DEFAULT_URL

      console.log('processorDefault', processorDefault)

      await fetch(`${processorDefault}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correlationId,
          amount,
          requestedAt: new Date().toISOString()
        })
      })

      response.writeHead(201, DEFAULT_HEADERS)
      return response.end()
    })
  },
  default: (_, response) => {
    response.writeHead(404, DEFAULT_HEADERS)
    return response.end()
  }
}

const handler = (request, response) => {
  const { url, method } = request
  const [, route] = url.split('/')
  const key = `${route}:${method.toLowerCase()}`
  const chosen = routes[key] || routes.default
  return chosen(request, response)
}

http
  .createServer(handler)
  .listen(9999)
  .once('listening', () => {
    console.log(`Server is running PID: ${processPid}`)
  })

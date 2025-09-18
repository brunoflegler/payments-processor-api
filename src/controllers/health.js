import { DEFAULT_HEADERS } from './index.js'

const healthController = (_, response) => {
  response.writeHead(200, DEFAULT_HEADERS)
  return response.end(JSON.stringify({ mensagem: 'server is running' }))
}

export default healthController

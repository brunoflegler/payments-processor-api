import { DEFAULT_HEADERS } from './index.js'

const defaultController = async (_, response) => {
  response.writeHead(400, DEFAULT_HEADERS)

  return response.end()
}

export default defaultController

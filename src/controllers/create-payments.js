import { DEFAULT_HEADERS } from './index.js'
import { queueDefault } from '../queue/index.js'

const createPaymentsController = async (request, response) => {
  let body = ''

  request.on('data', (chunk) => {
    body += chunk
  })

  request.on('end', async () => {
    const data = JSON.parse(body)
    const { correlationId, amount } = data

    try {
      await queueDefault.add('payment-processing', {
        data: {
          correlationId,
          amount
        },
        retries: 0
      })
    } catch (error) {
      console.error('Error creating payment:', error)
      response.writeHead(500, DEFAULT_HEADERS)
      return response.end()
    }

    response.writeHead(202, DEFAULT_HEADERS)
    return response.end()
  })
}

export default createPaymentsController

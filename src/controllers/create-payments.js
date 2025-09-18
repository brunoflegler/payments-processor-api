import { DEFAULT_HEADERS } from './index.js'
import db from '../db.js'

// Função para processar pagamento assincronamente
const processPaymentAsync = async (paymentData) => {
  const { correlationId, amount } = paymentData
  const processorDefaultUrl = process.env.PROCESSOR_DEFAULT_URL

  try {
    const response = await fetch(`${processorDefaultUrl}/payments`, {
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

    if (response.ok) {
      // Sucesso: atualiza status para 'processed'
      await db.updatePayments(correlationId, {
        status: 'processed',
        processedAt: new Date().toISOString()
      })
      // Erro na processadora: marca como 'failed'
      await db.updatePayments(correlationId, {
        status: 'failed',
        errorMessage: response.status,
        failedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    await db.updatePayments(correlationId, {
      status: 'error',
      errorMessage: error.message,
      failedAt: new Date().toISOString()
    })
  }
}

const createPaymentsController = async (request, response) => {
  let body = ''

  request.on('data', (chunk) => {
    body += chunk
  })

  request.on('end', async () => {
    const data = JSON.parse(body)
    const { correlationId, amount } = data

    try {
      await db.createPayment({
        correlationId,
        amount,
        status: 'pending',
        requestedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error creating payment:', error)
      response.writeHead(500, DEFAULT_HEADERS)
      return response.end()
    }

    // processPaymentAsync({ correlationId, amount })

    response.writeHead(202, DEFAULT_HEADERS)
    return response.end()
  })
}

export default createPaymentsController

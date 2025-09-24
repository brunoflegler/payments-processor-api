import axios from 'axios'
import postgres from '../database/index.js'

import { queueFallback } from '../queue/index.js'

const processorDefaultURL =
  process.env.PROCESSOR_DEFAULT_URL || 'http://localhost:3000'

const processorFallbackURL =
  process.env.PROCESSOR_FALLBACK_URL || 'http://localhost:3001'

const processorDefaultApi = axios.create({
  baseURL: processorDefaultURL,
  hjeaders: {
    'Content-Type': 'application/json'
  }
})

const processorFallbackApi = axios.create({
  baseURL: processorFallbackURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const sendPaymentToProcessorDefault = async ({ data, retries }) => {
  const processedAt = new Date().toISOString()

  try {
    await processorDefaultApi.post('/payments', {
      correlationId: data.correlationId,
      amount: data.amount,
      requestedAt: processedAt
    })

    await postgres.updatePaymentsProcessed(data.correlationId, {
      processedAt: processedAt
    })
  } catch (error) {
    console.error('Error sending payment to processor:')
    await queueFallback.add('payment-processing-fallback', {
      data: {
        correlationId: data.correlationId,
        amount: data.amount
      },
      retries: retries + 1
    })
  }
}

const sendPaymentToProcessorFallback = async ({ data, retries }) => {
  const processedAt = new Date().toISOString()

  try {
    await processorFallbackApi.post('/payments', {
      correlationId: data.correlationId,
      amount: data.amount,
      requestedAt: processedAt
    })

    await postgres.updatePaymentsProcessed(data.correlationId, {
      status: 'processed_fallback',
      processedAt: processedAt
    })
  } catch (error) {
    if (retries < 5) {
      await queueFallback.add('payment-processing-fallback', {
        data: {
          correlationId: data.correlationId,
          amount: data.amount
        },
        retries: retries + 1
      })
    } else {
      await postgres.updatePaymentsFailed(data.correlationId, {
        failedAt: new Date().toISOString(),
        errorMessage: `Processor responded with status ${error.status} retries: ${retries}`
      })
    }
  }
}

const createPayment = async ({ data, retries = 0 }) => {
  await postgres.createPayment(data)

  await sendPaymentToProcessorDefault({ data, retries })
}

const retryPaymentWithFallback = async (data) => {
  await sendPaymentToProcessorFallback(data)
}

export default { createPayment, retryPaymentWithFallback }

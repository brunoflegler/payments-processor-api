import { Queue, Worker } from 'bullmq'

import service from '../services/index.js'

const queueDefault = new Queue('payment-processing', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
})

const queueFallback = new Queue('payment-processing-fallback', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
})

// Consumer (worker que processa)
const consumerDefault = () => {
  return new Worker(
    'payment-processing',
    async (job) => {
      await service.createPayment(job.data)
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    }
  )
}

const consumerFallback = () => {
  return new Worker(
    'payment-processing-fallback',
    async (job) => {
      await service.retryPaymentWithFallback(job.data)
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    }
  )
}

async function clear() {
  await queueDefault.drain()
  await queueFallback.drain()

  queueDefault.disconnect()
  queueFallback.disconnect()
}

export { queueDefault, queueFallback, consumerDefault, consumerFallback, clear }

// concurrency: 1
//  transactions_failure...........: 2745   40.794406/s
//  transactions_success...........: 7165   106.481573/s

// concurrency: 2
// transactions_failure...........: 2534   38.067156/s
// transactions_success...........: 6875   103.28007/s

// concurrency: 10
// transactions_failure...........: 3160   46.720012/s
// transactions_success...........: 6001   88.723668/s

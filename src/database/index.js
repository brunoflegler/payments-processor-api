import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432
})

const start = async () => {
  console.log('Starting database...')

  const createTablePayments = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      amount DECIMAL(10, 2) NOT NULL,
      requested_at TIMESTAMP NOT NULL,
      processed_at TIMESTAMP NULL,
      failed_at TIMESTAMP NULL,
      status TEXT NOT NULL,
      error_message TEXT
    );
  `

  const createTablePaymentsFallback = `
    CREATE TABLE IF NOT EXISTS payments_fallback (
      id UUID PRIMARY KEY,
      amount DECIMAL(10, 2) NOT NULL,
      requested_at TIMESTAMP NOT NULL,
      processed_at TIMESTAMP  NULL,
      failed_at TIMESTAMP NULL,
      status TEXT NOT NULL,
      error_message TEXT
    );
  `

  await pool.query(createTablePayments)
  await pool.query(createTablePaymentsFallback)

  console.log('Database started!')
}

const createPayment = async ({
  correlationId,
  amount,
  requestedAt = new Date().toISOString(),
  status = 'pending'
}) => {
  const {
    rows: [row]
  } = await pool.query(
    'INSERT INTO payments (id, amount, requested_at, status) VALUES ( $1, $2, $3, $4)',
    [correlationId, amount, requestedAt, status]
  )

  return row
}

const updatePaymentsProcessed = async (
  id,
  { status = 'processed', processedAt }
) => {
  const {
    rows: [row]
  } = await pool.query(
    'UPDATE payments SET status = $1, processed_at = $2 WHERE id = $3',
    [status, processedAt, id]
  )
  return row
}

const updatePaymentsFailed = async (
  id,
  { status = 'failed', failedAt, errorMessage }
) => {
  const {
    rows: [row]
  } = await pool.query(
    'UPDATE payments SET status = $1, failed_at = $2, error_message = $3 WHERE id = $4',
    [status, failedAt, errorMessage, id]
  )
  return row
}

const createPaymentFallback = async (id, amount, requestedAt) => {
  const [row] = await pool.query(
    'INSERT INTO payments_fallback (id, amount, requested_at) VALUES ($1, $2, $3)',
    [id, amount, requestedAt]
  )
  return row
}

const summaryFormat = (payments, paymentsFallback) => {
  return {
    default: {
      totalRequests: parseInt(payments.total_requests, 10),
      totalAmount: parseFloat(payments.total_amount, 10) || 0
    },
    fallback: {
      totalRequests: parseInt(paymentsFallback.total_requests, 10),
      totalAmount: parseFloat(paymentsFallback.total_amount, 10) || 0
    }
  }
}

const summary = async (from, to) => {
  if (from && to) {
    const [
      {
        rows: [payments]
      },
      {
        rows: [paymentsFallback]
      }
    ] = await Promise.all([
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at BETWEEN $1 AND $2 and status = 'processed'
          `,
        [from, to]
      ),
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at BETWEEN $1 AND $2 and status = 'processed_fallback'
          `,
        [from, to]
      )
    ])

    return summaryFormat(payments, paymentsFallback)
  }

  if (from && !to) {
    const [
      {
        rows: [payments]
      },
      {
        rows: [paymentsFallback]
      }
    ] = await Promise.all([
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at >= $1 and status = 'processed'
          `,
        [from]
      ),
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at >= $1 and status = 'processed_fallback'
          `,
        [from]
      )
    ])

    return summaryFormat(payments, paymentsFallback)
  }

  if (!from && to) {
    const [
      {
        rows: [payments]
      },
      {
        rows: [paymentsFallback]
      }
    ] = await Promise.all([
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at <= ? and status = 'processed'
          `,
        [to]
      ),
      pool.query(
        `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE processed_at <= $1 and status = 'processed_fallback'
          `,
        [to]
      )
    ])

    return summaryFormat(payments, paymentsFallback)
  }

  const [
    {
      rows: [payments]
    },
    {
      rows: [paymentsFallback]
    }
  ] = await Promise.all([
    pool.query(
      `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE status = 'processed'
          `
    ),
    pool.query(
      `
          SELECT
            count(id) as total_requests,
            sum(amount) as total_amount
          FROM payments
          WHERE status = 'processed_fallback'
          `
    )
  ])

  return summaryFormat(payments, paymentsFallback)
}

const stop = () => {
  console.log('Stopping database...')
  pool.end()
  console.log('Database stopped!')
}

export default {
  createPayment,
  updatePaymentsProcessed,
  updatePaymentsFailed,
  createPaymentFallback,
  start,
  stop,
  summary
}

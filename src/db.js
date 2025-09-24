// import { DatabaseSync } from 'node:sqlite'
// import Bluebird from 'bluebird'

// const db = new DatabaseSync('/app/data/database.sqlite')

// const stop = () => {
//   console.log('Stopping database...')
//   db.close()
//   console.log('Database stopped!')
// }

// const start = async () => {
//   console.log('Starting database...')

//   const createTablePayments = `
//     CREATE TABLE IF NOT EXISTS payments (
//       id UUID PRIMARY KEY,
//       amount DECIMAL(10, 2) NOT NULL,
//       requested_at TIMESTAMP NOT NULL,
//       processed_at TIMESTAMP NULL,
//       failed_at TIMESTAMP NULL,
//       status TEXT NOT NULL,
//       error_message TEXT
//     );
//   `

//   const createTablePaymentsFallback = `
//     CREATE TABLE IF NOT EXISTS payments_fallback (
//       id UUID PRIMARY KEY,
//       amount DECIMAL(10, 2) NOT NULL,
//       requested_at TIMESTAMP NOT NULL,
//       processed_at TIMESTAMP  NULL,
//       failed_at TIMESTAMP NULL,
//       status TEXT NOT NULL,
//       error_message TEXT
//     );
//   `

//   await db.prepare(createTablePayments).run()
//   await db.prepare(createTablePaymentsFallback).run()

//   console.log('Database started!')
// }

// const createPayment = async ({
//   correlationId,
//   amount,
//   requestedAt,
//   status
// }) => {
//   const stmt = db.prepare(
//     'INSERT INTO payments (id, amount, requested_at, status) VALUES ( ?, ?, ?, ?)'
//   )
//   const result = await stmt.run(correlationId, amount, requestedAt, status)

//   console.log(`Payment created with id: ${correlationId}`)

//   return result
// }

// const updatePaymentsProcessed = (id, { status, processedAt }) => {
//   const stmt = db.prepare(
//     'UPDATE payments SET status = ?, processed_at = ? WHERE id = ?'
//   )
//   return stmt.run(status, processedAt, id)
// }

// const createPaymentFallback = (id, amount, requestedAt) => {
//   const stmt = db.prepare(
//     'INSERT INTO payments_fallback (id, amount, requested_at) VALUES (?, ?, ?)'
//   )
//   return stmt.run(id, amount, requestedAt)
// }

// const summaryFormat = (payments, paymentsFallback) => {
//   return {
//     default: {
//       totalRequests: payments.total_requests,
//       totalAmount: payments.total_amount || 0
//     },
//     fallback: {
//       totalRequests: paymentsFallback.total_requests,
//       totalAmount: paymentsFallback.total_amount || 0
//     }
//   }
// }

// const summary = async (from, to) => {
//   console.log('-------- SUMMARY -------')
//   console.log(from, to)
//   console.log('-----------------------')
//   if (from && to) {
//     const [[payments], [paymentsFallback]] = await Promise.all([
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments
//           WHERE requested_at BETWEEN ? AND ? and status = 'processed'
//           `
//         )
//         .all(from, to),
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments_fallback
//           WHERE requested_at BETWEEN ? AND ? and status = 'processed'
//           `
//         )
//         .all(from, to)
//     ])

//     return summaryFormat(payments, paymentsFallback)
//   }

//   if (from && !to) {
//     const [[payments], [paymentsFallback]] = await Promise.all([
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments
//           WHERE requested_at >= ? and status = 'processed'
//           `
//         )
//         .all(from),
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments_fallback
//           WHERE requested_at >= ? and status = 'processed'
//           `
//         )
//         .all(from)
//     ])

//     return summaryFormat(payments, paymentsFallback)
//   }

//   if (!from && to) {
//     const [[payments], [paymentsFallback]] = await Promise.all([
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments
//           WHERE requested_at <= ? and status = 'processed'
//           `
//         )
//         .all(to),
//       db
//         .prepare(
//           `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments_fallback
//           WHERE requested_at <= ? and status = 'processed'
//           `
//         )
//         .all(to)
//     ])

//     return summaryFormat(payments, paymentsFallback)
//   }

//   const [[payments], [paymentsFallback]] = await Promise.all([
//     db
//       .prepare(
//         `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments
//           WHERE status = 'processed'
//           `
//       )
//       .all(),
//     db
//       .prepare(
//         `
//           SELECT
//             count(id) as total_requests,
//             sum(amount) as total_amount
//           FROM payments_fallback
//           WHERE status = 'processed'
//           `
//       )
//       .all()
//   ])

//   return summaryFormat(payments, paymentsFallback)
// }

// export default {
//   createPayment,
//   updatePaymentsProcessed,
//   createPaymentFallback,
//   start,
//   stop,
//   summary
// }

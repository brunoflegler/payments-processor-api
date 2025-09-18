import healthController from './health.js'
import getPaymentsSummaryController from './get-payments-summary.js'
import createPaymentsController from './create-payments.js'
import defaultController from './default.js'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

export {
  healthController,
  getPaymentsSummaryController,
  createPaymentsController,
  defaultController,
  DEFAULT_HEADERS
}

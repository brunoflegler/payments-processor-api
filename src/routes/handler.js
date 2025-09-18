import { DEFAULT_HEADERS } from '../controllers/index.js'
import db from '../db.js'
import {
  healthController,
  getPaymentsSummaryController,
  createPaymentsController,
  defaultController
} from '../controllers/index.js'

const routes = {
  'health:get': healthController,
  'payments-summary:get': getPaymentsSummaryController,
  'payments:post': createPaymentsController,
  default: defaultController
}

const handler = (request, response) => {
  const { url, method } = request

  const [, routeWithQuery] = url.split('/')
  const route = routeWithQuery ? routeWithQuery.split('?')[0] : routeWithQuery
  const key = `${route}:${method.toLowerCase()}`
  const chosen = routes[key] || routes.default

  return chosen(request, response)
}

export default handler

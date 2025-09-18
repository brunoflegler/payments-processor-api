import { DEFAULT_HEADERS } from './index.js'
import db from '../db.js'

const getPaymentsSummaryController = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const summary = await db.summary(from, to)

  response.writeHead(200, DEFAULT_HEADERS)
  return response.end(JSON.stringify(summary))
}

export default getPaymentsSummaryController

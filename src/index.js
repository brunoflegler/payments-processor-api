import os from 'os'
import cluster from 'cluster'

const runPrimary = () => {
  console.log(`Primary ${process.pid} is running`)

  cluster.fork()

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`)
    console.log('Forking another worker!')
    cluster.fork()
  })
}

const runWorker = async () => {
  await import('./server.js')
}

cluster.isPrimary ? runPrimary() : runWorker()

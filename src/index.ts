import { QueueManager, Queue } from './queue'
import express from 'express'
import bodyParser from 'body-parser'

export const createServer = (queue: Queue) => {
  const app = express()
  app.use(bodyParser.json())

  app.get('/', (req, res) => {
    const amount: any = req.query['amount'] ?? 1
    const messages = queue.PopFront(+amount).map((message) => {
      return {
        id: message.id,
        body: message.body,
      }
    })

    res.status(200).send({ messages })
  })

  app.post('/', (req, res) => {
    const timeout: any = req.query['timeout']
    res.status(201).send({ messageID: queue.Push(req.body, timeout) })
  })

  app.patch('/:id', (req, res) => {
    try {
      queue.Confirm(req.params.id)
      res.status(204).send({})
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  })

  return app
}

if (require.main === module) {
  const port = process.env.PORT ?? 3000
  const queueManager = new QueueManager()
  const queue = queueManager.newQueue('wonderq')
  const app = createServer(queue)
  app.listen(port, () => console.log(`App listening on port ${port}`))
}

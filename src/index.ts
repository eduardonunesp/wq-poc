import { QueueManager } from './queue'
import express from 'express'
import bodyParser from 'body-parser'
export const app = express()

app.use(bodyParser.json())

const port = process.env.PORT ?? 3000

const queueManager = new QueueManager()
const queue = queueManager.newQueue('wonderq')

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
  res.status(201).send({ messagesID: queue.Push(req.body) })
})

app.post('/:id', (req, res) => {
  try {
    queue.Confirm(req.params.id)
    res.status(204).send({})
  } catch (err) {
    res.status(400).send({ error: err.message })
  }
})

app.listen(port, () => console.log(`App listening on port ${port}`))

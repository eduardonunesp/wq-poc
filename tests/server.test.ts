import { expect } from 'chai'
import { validate } from 'uuid'
import { QueueManager, Queue } from '../src/queue'
import { createServer } from '../src/index'
import request from 'supertest'

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

describe.only('Server', () => {
  let queue: Queue

  beforeEach(() => {
    const queueManager = new QueueManager()
    queue = queueManager.newQueue('wonderq')
  })

  describe('Test Push Message', () => {
    it('Should push message to the queue server', async () => {
      const app = createServer(queue)
      const requestResult = await request(app)
        .post('/')
        .send({
          message: {
            content: 'MyMessage',
          },
        })
        .expect(201)

      expect(validate(requestResult.body.messageID)).to.be.equal(true)
    })

    it('Should push message with timeout to the queue server', async () => {
      const app = createServer(queue)
      const requestResult = await request(app)
        .post('/')
        .send({
          message: {
            content: 'MyMessage',
          },
        })

      expect(validate(requestResult.body.messageID)).to.be.equal(true)
    })
  })

  describe('Test Get Messages', () => {
    it('Should return the message available on queue', async () => {
      for (let index = 0; index < 100; index++) {
        queue.Push({
          message: {
            description: `Message ${index}`,
          },
        })
      }

      const app = createServer(queue)
      const requestResult = await request(app).get('/').expect(200)
      const [message] = requestResult.body.messages
      expect(validate(message.id)).to.be.equal(true)
    })

    it('Should return the message available for a consumer only', async () => {
      for (let index = 0; index < 100; index++) {
        queue.Push({
          message: {
            description: `Message ${index}`,
          },
        })
      }

      const app = createServer(queue)
      const requestResult1 = await request(app).get('/').expect(200)
      const [message] = requestResult1.body.messages
      expect(validate(message.id)).to.be.equal(true)

      expect(queue.LengthOfAvailable()).to.be.equal(99)

      const requestResult2 = await request(app).get('/?amount=10').expect(200)
      expect(requestResult2.body.messages).to.be.length(10)
    })

    it('Should return the message available for a consumer only 2', async () => {
      for (let index = 0; index < 100; index++) {
        queue.Push(
          {
            message: {
              description: `Message ${index}`,
            },
          },
          100
        )
      }

      const app = createServer(queue)

      await request(app).get('/?amount=25').expect(200)
      expect(queue.LengthOfAvailable()).to.be.equal(75)

      await request(app).get('/?amount=25').expect(200)
      expect(queue.LengthOfAvailable()).to.be.equal(50)

      await request(app).get('/?amount=25').expect(200)
      expect(queue.LengthOfAvailable()).to.be.equal(25)

      await request(app).get('/?amount=25').expect(200)
      expect(queue.LengthOfAvailable()).to.be.equal(0)

      const getRequestResult = await request(app).get('/?amount=25').expect(200)
      expect(getRequestResult.body.messages).to.have.length(0)

      await sleep(500)

      expect(queue.LengthOfAvailable()).to.be.equal(100)

      const getRequestResult2 = await request(app).get('/?amount=25').expect(200)
      expect(getRequestResult2.body.messages).to.have.length(25)
    })

    it('Should return again messages that are not confirmed', async () => {
      queue.Push(
        {
          message: {
            description: `Message 0`,
          },
        },
        100
      )

      const app = createServer(queue)
      const requestResult1 = await request(app).get('/?amount=10').expect(200)
      const [message1] = requestResult1.body.messages

      expect(queue.LengthOfAvailable()).to.be.equal(0)

      await sleep(500)

      expect(queue.LengthOfAvailable()).to.be.equal(1)

      const requestResult2 = await request(app).get('/?amount=10').expect(200)
      const [message2] = requestResult2.body.messages

      expect(queue.LengthOfAvailable()).to.be.equal(0)

      expect(message1.id).to.be.equal(message2.id)

      await sleep(500)

      expect(queue.LengthOfAvailable()).to.be.equal(1)
    })
  })

  describe('Test Confirm Messages', () => {
    it('Should return from queue unconfirmed messages', async () => {
      for (let index = 0; index < 5; index++) {
        queue.Push(
          {
            message: {
              description: `Message ${index}`,
            },
          },
          100
        )
      }

      const app = createServer(queue)
      const getRequestResult = await request(app).get('/?amount=10').expect(200)
      const [message] = getRequestResult.body.messages

      expect(queue.LengthOfAvailable()).to.be.equal(0)

      await request(app).patch(`/${message.id}`).send().expect(204)

      await sleep(500)

      expect(queue.LengthOfAvailable()).to.be.equal(4)

      const getRequestResult2 = await request(app).get('/?amount=10').expect(200)
      expect(getRequestResult2.body.messages).to.have.length(4)
    })

    it('Should not confirm unprocessing messages', async () => {
      for (let index = 0; index < 5; index++) {
        queue.Push(
          {
            message: {
              description: `Message ${index}`,
            },
          },
          100
        )
      }

      const app = createServer(queue)
      const getRequestResult1 = await request(app).get('/?amount=1').expect(200)
      const [message1] = getRequestResult1.body.messages

      const getRequestResult2 = await request(app).get('/?amount=1').expect(200)
      const [message2] = getRequestResult2.body.messages

      await request(app).patch(`/${message1.id}`).send().expect(204)
      await request(app).patch(`/${message2.id}`).send().expect(204)

      let hasError = false

      await sleep(500)

      try {
        // On this point those messages are already done
        await request(app).patch(`/${message1.id}`).send().expect(204)
        await request(app).patch(`/${message2.id}`).send().expect(204)
      } catch (err) {
        hasError = true
      }

      expect(hasError).to.be.equal(true)
    })
  })
})

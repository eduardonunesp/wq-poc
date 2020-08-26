import { expect } from 'chai'
import { Queue } from '../src/queue'
import { MessageState } from '../src/message'

describe('Queue', () => {
  describe('Test PopFront', () => {
    it('Should pop front correctly the queue', () => {
      const queue = new Queue('my-queue')
      const messageIDs = new Array<String>()

      for (let i = 0; i < 100; i++) {
        messageIDs.push(queue.Push({ order: i }))
      }

      const amountToPop = 1
      const result = queue.PopFront(amountToPop)

      expect(result).to.have.length(amountToPop)
      expect(result[0].id).to.be.equal(messageIDs[0])
      expect(result[0].state).to.be.equal(MessageState.PROCESSING)
      expect(queue.LengthOfAvailable()).to.be.equal(99)
    })

    it('Should pop front 10 messages', () => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 10; i++) {
        queue.Push({ order: i })
      }

      const amountToPop = 100 // Exceeding
      const expectedToPop = 10
      const result1 = queue.PopFront(amountToPop)
      expect(result1).to.have.length(expectedToPop)

      // All messages are processing, should be 0
      const result2 = queue.PopFront(amountToPop)
      expect(result2).to.have.length(0)
      expect(queue.LengthOfAvailable()).to.be.equal(0)
    })

    it('Should pop front 0 messages (if no messages available)', () => {
      const queue = new Queue('my-queue')
      const amountToPop = 10
      const result = queue.PopFront(amountToPop)
      expect(result).to.have.length(0)
      expect(queue.LengthOfAvailable()).to.be.equal(0)
    })

    it('Should pop front different message', () => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i })
      }

      const [result1] = queue.PopFront(1)
      const [result2] = queue.PopFront(1)
      const result3 = queue.PopFront(100) // ALL
      expect(result1.id).to.be.not.equal(result2.id)
      expect(result3).to.have.length(2)
      expect(queue.LengthOfAvailable()).to.be.equal(0)
    })

    it('Should pop front and timeout message', () => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i })
      }

      const [result1] = queue.PopFront(1)
      const [result2] = queue.PopFront(1)
      const result3 = queue.PopFront(100) // ALL

      expect(result1.id).to.be.not.equal(result2.id)
      expect(result3).to.have.length(2)
      expect(queue.LengthOfAvailable()).to.be.equal(0)
    })
  })

  describe('Test Confirm', () => {
    it('Should pop front and confirm correctly', () => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i }, 100)
      }

      const [result1] = queue.PopFront(1)
      const [result2] = queue.PopFront(1)

      queue.Confirm(result1.id)
      queue.Confirm(result2.id)
      expect(queue.LengthOfAvailable()).to.be.equal(2)
    })

    it('Should confirmed messages never come back to queue', (done) => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i }, 100)
      }

      const [result1] = queue.PopFront(1)
      const [result2] = queue.PopFront(1)

      queue.Confirm(result1.id)
      queue.Confirm(result2.id)

      expect(queue.LengthOfAvailable()).to.be.equal(2)

      setTimeout(() => {
        const result3 = queue.PopFront(100) // ALL
        expect(result1.id).to.be.not.equal(result2.id)
        expect(result3).to.have.length(2)
        expect(queue.LengthOfAvailable()).to.be.equal(0)
        done()
      }, 500)
    })

    it('Should not confirmed messages back to queue', (done) => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i }, 100)
      }

      queue.PopFront(1)
      queue.PopFront(1)

      expect(queue.LengthOfAvailable()).to.be.equal(2)

      setTimeout(() => {
        expect(queue.LengthOfAvailable()).to.be.equal(4)
        done()
      }, 500)
    })

    it('Should not confirm messages done', () => {
      const queue = new Queue('my-queue')

      for (let i = 0; i < 4; i++) {
        queue.Push({ order: i }, 100)
      }

      const [result1] = queue.PopFront(1)

      let errorRaised = false

      try {
        queue.Confirm(result1.id)
        queue.Confirm(result1.id)
      } catch (_err) {
        errorRaised = true
      }

      expect(errorRaised).to.be.equal(true)
      expect(queue.LengthOfAvailable()).to.be.equal(3)
    })
  })
})

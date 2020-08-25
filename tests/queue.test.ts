import { expect } from 'chai'
import { Queue } from '../src'

describe('Queue', () => {
  describe('Test PopFront', () => {
    const queue = new Queue('my-queue')
    const newMessages = new Array<String>()
    beforeEach(() => {
      for (let i = 0; i < 100; i++) {
        newMessages.push(queue.Push({ order: i }))
      }
    })

    it('Should pop front correctly the as FIFO', () => {
      const result = queue.PopFront()
      expect(newMessages[0]).to.be.equal(result[0].id)
    })
  })
})

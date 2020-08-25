import { Message, MessageState } from './message'

export class Queue {
  messagesReady: Array<Message>
  messagesProcessing: Array<Message>

  constructor(public name: string) {
    this.messagesReady = new Array<Message>()
    this.messagesProcessing = new Array<Message>()
  }

  Push(body: any): string {
    const message = new Message(body)
    message.state = MessageState.READY
    this.messagesReady.push(message)
    return message.id
  }

  PopFront(amount: Number = 10): Array<Message> {
    const messages = Array<Message>()

    for (let index = 0; index < amount; index++) {
      const message = this.messagesReady.shift()

      if (!message) {
        break
      }

      this.messagesProcessing.push(message)
      messages.push(message)
    }

    return messages
  }
}

export class QueueManager {
  queues: Map<string, Queue> = new Map<string, Queue>()

  /**
   * Creates a new queue to be managed by this class
   *
   * @throws Error if the queue already exists with the same name
   *
   * @param queueName string Name of the new queue
   */
  newQueue(queueName: string): Queue {
    if (this.queues.has(queueName)) {
      throw Error(`Queue with name ${queueName} already exists`)
    }

    const newQueue = new Queue(queueName)
    this.queues.set(queueName, newQueue)
    return newQueue
  }

  /**
   * Get the queue by name managed by this class
   *
   * @throws Error if the queue doesn't exists
   *
   * @param queueName string Name of the queue to get
   */
  getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      throw Error(`Queue with name ${queueName} doesn't exists`)
    }

    return this.queues.get(queueName)!
  }
}

import { Message, MessageState } from './message'

export class Queue {
  messagesReady: Array<Message>
  messagesProcessing: Map<string, Message>

  constructor(public name: string) {
    this.messagesReady = new Array<Message>()
    this.messagesProcessing = new Map<string, Message>()
  }

  LengthOfAvailable(): number {
    return this.messagesReady.length
  }

  MessageTimeout(message: Message) {
    this.messagesProcessing.delete(message.id)
    this.messagesReady.push(message)
  }

  Confirm(messageID: string) {
    if (!this.messagesProcessing.has(messageID)) {
      throw Error(`Message with ID ${messageID} it's not available for confirm`)
    }

    this.messagesProcessing.get(messageID)!.state = MessageState.DONE
    this.messagesProcessing.delete(messageID)
  }

  Push(body: any, timeout: number = 1000): string {
    const message = new Message(body, this.MessageTimeout.bind(this), timeout)

    message.state = MessageState.READY
    this.messagesReady.push(message)

    return message.id
  }

  PopFront(amount: number = 10): Array<Message> {
    const messages = Array<Message>()

    for (let index = 0; index < amount; index++) {
      const message = this.messagesReady.shift()

      if (!message) {
        break
      }

      message.state = MessageState.PROCESSING
      this.messagesProcessing.set(message.id, message)
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

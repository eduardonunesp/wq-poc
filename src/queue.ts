import { Message, MessageState } from './message'

/**
 * Queue is the class responsible for manage the messages and processing them
 * in a FIFO style. New messages are created and pushed into the queue to be
 * consumed and confirmed
 */
export class Queue {
  // Holds the queue FIFO using Push/Shift methods
  messagesReady: Array<Message>

  // Messages on processing state, can be removed or inserteed back on queue if not confirmed
  messagesProcessing: Map<string, Message>

  /**
   * Creates a new queue
   *
   * @param name string The name of the queue as unique indentification
   */
  constructor(public name: string) {
    this.messagesReady = new Array<Message>()
    this.messagesProcessing = new Map<string, Message>()
  }

  /**
   * Returns the lenght of the queue for messages that are ready to be consumed
   *
   * @returns number Length of the queue
   */
  LengthOfAvailable(): number {
    return this.messagesReady.length
  }

  /**
   * Internal callback used by the messages, when called removes the message from
   * the messages on processing and push back to the queue
   *
   * @param message Message to timeout
   */
  protected MessageTimeout(message: Message) {
    this.messagesProcessing.delete(message.id)
    this.messagesReady.push(message)
  }

  /**
   * Confirms that a message is consumed with success, the message will be removed
   * from the messages on processing and marked as DONE
   *
   * @throws Error if the message id isn't available to confirm, which can happen if
   * the message is done or awaiting for confirmation
   *
   * @param messageID string Message id
   */
  Confirm(messageID: string) {
    if (!this.messagesProcessing.has(messageID)) {
      throw Error(`Message with ID ${messageID} it's not available for confirm`)
    }

    this.messagesProcessing.get(messageID)!.state = MessageState.DONE
    this.messagesProcessing.delete(messageID)
  }

  /**
   * Pushes a new message to the end of the queue, later can be consumed by a consumer
   *
   * @param body any Body of the message to be pushed into the queue
   * @param timeout number The value in ms to the amount of time to the message expire if not confirmed
   */
  Push(body: any, timeout: number = 1000): string {
    const message = new Message(body, (message: Message) => this.MessageTimeout(message), timeout)

    message.state = MessageState.READY
    this.messagesReady.push(message)

    return message.id
  }

  /**
   * Pops the message from the queue
   *
   * If the amount of messages is greater than the queue length it will return all messages available
   *
   * @param amount number Amount of messages to be consumed from the queue
   * @returns Array<Message> Returns array of messages account with the length requested on amount param
   */
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

/**
 * QueueManager is just a container to manage different queues by an ID/name
 */
export class QueueManager {
  queues: Map<string, Queue> = new Map<string, Queue>()

  /**
   * Creates a new queue to be managed by this class
   *
   * @throws Error if the queue already exists with the same name
   *
   * @param queueName string Name of the new queue
   * @returns Queue Returns a new queue ready to be used
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

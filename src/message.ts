import { v4 } from 'uuid'

/**
 * Possible states of the message
 *
 * READY for new messages ready to me consumed
 * PROCESSING for messages already "locker" by a consumer
 * DONE for message already consumed
 */
export enum MessageState {
  READY,
  PROCESSING,
  DONE,
}

/**
 * The message class describes the unique message id, body with the contents of the message,
 * also the message state, and a timeout timer for callback when the message is not confirmed
 */
export class Message {
  private _id: string
  private _state: MessageState = MessageState.READY
  private _timer?: NodeJS.Timeout

  /**
   * Creates a new Message to be inserted into the queue
   *
   * @param body any Body of the message
   * @param timeoutCb Function If the function is on processing for long period the callback is called
   * @param timeout number Amount in milliseconds to consider a message expired on processing
   */
  constructor(public body: any, public timeoutCb: Function, private timeout: number = 1000) {
    this._id = v4()
  }

  /**
   * New state to be set on this message
   *
   * Important to notice that PROCESSING state triggers the timeout counter
   * if the message not confirmed before timeout the function timeoutCb will be called
   * Any state different of PROCESSING with clear the timeout timer
   */
  set state(newState: MessageState) {
    if (newState === MessageState.PROCESSING) {
      this._timer = setTimeout(() => {
        if (this._state === MessageState.PROCESSING) {
          this._state = MessageState.READY
          this.timeoutCb(this)
        }
      }, this.timeout)
    }

    if (newState === MessageState.DONE || newState === MessageState.READY) {
      if (this._timer) {
        clearTimeout(this._timer)
      }
    }

    this._state = newState
  }

  /**
   * Returns the message UUID
   */
  get id(): string {
    return this._id
  }

  /**
   * Returns the message current state
   */
  get state(): MessageState {
    return this._state
  }
}

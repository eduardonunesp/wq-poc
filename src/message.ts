import { v4 } from 'uuid'

export enum MessageState {
  READY,
  PROCESSING,
  DONE,
}

export class Message {
  private _id: string
  private _state: MessageState = MessageState.READY
  private _timer?: NodeJS.Timeout

  constructor(public body: any, public timeoutCb: Function, private timeout: number = 1000) {
    this._id = v4()
  }

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

  get id(): string {
    return this._id
  }

  get state(): MessageState {
    return this._state
  }
}

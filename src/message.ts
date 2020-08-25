import { v4 } from 'uuid'

export enum MessageState {
  READY,
  PROCESSING,
  DONE,
}

export class Message {
  private _id: string
  private _state: MessageState = MessageState.READY

  constructor(public body: any) {
    this._id = v4()
  }

  set state(newState: MessageState) {
    this._state = newState
  }

  get id(): string {
    return this._id
  }

  get state(): MessageState {
    return this._state
  }
}

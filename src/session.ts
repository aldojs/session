
import { Store } from './store'
import uniqId from 'crypto-random-string'
import { MemoryStorage } from './storage/memory'

const TWO_HOURS = 2 * 60 * 60 * 1000

export type Options = {
  state?: { [key: string]: any }
  storage?: IStorage
  lifetime?: number
  id?: string
}

export interface IStorage {
  read (id: string): any
  destroy (id: string): any
  write (id: string, data: any, ttl: number): any
}

export class Session {
  /**
   * The session identifier
   * 
   * @private
   */
  private _id: string

  /**
   * The session state
   * 
   * @private
   */
  private _state: Store

  /**
   * The session store started status
   * 
   * @private
   */
  private _started = false

  /**
   * The session options
   * 
   * @private
   */
  private _lifetime: number

  /**
   * The session storage adapter
   * 
   * @private
   */
  private _storage: IStorage

  /**
   * Create a new session instance
   * 
   * @param options
   * @constructor
   * @public
   */
  public constructor ({
    storage = new MemoryStorage(),
    lifetime = TWO_HOURS,
    state = {},
    id
  }: Options = {}) {
    this._id = id || this._generateId()
    this._state = new Store(state)
    this._lifetime = lifetime
    this._storage = storage
  }

  /**
   * Get the session id
   * 
   * @public
   */
  public get id (): string {
    return this._id
  }

  /**
   * Set an entry in the session
   * 
   * @param key 
   * @param value 
   * @public
   */
  public set (key: string, value: any): this {
    this._state.set(key, value)
    return this
  }

  /**
   * Replace the session state entirely
   * 
   * @param state The new session state
   * @public
   */
  public reset (state = {}): this {
    this._state.reset(state)
    return this
  }

  /**
   * Get an item from the session
   * 
   * @param key 
   * @public
   */
  public get (key: string): any {
    return this._state.get(key)
  }

  /**
   * Check if the `key` is present
   * 
   * @param key 
   * @public
   */
  public has (key: string): boolean {
    return this._state.has(key)
  }

  /**
   * Get the `key` value, removing the entry from the session
   * 
   * @param key 
   * @public
   */
  public pull (key: string): any {
    let value = this._state.get(key)

    this._state.delete(key)

    return value
  }

  /**
   * Start the session, reading the state from the storage
   * 
   * @public
   * @async
   */
  public async start (): Promise<void> {
    if (!this._started) {
      let data = await this._read()

      this._state.merge(this._decode(data))
    }

    this._started = true
  }

  /**
   * Save the session, writing the state in the storage
   * 
   * @public
   * @async
   */
  public async commit (): Promise<void> {
    try {
      await this._write()
    } catch (e) {
      // do nothing
    }

    this._started = false
  }

  /**
   * Flush the session data and regenerate a new identifier
   * 
   * @public
   * @async
   */
  public invalidate (): Promise<void> {
    return this.reset().regenerate(true)
  }

  /**
   * Generate a new session identifier
   * 
   * @param destroy if true, will destroy the storage entry
   * @public
   * @async
   */
  public async regenerate (destroy = false): Promise<void> {
    if (destroy) await this._destroy()

    this._id = this._generateId()
  }

  /**
   * Save the state in the storage
   * 
   * @private
   * @async
   */
  private _write () {
    return this._storage.write(
      this._id, this._encode(this._state), this._lifetime
    )
  }

  /**
   * Read the state from the storage
   * 
   * @private
   * @async
   */
  private _read () {
    return this._storage.read(this._id)
  }

  /**
   * Remove the session state from the storage
   * 
   * @private
   * @async
   */
  private _destroy () {
    return this._storage.destroy(this._id)
  }

  /**
   * Get a new, random session id
   * 
   * @private
   */
  private _generateId (): string {
    return uniqId(40)
  }

  /**
   * Serialize the given object
   * 
   * @param input 
   * @private
   */
  private _encode (input: object) {
    return JSON.stringify(input)
  }

  /**
   * Unserialize the given object
   * 
   * @param input 
   * @private
   */
  private _decode (input: string) {
    try {
      return JSON.parse(input)
    } catch (error) {
      return {}
    }
  }
}

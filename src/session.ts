
import { Store } from './store'
import uniqId from 'crypto-random-string'
import { MemoryStorage } from './storage/memory'

const TWO_HOURS = 2 * 60 * 60 * 1000

export interface SerializerInterface {
  parse (input: string): object
  stringify (input: object): string
}

export type StorageInterface ={
  read (id: string): any
  remove (id: string): any
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
  private _state = new Store()

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
  private _lifetime = TWO_HOURS

  /**
   * The session storage adapter
   * 
   * @private
   */
  private _storage: StorageInterface

  /**
   * The state serializer
   * 
   * @private
   */
  private _serializer: SerializerInterface = JSON

  /**
   * Create a new session instance
   * 
   * @param storage The persistence driver
   * @param id The session identifier
   * @constructor
   * @public
   */
  public constructor (storage: StorageInterface = new MemoryStorage(), id?: string) {
    this._id = id || this._generateId()
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
   * Set the session lifetime
   * 
   * @param value The lifetime in milliseconds
   * @public
   */
  public lifetime (value: number): this {
    this._lifetime = value
    return this
  }

  /**
   * Set the session state serializer
   * 
   * @param obj The serializer object
   * @public
   */
  public serializer (obj: SerializerInterface): this {
    this._serializer = obj
    return this
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
    if (this._started) return

    try {
      let data = await this._read()

      this._state.merge(this._parse(data))
    } catch (error) {
      // do nothing
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
    if (!this._started) return

    try {
      let data = this._stringify(this._state)

      await this._write(data)
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
   * @param data The serialized data to save
   * @private
   * @async
   */
  private _write (data) {
    return this._storage.write(this._id, data, this._lifetime)
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
    return this._storage.remove(this._id)
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
  private _stringify (input: object): string {
    return this._serializer.stringify(input)
  }

  /**
   * Unserialize the given object
   * 
   * @param input 
   * @private
   */
  private _parse (input: string): object {
    return this._serializer.parse(input)
  }
}

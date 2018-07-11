
import { Store } from './_store'
import uniqId from 'crypto-random-string'

const TWO_HOURS = 2 * 60 * 60 * 1000

/**
 * The session state serializer interface
 */
export interface SerializerContract {
  /**
   * Deserialize the given string
   * 
   * @param input The serialized string
   */
  parse (input: string): object

  /**
   * Serialize the given object
   * 
   * @param input The object to serialize
   */
  stringify (input: object): string
}

/**
 * The session storage interface
 */
export interface StorageContract {
  /**
   * Retrieve an entry by its key
   * 
   * @param key The entry key
   */
  read (key: string): any

  /**
   * Remove an entry by its key
   * 
   * @param key The entry key
   */
  remove (key: string): any

  /**
   * Save an entry's data for the given time
   * 
   * @param key The entry key
   * @param data The entry data
   * @param ttl The entry time to live
   */
  write (key: string, data: any, ttl: number): any
}

/**
 * The session store interface
 */
export interface StoreContract {
  /**
   * Get the JSON representation of the state
   */
  toJSON (): object

  /**
   * Determine the state is empty or not
   */
  isEmpty (): boolean

  /**
   * Get the `key` value
   * 
   * @param key The entry's key
   */
  get (key: string): any

  /**
   * Delete a entry by its `key`
   * 
   * @param key The entry's key
   */
  delete (key: string): any

  /**
   * Check whether an entry is present or not
   * 
   * @param key The entry's key
   */
  has (key: string): boolean

  /**
   * Replace the state entirely
   * 
   * @param state The state data
   */
  reset (state?: object): any

  /**
   * Set a key/value pair
   * 
   * @param key The entry's key, or a plain object
   * @param value The entry's value
   */
  set (key: string | object, value?: any): any
}

/**
 * The session manager class
 * 
 * Manages the internal state, and persists the data for further use
 * 
 * @public
 * @class
 */
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
  private _state: StoreContract

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
  private _storage: StorageContract

  /**
   * The state serializer
   * 
   * @private
   */
  private _serializer: SerializerContract = JSON

  /**
   * Create a new session instance
   * 
   * @param storage The persistence driver
   * @param id The session identifier
   * @param store The state store
   * @constructor
   * @public
   */
  public constructor (storage: StorageContract, id = '', store: StoreContract = new Store()) {
    if (!id) {
      // we set this flag to `true` to prevent loading the state from the storage,
      // since the identifier will be generated and of course not yet saved.
      this._started = true

      id = this._generateId()
    }

    this._id = id
    this._state = store
    this._storage = storage
  }

  /**
   * Set the session lifetime.
   * 
   * Allow using different lifetimes for certain cases
   * 
   * @param value The lifetime in milliseconds
   * @public
   */
  public lifetime (value: number): this {
    this._lifetime = value
    return this
  }

  /**
   * Set the session data serializer
   * 
   * @param obj The serializer object
   * @public
   */
  public serializer (obj: SerializerContract): this {
    this._serializer = obj
    return this
  }

  /**
   * Set an entry in the session
   * 
   * @param key The entry's key
   * @param value The entry's value
   * @public
   */
  public set (key: string, value: any): this

  /**
   * Set multiple entries
   * 
   * @param values The values object
   * @public
   */
  public set (values: object): this

  /**
   * @inheritDoc
   */
  public set (one: any, two?: any) {
    this._state.set(one, two)
    return this
  }

  /**
   * Replace the session state entirely
   * 
   * @param state The new session state
   * @public
   */
  public reset (state: object = {}): this {
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
   * Start the session, reading the state from the storage.
   * 
   * Will return `false` if the session is already started or newly created
   * 
   * @public
   * @async
   */
  public async start (): Promise<boolean> {
    // the session is already started or newly created
    if (this._started) return false

    try {
      // the storage can return null or undefined if the session was expired
      let data = await this._read()

      // if an error occurs during loading or parsing,
      // the session state will not be updated
      this._state.set(this._parse(data))
    } catch (e) {
      // do nothing
    }

    // prevent restarting multiple times
    return this._started = true
  }

  /**
   * Save the session, writing the state in the storage.
   * 
   * Will not persist if the session state is empty.
   * 
   * May be called multiple times to persist the session data.
   * 
   * @param force Force saving flag
   * @public
   * @async
   */
  public async commit (force = false): Promise<boolean> {
    // prevent i/o operations for empty sessions
    if (!force && this._state.isEmpty()) return true

    try {
      await this._write(this._serialize())
    } catch (e) {
      // we return `false` instead of rethrowing the error object,
      // to inform the consumer that the session was not saved correctly.
      return false
    }

    return true
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
   * Maintain the actual state and regenerate an new identifier
   * 
   * @param destroy if true, will destroy the storage entry
   * @public
   * @async
   */
  public async regenerate (destroy = false): Promise<void> {
    if (destroy) {
      try {
        await this._destroy()
      } catch (error) {
        // do nothing
      }
    }

    this._id = this._generateId()
  }

  /**
   * Save the state in the storage
   * 
   * @param data The serialized data to save
   * @private
   * @async
   */
  private _write (data: string) {
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
   * Serialize the session state
   * 
   * @param input 
   * @private
   */
  private _serialize (): string {
    return this._serializer.stringify(this._state.toJSON())
  }

  /**
   * Unserialize the given string
   * 
   * @param data 
   * @private
   */
  private _parse (data: string): object {
    return this._serializer.parse(data)
  }
}

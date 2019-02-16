
'use strict'

const createRandomString = require('crypto-random-string')


const TWO_HOURS = 2 * 60 * 60 * 1000


/**
 * 
 */
exports.Session = class {
  /**
   * 
   * @param {object} backend The backend storage
   * @param {string} [sid] The session identifier
   * @param {object} [state] The session initial state
   */
  constructor (backend, sid, state) {
    this._state = state
    this._backend = backend
    this._lifetime = TWO_HOURS

    // if an identifier is provided, we set this flag to `true`,
    // to prevent an unnecessary loading of data from the storage.
    this._started = sid ? true : false

    this._id = sid ? sid : this._generateId()
  }

  /**
   * Get the session identifier
   */
  get id () {
    return this._id
  }

  /**
   * Set the session lifetime.
   * 
   * Allow using different lifetimes for certain cases
   * 
   * @param {number} value The lifetime in milliseconds
   * @public
   */
  setLifetime (value) {
    this._lifetime = value
    return this
  }

  /**
   * Determine the state is empty or not
   * 
   * @public
   */
  isEmpty () {
    return Object.keys(this._state).length === 0
  }

  /**
   * Set a key/value pair
   * 
   * @param {string | symbol | object} key 
   * @param {any} [value] 
   * @public
   */
  set (key, value) {
    if (typeof key === 'object') {
      return Object.assign(this._state, key)
    }

    Reflect.set(this._state, key, value)

    return this
  }

  /**
   * Replace the state entirely
   * 
   * @param {object} [newState] 
   * @public
   */
  reset (newState = {}) {
    this._state = newState
    return this
  }

  /**
   * Get the `key` value
   * 
   * @param {string |symbol} key 
   * @public
   */
  get (key) {
    return Reflect.get(this._state, key)
  }

  /**
   * Check if the `key` is present
   * 
   * @param {string |symbol} key 
   * @public
   */
  has (key) {
    return Reflect.has(this._state, key)
  }

  /**
   * Delete the `key` entry
   * 
   * @param {string |symbol} key 
   * @public
   */
  delete (key) {
    return Reflect.deleteProperty(this._state, key)
  }

  /**
   * Get the `key` value, removing the entry from the session
   * 
   * @param {string |symbol} key
   * @public
   */
  pull (key) {
    let value = this.get(key)

    this.delete(key)

    return value
  }

  /**
   * Get the JSON representation
   * 
   * @public
   */
  toJSON () {
    return this._state
  }

  /**
   * Start the session, reading the state from the storage.
   * 
   * Will return `false` if the session is already started or newly created
   * 
   * @public
   * @async
   */
  async start () {
    if (this._started) return false

    let data = await this._read()

    // the storage may return `null` or `undefined`,
    // if the session is expired or doesn't yet exist.
    if (data != null) this.set(data)

    return this._started = true
  }

  /**
   * Save the session, writing the state in the storage.
   * 
   * Will not persist if the state is empty.
   * 
   * @public
   * @async
   */
  async commit () {
    // prevent i/o operations for empty sessions
    if (this.isEmpty()) return false

    await this._write(this.toJSON())

    return true
  }

  /**
   * Flush the session data and regenerate a new identifier
   * 
   * @public
   * @async
   */
  invalidate () {
    return this.reset().regenerate(true)
  }

  /**
   * Maintain the actual state and regenerate an new identifier
   * 
   * @param {boolean} [destroy] if true, will destroy the storage entry
   * @public
   * @async
   */
  async regenerate (destroy = false) {
    if (destroy) await this._destroy()

    this._id = this._generateId()
  }

  /**
   * Remove the session state from the storage
   * 
   * @private
   * @async
   */
  _destroy () {
    return this._backend.remove(this._id)
  }

  /**
   * Save the state in the storage
   * 
   * @param data The state to save
   * @private
   * @async
   */
  _write (data) {
    return this._backend.write(this._id, data, this._lifetime)
  }

  /**
   * Read the state from the storage
   * 
   * @private
   * @async
   */
  _read () {
    return this._backend.read(this._id)
  }
  
  /**
   * Get a new, random session id
   * 
   * @private
   */
  _generateId () {
    return createRandomString(40)
  }
}

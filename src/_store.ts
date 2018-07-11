
export class Store {
  /**
   * The state map
   * 
   * @private
   */
  private _state: {
    [key: string]: any
  }

  /**
   * Create a new state instance
   * 
   * @param state The default state
   * @constructor
   * @public
   */
  public constructor (state = {}) {
    this._state = state
  }

  /**
   * Set a key/value pair
   * 
   * @param key 
   * @param value 
   * @public
   */
  public set (key: string | object, value?: any) {
    if (typeof key === 'object') {
      return Object.assign(this._state, key)
    }

    Reflect.set(this._state, key, value)
  }

  /**
   * Replace the state entirely
   * 
   * @param state The new session state
   * @public
   */
  public reset (state = {}) {
    this._state = state
  }

  /**
   * Get the `key` value
   * 
   * @param key 
   * @public
   */
  public get (key: string) {
    return Reflect.get(this._state, key)
  }

  /**
   * Check if the `key` is present
   * 
   * @param key 
   * @public
   */
  public has (key: string) {
    return Reflect.has(this._state, key)
  }

  /**
   * Delete the `key` entry
   * 
   * @param key 
   * @public
   */
  public delete (key: string) {
    Reflect.deleteProperty(this._state, key)
  }

  /**
   * Get the JSON representation
   * 
   * @public
   */
  public toJSON (): object {
    return this._state
  }
}

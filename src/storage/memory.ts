
declare type Payload = {
  expires: number
  data: any
}

export class MemoryStorage {
  /**
   * The sessions container
   * 
   * @private
   */
  private _items: Map<string, Payload>

  /**
   * Initialize a memory session driver
   * 
   * @param options 
   * @constructor
   * @public
   */
  public constructor (map = new Map()) {
    this._items = map
  }

  /**
   * Get the session state
   * 
   * @param sid
   * @public
   */
  public read (sid: string): any {
    let payload = this._items.get(sid)

    // not found
    if (!payload) return

    // expired
    if (!this._isExpired(payload)) {
      this.destroy(sid)
      return
    }

    return payload.data
  }

  /**
   * Save the session state
   * 
   * @param sid The session id
   * @param data The session state
   * @param ttl The time-to-live in milliseconds
   * @public 
   */
  public write (sid: string, data: any, ttl: number): void {
    this._items.set(sid, { data, expires: this._getExpiryTime(ttl) })
  }

  /**
   * Destroy the given session state
   * 
   * @param sid The session id
   * @public
   */
  public destroy (sid: string): void {
    this._items.delete(sid)
  }

  /**
   * Check whether the payload is expired
   * 
   * @param payload
   * @private
   */
  private _isExpired ({ expires }: Payload): boolean {
    return expires >= Date.now()
  }

  /**
   * Get the number of expiry time milliseconds
   * 
   * @param ttl
   * @private
   */
  private _getExpiryTime (ttl: number): number {
    return Date.now() + ttl
  }
}

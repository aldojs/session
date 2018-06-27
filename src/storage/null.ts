
export class NullStorage {
  /**
   * Get the session state
   * 
   * @param sid The session id
   * @public
   */
  public read (sid: string): any {
    return
  }

  /**
   * Save the session state
   * 
   * @param sid The session id
   * @param state The session state
   * @public 
   */
  public write (sid: string, state: any): void {
    // do nothing
  }

  /**
   * Destroy the session state
   * 
   * @param sid The session id
   * @public
   */
  public destroy (sid: string): void {
    // do nothing
  }
}

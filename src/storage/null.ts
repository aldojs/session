
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
   * Remove the session data
   * 
   * @param sid The session id
   * @public
   */
  public remove (sid: string): void {
    // do nothing
  }
}

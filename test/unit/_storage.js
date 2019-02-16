
exports.NullStorage = class {
  /**
   * Get the session state
   * 
   * @param {string} sid The session id
   * @public
   */
  read (sid) {
    // do nothing
  }

  /**
   * Save the session state
   * 
   * @param {string} sid The session id
   * @param {any} state The session state
   * @public 
   */
  write (sid, state) {
    // do nothing
  }

  /**
   * Remove the session data
   * 
   * @param {string} sid The session id
   * @public
   */
  remove (sid) {
    // do nothing
  }
}

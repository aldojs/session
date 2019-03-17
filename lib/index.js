
'use strict'

const { Session } = require('./session')


/**
 * The session manager class
 * 
 * @class
 */
exports.Session = Session

/**
 * Create a new session
 * 
 * @param {object} storage The backend storage
 * @param {string} [id] The session identifier
 * @param {object} [state] The session initial state
 */
exports.createSession = function (storage, sid = '', state = {}) {
  return new Session(storage, sid, state)
}

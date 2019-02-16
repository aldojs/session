
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

/**
 * Create and start a new session
 * 
 * @param {object} storage The session storage
 * @async
 */
exports.startSession = async function (storage) {
  let session = exports.createSession(storage)

  await session.start()

  return session
}


const assert = require('assert')
const { Session } = require('../../lib')


function createSession (state) {
  return new Session(null, 'test', state)
}

describe('test the session state management', () => {
  describe('session.set(key, value)', () => {
    it('should set the state values', () => {
      let state = {}
      let session = createSession(state)
  
      session.set('foo', 'bar')
  
      assert.ok(!session.isEmpty())
      assert.equal(state.foo, 'bar')
    })
  })

  describe('session.merge(newState)', () => {
    it('should merge the values', () => {
      let state = { 'foo': true, 'bar': false }
      let session = createSession(state)
  
      session.merge({ 'bar': 123, baz: false })
  
      assert.deepEqual(session.toJSON(), {
        foo: true, bar: 123, baz: false
      })
    })
  })

  describe('session.get(key)', () => {
    it('should return the entry value', () => {
      let state = { foo: 'bar' }
      let session = createSession(state)
  
      assert.ok(session.has('foo'))
      assert.equal(session.get('foo'), 'bar')
    })
  })

  describe('session.delete(key)', () => {
    it('should delete the entry', () => {
      let state = { foo: 'bar' }
      let session = createSession(state)

      session.delete('foo')

      
      assert.equal(session.isEmpty(), true)
      assert.equal(session.has('foo'), false)
      assert.equal(session.get('foo'), undefined)
    })
  })

  describe('session.reset(newState?)', () => {
    it('should entirely reset the state', () => {
      let session = createSession({ 'foo': 'bar' })

      assert.ok(session.has('foo'))

      session.reset({ 'baz': 123 })

      assert.equal(session.has('foo'), false)
      assert.deepEqual(session.toJSON(), { 'baz': 123 })
    })
  })

  describe('session.pull(key)', () => {
    it('should return and remove the state entry', () => {
      let session = createSession({ 'foo': 'bar' })

      let value = session.pull('foo')

      assert.deepEqual(session.toJSON(), {})
      assert.equal(value, 'bar')
    })
  })
})


const assert = require('assert')
const { stub } = require('sinon')
const { createSession } = require('../../lib')
const { NullStorage: Backend } = require('./_storage')


describe('test persistence management', () => {
  describe('session initialization', () => {
    describe('when the `id` is not given', () => {
      it('should generate a new identifier', () => {
        let session = createSession(new Backend())

        assert.ok(/[a-z0-9]/i.test(session.id))
      })
    })

    describe('when the `id` is provided', () => {
      it('should use the given identifier', () => {
        let session = createSession(new Backend(), 'abc123')

        assert.equal(session.id, 'abc123')
      })
    })
  })

  describe('session.start()', () => {
    describe('when an identifier is given', () => {
      it('should not start again', async () => {
        let store = new Backend()
        let _stub = stub(store, 'read')
        let session = createSession(store, 'abc123')

        let flag = await session.start()

        assert.equal(flag, false)
        assert.equal(_stub.notCalled, true)
      })
    })

    describe('when an identifier is not provided', () => {
      it('should read the data from the storage', async () => {
        let store = new Backend()
        let _stub = stub(store, 'read')
        let session = createSession(store)

        _stub.onFirstCall().returns({ 'foo': 'bar' })

        let flag = await session.start()

        assert.equal(session.get('foo'), 'bar')
        assert.equal(_stub.called, true)
        assert.equal(flag, true)
      })
    })
  })

  describe('session.regenerate(destroy?)', () => {
    describe('when `destroy` equals `false`', () => {
      it('should regenerate a new session identifier', async () => {
        let session = createSession(new Backend(), 'abc123')

        await session.regenerate()

        assert.notEqual(session.id, 'abc123')
      })
    })

    describe('when `destroy` equals `true`', () => {
      it('should remove the state from the storage', async () => {
        let store = new Backend()
        let _stub = stub(store, 'remove')
        let session = createSession(store, 'abc123')

        await session.regenerate(true)

        assert.equal(_stub.called, true)
        assert.notEqual(session.id, 'abc123')
      })
    })
  })

  describe('session.invalidate()', () => {
    it('should destroy and regenerate a new empty session', async () => {
      let store = new Backend()
      let _stub = stub(store, 'remove')
      let session = createSession(store, 'abc123', { 'foo': 'bar' })

        await session.invalidate()

      assert.equal(_stub.called, true)
      assert.notEqual(session.id, 'abc123')
      assert.deepEqual(session.toJSON(), {})
    })
  })

  describe('session.commit()', () => {
    it('should skip if the state is empty', async () => {
      let store = new Backend()
      let _stub = stub(store, 'write')
      let session = createSession(store)

      await session.commit()

      assert.equal(_stub.notCalled, true)
    })

    it('should persist the state', async () => {
      let store = new Backend()
      let _stub = stub(store, 'write')
      let session = createSession(store, 'abs123', { 'foo': 'bar' })

      await session.commit()

      assert.equal(_stub.called, true)
    })
  })
})


import 'mocha'
import { stub } from 'sinon'
import * as assert from 'assert'
import { Storage } from './_storage'
import { Store } from '../src/_store'
import { Session } from '../src/session'

describe('test session manager', () => {
  describe('session initialization', () => {
    describe('when the `id` is not given', () => {
      it('should generate a new identifier and flagged as started', () => {
        let session = new Session(new Storage())

        assert.ok(/[a-z0-9]/i.test(session.id))
        assert.ok(session.isStarted())
      })
    })

    describe('when the `id` is provided', () => {
      it('should use the given identifier', () => {
        let session = new Session(new Storage(), 'foo')

        assert.equal(session.id, 'foo')
        assert.ok(!session.isStarted())
      })
    })
  })

  describe('session.pull(key)', () => {
    it('should remove the item from the store', () => {
      let store = new Store({ 'foo': 'bar' })
      let session = new Session(new Storage(), 'abc', store)

      let value = session.pull('foo')

      assert.equal(value, 'bar')
      assert.ok(store.isEmpty())
    })
  })

  describe('session.start()', () => {
    describe('when the session is started', () => {
      it('should not start again', async () => {
        let session = new Session(new Storage())
        let _stub = stub(session as any, '_read')

        assert.ok(session.isStarted())

        let flag = await session.start()

        assert.equal(flag, false)
        assert.ok(_stub.notCalled)
      })
    })

    describe('when the session is not started', () => {
      it('should read the data from the storage', async () => {
        let session = new Session(new Storage(), 'abc')
        let _stub = stub(session as any, '_read')

        _stub.onFirstCall().returns({ 'foo': 'bar' })

        let flag = await session.start()

        assert.equal(session.get('foo'), 'bar')
        assert.ok(session.isStarted())
        assert.ok(_stub.calledOnce)
        assert.equal(flag, true)
      })
    })

    describe('when an error is thrown', () => {
      it('should not throw errors', async () => {
        let session = new Session(new Storage(), 'abc')
        let _stub = stub(session as any, '_read')

        _stub.onFirstCall().throws()

        try {
          var flag = await session.start()
        } catch (e) {
          assert.fail('should not throw')
        }

        assert.ok(session.isStarted())
        assert.ok(_stub.calledOnce)
        assert.equal(flag, true)
      })
    })
  })

  describe('session.regenerate(destroy?)', () => {
    describe('when `destroy` equals `false`', () => {
      it('should regenerate a new session identifier', async () => {
        let session = new Session(new Storage(), 'foo')
        let _stub = stub(session as any, '_generateId')

        _stub.onFirstCall().returns('bar')

        await session.regenerate()

        assert.equal(session.id, 'bar')
      })
    })

    describe('when `destroy` equals `true`', () => {
      it('should remove the state from the storage', async () => {
        let session = new Session(new Storage(), 'foo')
        let _stub1 = stub(session as any, '_generateId')
        let _stub2 = stub(session as any, '_destroy')

        _stub1.onFirstCall().returns('bar')

        await session.regenerate(true)

        assert.ok(_stub1.called)
        assert.ok(_stub2.called)
        assert.equal(session.id, 'bar')
      })
    })
  })

  describe('session.invalidate()', () => {
    it('should destroy and regenerate a new empty session', async () => {
      let session = new Session(new Storage(), 'abc321')
      let _stub = stub(session as any, '_destroy')

      await session.set('foo', 'bar').invalidate()

      assert.notEqual(session.id, 'abc321')
      assert.ok(session.isEmpty())
    })
  })

  describe('session.commit(force?)', () => {
    describe('when `force` is false', () => {
      it('should skip if the state is empty', async () => {
        let session = new Session(new Storage())
        let _stub = stub(session as any, '_write')

        await session.commit()

        assert.ok(_stub.notCalled)
      })

      it('should persist the state if available', async () => {
        let session = new Session(new Storage())
        let _stub = stub(session as any, '_write')

        session.set('foo', 'bar')

        await session.commit()

        assert.ok(_stub.calledWith({ foo: 'bar' }))
      })
    })

    describe('when `force` is `true`', () => {
      it('should force saving, even if the state is empty', async () => {
        let session = new Session(new Storage())
        let _stub = stub(session as any, '_write')

        await session.commit(true)

        assert.ok(_stub.calledWith({}))
      })
    })
  })
})

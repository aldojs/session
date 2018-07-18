
import 'mocha'
import { stub } from 'sinon'
import * as assert from 'assert'
import { Session, StorageContract } from '../src/session'
import { Store } from '../src/_store';

describe('test session manager', () => {
  describe('session initialization', () => {
    describe('when the `id` is not given', () => {
      it('should generate a new identifier and flagged as started', () => {
        let session = new Session({} as any)
        let _stub = stub(session, '_generateId')

        _stub.onFirstCall().returns('foo')

        assert.equal(session.id, 'foo')
        assert.ok(session.isStarted())
      })
    })

    describe('when the `id` is provided', () => {
      it('should use the given identifier', () => {
        let session = new Session({} as any, 'foo')

        assert.equal(session.id, 'foo')
        assert.ok(!session.isStarted())
      })
    })
  })

  describe('session.pull(key)', () => {
    it('should remove the item from the store', () => {
      let store = new Store({ 'foo': 'bar' })
      let session = new Session({} as any, 'abc', store)

      let value = session.pull('foo')

      assert.equal(value, 'bar')
      assert.ok(store.isEmpty())
    })
  })

  describe('session.start()', () => {
    describe('when the session is started', () => {
      it('should not start again', async () => {
        let session = new Session({} as any)
        let _stub = stub(session, '_read')

        assert.ok(session.isStarted())

        let flag = await session.start()

        assert.equal(flag, false)
        assert.ok(_stub.notCalled)
      })
    })

    describe('when the session is not started', () => {
      it('should read the data from the storage', async () => {
        let session = new Session({} as any, 'abc')
        let _stub = stub(session, '_read')

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
        let session = new Session({} as any, 'abc')
        let _stub = stub(session, '_read')

        _stub.onFirstCall().throws()

        let flag = await session.start()

        assert.ok(session.isStarted())
        assert.ok(_stub.calledOnce)
        assert.equal(flag, true)
      })
    })
  })

  describe('session.commit(force?)', () => {
    // 
  })
})

function _createStorage (): StorageContract {
  return {
    read (key: string): any {},
    remove (key: string): any {},
    write (key: string, data: any, ttl: number): any {}
  }
}
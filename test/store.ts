
import 'mocha'
import * as assert from 'assert'
import { Store } from '../src/_store'

describe('test the state store', () => {
  it('should set state entries', () => {
    let state: any = {}
    let store = new Store(state)

    store.set('foo', 'bar')

    assert.ok(!store.isEmpty())
    assert.equal(state.foo, 'bar')
  })

  it('should return the state entry', () => {
    let state = { foo: 'bar' }
    let store = new Store(state)

    assert.ok(store.has('foo'))
    assert.equal(store.get('foo'), 'bar')
  })

  it('should delete the entry', () => {
    let state = { foo: 'bar' }
    let store = new Store(state)

    store.delete('foo')

    
    assert.ok(store.isEmpty())
    assert.ok(!store.has('foo'))
    assert.equal(store.get('foo'), undefined)
  })

  it('should reset the state entirely', () => {
    let oldState = { 'foo': 'bar' }
    let store = new Store(oldState)

    assert.ok(store.has('foo'))

    store.reset({ 'baz': 123 })

    assert.ok(!store.has('foo'))
    assert.deepEqual(store.toJSON(), { 'baz': 123 })
  })

  it('should merge the values', () => {
    let state = { 'foo': true, 'bar': false }
    let store = new Store(state)

    store.set({ 'bar': 123, baz: false })

    assert.deepEqual(store.toJSON(), {
      foo: true, bar: 123, baz: false
    })
  })
})

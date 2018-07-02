
import 'mocha'
import assert from 'assert'
import { MemoryStorage } from '../../src/storage/memory'

describe('unit test the memory storage', () => {
  it('should mutate the internal map', () => {
    let sid = 'abc'
    let map = new Map()
    let memory = new MemoryStorage(map)

    memory.write(sid, 123, 100)

    assert.ok(map.has(sid))
    assert.equal(map.get(sid)['data'], 123)
  })

  it('should remove the session by `id`', () => {
    let sid = 'abc'
    let map = new Map([[sid, 123]])
    let memory = new MemoryStorage(map)

    assert.ok(map.has(sid))

    memory.destroy(sid)

    assert.ok(!map.has(sid))
  })

  it('should return the stored state', () => {
    let sid = 'abc'
    let map = new Map([[sid, 123]])
    let memory = new MemoryStorage(map)

    assert.equal(memory.read(sid), 123)
  })
})

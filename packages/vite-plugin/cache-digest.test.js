/**
 * Unit tests for Skybolt Cache Digest (Cuckoo Filter)
 *
 * Run with: node --test cache-digest.test.js
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  CuckooFilter,
  createCacheDigest,
  fnv1a,
  fingerprint,
  primaryBucket,
  alternateBucket,
  FINGERPRINT_BITS,
  BUCKET_SIZE,
} from './cache-digest.js'

describe('fnv1a hash function', () => {
  it('should produce consistent hashes', () => {
    const hash1 = fnv1a('test')
    const hash2 = fnv1a('test')
    assert.strictEqual(hash1, hash2)
  })

  it('should produce different hashes for different inputs', () => {
    const hash1 = fnv1a('test1')
    const hash2 = fnv1a('test2')
    assert.notStrictEqual(hash1, hash2)
  })

  it('should handle empty string', () => {
    const hash = fnv1a('')
    assert.strictEqual(typeof hash, 'number')
    assert.ok(hash > 0)
  })

  it('should handle unicode characters', () => {
    const hash = fnv1a('héllo wörld 日本語')
    assert.strictEqual(typeof hash, 'number')
  })
})

describe('fingerprint function', () => {
  it('should produce values in valid range', () => {
    for (let i = 0; i < 100; i++) {
      const fp = fingerprint(`test-${i}`)
      assert.ok(fp >= 1, `fingerprint should be >= 1, got ${fp}`)
      assert.ok(fp < (1 << FINGERPRINT_BITS), `fingerprint should be < ${1 << FINGERPRINT_BITS}, got ${fp}`)
    }
  })

  it('should never produce zero (reserved for empty)', () => {
    // Test many strings to ensure we never get zero
    for (let i = 0; i < 1000; i++) {
      const fp = fingerprint(`item-${i}-${Math.random()}`)
      assert.notStrictEqual(fp, 0, 'fingerprint should never be zero')
    }
  })

  it('should be consistent', () => {
    const fp1 = fingerprint('src/css/main.css:Pw3rT8vL')
    const fp2 = fingerprint('src/css/main.css:Pw3rT8vL')
    assert.strictEqual(fp1, fp2)
  })
})

describe('bucket functions', () => {
  it('primaryBucket should produce values in range', () => {
    const numBuckets = 16
    for (let i = 0; i < 100; i++) {
      const bucket = primaryBucket(`test-${i}`, numBuckets)
      assert.ok(bucket >= 0 && bucket < numBuckets)
    }
  })

  it('alternateBucket should produce values in range', () => {
    const numBuckets = 16
    for (let i = 0; i < 100; i++) {
      const fp = fingerprint(`test-${i}`)
      const b1 = primaryBucket(`test-${i}`, numBuckets)
      const b2 = alternateBucket(b1, fp, numBuckets)
      assert.ok(b2 >= 0 && b2 < numBuckets)
    }
  })

  it('alternateBucket should be reversible', () => {
    const numBuckets = 16
    for (let i = 0; i < 100; i++) {
      const fp = fingerprint(`test-${i}`)
      const b1 = primaryBucket(`test-${i}`, numBuckets)
      const b2 = alternateBucket(b1, fp, numBuckets)
      const b1Again = alternateBucket(b2, fp, numBuckets)
      // Use == instead of === to handle -0 vs 0 edge case
      assert.ok(b1 == b1Again, `alternate bucket operation should be reversible: ${b1} vs ${b1Again}`)
    }
  })
})

describe('CuckooFilter basic operations', () => {
  it('should create filter with correct capacity', () => {
    const filter = new CuckooFilter(100)
    assert.ok(filter.numBuckets >= 25) // At least 100 / 4 buckets
    assert.strictEqual(filter.count, 0)
  })

  it('should insert and lookup items', () => {
    const filter = new CuckooFilter(10)
    const item = 'src/css/main.css:Pw3rT8vL'

    assert.strictEqual(filter.lookup(item), false)
    assert.strictEqual(filter.insert(item), true)
    assert.strictEqual(filter.lookup(item), true)
    assert.strictEqual(filter.count, 1)
  })

  it('should handle multiple insertions', () => {
    const filter = new CuckooFilter(100)
    const items = [
      'src/css/main.css:Pw3rT8vL',
      'src/js/app.js:Km5nR2xQ',
      'src/css/components.css:Ab3cD4eF',
      'src/js/vendor.js:Xy9zW8vU',
    ]

    for (const item of items) {
      assert.strictEqual(filter.insert(item), true)
    }

    for (const item of items) {
      assert.strictEqual(filter.lookup(item), true, `should find ${item}`)
    }

    assert.strictEqual(filter.count, items.length)
  })

  it('should delete items', () => {
    const filter = new CuckooFilter(10)
    const item = 'src/css/main.css:Pw3rT8vL'

    filter.insert(item)
    assert.strictEqual(filter.lookup(item), true)
    assert.strictEqual(filter.count, 1)

    assert.strictEqual(filter.delete(item), true)
    assert.strictEqual(filter.lookup(item), false)
    assert.strictEqual(filter.count, 0)
  })

  it('should return false when deleting non-existent item', () => {
    const filter = new CuckooFilter(10)
    assert.strictEqual(filter.delete('nonexistent'), false)
  })

  it('should handle duplicate insertions', () => {
    const filter = new CuckooFilter(10)
    const item = 'src/css/main.css:Pw3rT8vL'

    filter.insert(item)
    filter.insert(item) // Insert same item again
    assert.strictEqual(filter.lookup(item), true)
    // Note: Cuckoo filters allow duplicates, so count will be 2
    assert.strictEqual(filter.count, 2)
  })
})

describe('CuckooFilter capacity and load', () => {
  it('should handle high load factor', () => {
    const numItems = 100
    const filter = new CuckooFilter(numItems)
    const items = []

    for (let i = 0; i < numItems; i++) {
      items.push(`asset-${i}:hash${i}`)
    }

    let insertedCount = 0
    for (const item of items) {
      if (filter.insert(item)) {
        insertedCount++
      }
    }

    // Should insert most items (expect 90%+ success rate)
    assert.ok(insertedCount >= numItems * 0.9, `Expected >= 90% insertion, got ${insertedCount}/${numItems}`)

    // All inserted items should be findable
    let foundCount = 0
    for (const item of items) {
      if (filter.lookup(item)) {
        foundCount++
      }
    }
    assert.ok(foundCount >= insertedCount, 'All inserted items should be found')
  })

  it('should provide accurate stats', () => {
    const filter = new CuckooFilter(50)
    filter.insert('item1')
    filter.insert('item2')

    const stats = filter.stats
    assert.strictEqual(stats.usedSlots, 2)
    assert.strictEqual(stats.bucketSize, BUCKET_SIZE)
    assert.strictEqual(stats.fingerprintBits, FINGERPRINT_BITS)
    assert.ok(stats.estimatedFalsePositiveRate < 0.01) // Should be low
  })
})

describe('CuckooFilter serialization', () => {
  it('should serialize to binary', () => {
    const filter = new CuckooFilter(10)
    filter.insert('src/css/main.css:Pw3rT8vL')
    filter.insert('src/js/app.js:Km5nR2xQ')

    const bytes = filter.serialize()
    assert.ok(bytes instanceof Uint8Array)
    assert.ok(bytes.length >= 5) // At least header size
    assert.strictEqual(bytes[0], 1) // Version
  })

  it('should deserialize from binary', () => {
    const filter = new CuckooFilter(10)
    const items = ['src/css/main.css:Pw3rT8vL', 'src/js/app.js:Km5nR2xQ']
    for (const item of items) {
      filter.insert(item)
    }

    const bytes = filter.serialize()
    const restored = CuckooFilter.deserialize(bytes)

    assert.strictEqual(restored.numBuckets, filter.numBuckets)
    assert.strictEqual(restored.count, filter.count)

    for (const item of items) {
      assert.strictEqual(restored.lookup(item), true, `should find ${item} after deserialize`)
    }
  })

  it('should serialize to base64', () => {
    const filter = new CuckooFilter(10)
    filter.insert('test-item')

    const base64 = filter.toBase64()
    assert.strictEqual(typeof base64, 'string')
    assert.ok(base64.length > 0)
    // Should be URL-safe (no +, /, or =)
    assert.ok(!base64.includes('+'))
    assert.ok(!base64.includes('/'))
    assert.ok(!base64.includes('='))
  })

  it('should deserialize from base64', () => {
    const filter = new CuckooFilter(10)
    const items = ['item1:hash1', 'item2:hash2', 'item3:hash3']
    for (const item of items) {
      filter.insert(item)
    }

    const base64 = filter.toBase64()
    const restored = CuckooFilter.fromBase64(base64)

    for (const item of items) {
      assert.strictEqual(restored.lookup(item), true)
    }
  })

  it('should handle round-trip serialization with many items', () => {
    const numItems = 50
    const filter = new CuckooFilter(numItems)
    const items = []

    for (let i = 0; i < numItems; i++) {
      const item = `src/assets/file-${i}.js:hash${i.toString(16)}`
      items.push(item)
      filter.insert(item)
    }

    const base64 = filter.toBase64()
    const restored = CuckooFilter.fromBase64(base64)

    let foundCount = 0
    for (const item of items) {
      if (restored.lookup(item)) {
        foundCount++
      }
    }

    // All items should survive serialization
    assert.strictEqual(foundCount, numItems)
  })

  it('should reject invalid version', () => {
    const bytes = new Uint8Array([99, 0, 16, 0, 5]) // Invalid version 99
    assert.throws(() => CuckooFilter.deserialize(bytes), /Invalid cache digest version/)
  })

  it('should reject too-short buffer', () => {
    const bytes = new Uint8Array([1, 0]) // Too short
    assert.throws(() => CuckooFilter.deserialize(bytes), /too short/)
  })
})

describe('CuckooFilter false positive rate', () => {
  it('should have low false positive rate', () => {
    // Use a smaller load factor for predictable FP rate testing
    const numItems = 50
    const filter = new CuckooFilter(numItems * 2) // 50% load factor

    // Insert items
    let insertedCount = 0
    for (let i = 0; i < numItems; i++) {
      if (filter.insert(`inserted-${i}`)) {
        insertedCount++
      }
    }

    // Check false positive rate on items that were NOT inserted
    let falsePositives = 0
    const numTests = 10000

    for (let i = 0; i < numTests; i++) {
      if (filter.lookup(`not-inserted-${i}`)) {
        falsePositives++
      }
    }

    const fpRate = falsePositives / numTests
    // With 12-bit fingerprints and bucket size 4, theoretical FP rate is ~0.2%
    // In practice, we check 2 buckets with 4 entries each = 8 comparisons
    // Expected: 8 / 4096 ≈ 0.2%, allow up to 3% for statistical variation and hash collisions
    assert.ok(fpRate < 0.03, `False positive rate ${(fpRate * 100).toFixed(2)}% exceeds 3%`)
    console.log(`    Inserted ${insertedCount}/${numItems} items, False positive rate: ${(fpRate * 100).toFixed(3)}%`)
  })

  it('should have ZERO false negatives', () => {
    const numItems = 200
    const filter = new CuckooFilter(numItems)
    const insertedItems = []

    // Insert items, tracking which ones succeeded
    for (let i = 0; i < numItems; i++) {
      const item = `item-${i}:hash${i}`
      if (filter.insert(item)) {
        insertedItems.push(item)
      }
    }

    // Every SUCCESSFULLY inserted item MUST be found
    let falseNegatives = 0
    for (const item of insertedItems) {
      if (!filter.lookup(item)) {
        falseNegatives++
      }
    }

    assert.ok(insertedItems.length > numItems * 0.9, `Should insert at least 90% of items, got ${insertedItems.length}`)
    assert.strictEqual(falseNegatives, 0, 'Must have zero false negatives for successfully inserted items')
  })
})

describe('createCacheDigest helper', () => {
  it('should create filter from asset list', () => {
    const assets = [
      'src/css/main.css:Pw3rT8vL',
      'src/js/app.js:Km5nR2xQ',
      'src/css/components.css:Ab3cD4eF',
    ]

    const filter = createCacheDigest(assets)

    for (const asset of assets) {
      assert.strictEqual(filter.lookup(asset), true)
    }
  })

  it('should handle empty list', () => {
    const filter = createCacheDigest([])
    assert.strictEqual(filter.count, 0)
  })

  it('should auto-resize if needed', () => {
    // Create many items to potentially trigger resize
    const assets = []
    for (let i = 0; i < 500; i++) {
      assets.push(`asset-${i}:hash${i}`)
    }

    const filter = createCacheDigest(assets)

    // Should contain all items
    let found = 0
    for (const asset of assets) {
      if (filter.lookup(asset)) found++
    }

    assert.ok(found >= assets.length * 0.95, 'Should find at least 95% of items')
  })
})

describe('CuckooFilter size efficiency', () => {
  it('should be much smaller than plain text', () => {
    const assets = []
    for (let i = 0; i < 20; i++) {
      // Realistic asset names
      assets.push(`src/components/Component${i}/style.css:a1b2c3d${i}`)
    }

    const filter = createCacheDigest(assets)
    const base64 = filter.toBase64()

    // Plain text format: "name:hash,name:hash,..."
    const plainText = assets.join(',')
    const plainTextEncoded = encodeURIComponent(plainText)

    console.log(`    ${assets.length} assets:`)
    console.log(`    - Plain text encoded: ${plainTextEncoded.length} bytes`)
    console.log(`    - Cache digest base64: ${base64.length} bytes`)
    console.log(`    - Compression ratio: ${(base64.length / plainTextEncoded.length * 100).toFixed(1)}%`)

    // Cache digest should be significantly smaller
    assert.ok(
      base64.length < plainTextEncoded.length,
      `Cache digest (${base64.length}) should be smaller than plain text (${plainTextEncoded.length})`
    )
  })

  it('should scale well with many assets', () => {
    const sizes = [10, 50, 100, 200]
    const results = []

    for (const size of sizes) {
      const assets = []
      for (let i = 0; i < size; i++) {
        assets.push(`src/assets/file-${i}.js:hash${i.toString(16).padStart(8, '0')}`)
      }

      const filter = createCacheDigest(assets)
      const base64 = filter.toBase64()
      const plainText = encodeURIComponent(assets.join(','))

      results.push({
        numAssets: size,
        digestSize: base64.length,
        plainTextSize: plainText.length,
        ratio: (base64.length / plainText.length * 100).toFixed(1) + '%',
      })
    }

    console.log('    Size comparison:')
    console.table(results)

    // Larger sets should show better compression ratios
    // (filter overhead becomes less significant)
    const last = results[results.length - 1]
    assert.ok(
      last.digestSize < last.plainTextSize * 0.5,
      'Large asset sets should achieve >50% compression'
    )
  })
})

describe('CuckooFilter edge cases', () => {
  it('should handle special characters in asset names', () => {
    const filter = new CuckooFilter(10)
    const specialItems = [
      'path/with spaces/file.css:hash1',
      'path/with:colon/file.js:hash2',
      'path/with=equals/file.ts:hash3',
      'path/with%percent/file.tsx:hash4',
      'path/日本語/file.css:hash5',
    ]

    for (const item of specialItems) {
      assert.strictEqual(filter.insert(item), true)
    }

    for (const item of specialItems) {
      assert.strictEqual(filter.lookup(item), true, `should find ${item}`)
    }
  })

  it('should handle very long asset names', () => {
    const filter = new CuckooFilter(10)
    const longPath = 'a'.repeat(500) + ':' + 'hash12345678'

    filter.insert(longPath)
    assert.strictEqual(filter.lookup(longPath), true)
  })

  it('should handle minimum capacity', () => {
    const filter = new CuckooFilter(1)
    filter.insert('single-item:hash')
    assert.strictEqual(filter.lookup('single-item:hash'), true)
  })
})

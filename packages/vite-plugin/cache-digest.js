/**
 * Skybolt Cache Digest - Cuckoo Filter Implementation
 *
 * A space-efficient probabilistic data structure for tracking cached assets.
 * Instead of storing "asset:hash" pairs (~40+ bytes each), we store fingerprints
 * in a Cuckoo filter (~2 bytes per asset) with configurable false positive rate.
 *
 * Key properties:
 * - No false negatives: if an asset is cached, the filter will always report it
 * - Small false positive rate: ~1-3% chance of reporting uncached assets as cached
 * - Compact: ~2 bytes per asset vs ~40+ bytes for full serialization
 * - Supports deletion: unlike Bloom filters, items can be removed
 *
 * For Skybolt, false positives mean occasionally serving external links for
 * uncached assets (browser fetches from network) - a minor performance hit.
 * False negatives would be worse (inlining already-cached assets).
 */

// Constants for the Cuckoo filter
const FINGERPRINT_BITS = 12 // ~0.1% false positive rate with bucket size 4
const BUCKET_SIZE = 4 // 4 entries per bucket (good fill rate ~95%)
const MAX_KICKS = 500 // Max relocations before declaring full
const EMPTY_FINGERPRINT = 0 // 0 means empty slot

/**
 * Simple non-cryptographic hash function (FNV-1a variant)
 * Uses BigInt for precise 32-bit arithmetic (matches PHP implementation)
 */
function fnv1a(str) {
  let hash = 2166136261n // FNV offset basis
  const prime = 16777619n
  const mask = 0xFFFFFFFFn

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i))
    hash = (hash * prime) & mask
  }

  return Number(hash)
}

/**
 * Generate a fingerprint from a string (asset key like "src/css/main.css:Pw3rT8vL")
 * Returns a non-zero value in range [1, 2^FINGERPRINT_BITS - 1]
 */
function fingerprint(str) {
  const hash = fnv1a(str)
  // Take lower bits, ensure non-zero (0 means empty)
  const fp = (hash & ((1 << FINGERPRINT_BITS) - 1)) || 1
  return fp
}

/**
 * Compute primary bucket index from string
 */
function primaryBucket(str, numBuckets) {
  const hash = fnv1a(str)
  return hash % numBuckets
}

/**
 * Compute alternate bucket using partial-key cuckoo hashing
 * bucket2 = bucket1 XOR hash(fingerprint)
 * This allows finding the other bucket from just the fingerprint
 *
 * IMPORTANT: This must be reversible - alternateBucket(alternateBucket(b, fp), fp) == b
 * Since numBuckets is always a power of 2, we can use XOR with a masked hash
 */
function alternateBucket(bucket, fp, numBuckets) {
  // Hash the fingerprint to get good distribution
  const fpHash = fnv1a(String(fp))
  // Mask to valid bucket range (numBuckets is power of 2)
  const bucketMask = numBuckets - 1
  // XOR with masked hash - this is reversible since (a ^ b) ^ b == a
  // Use | 1 to ensure we always move (avoid XOR with 0)
  const offset = (fpHash | 1) & bucketMask
  return (bucket ^ offset) & bucketMask
}

/**
 * CuckooFilter class - a space-efficient probabilistic set
 */
export class CuckooFilter {
  /**
   * Create a new Cuckoo filter
   * @param {number} capacity - Expected number of items (will be rounded up)
   */
  constructor(capacity = 64) {
    // Calculate number of buckets needed
    // With 95% fill rate and bucket size 4, we need capacity / (4 * 0.95) buckets
    // Round up to power of 2 for faster modulo (can use bitmask)
    const minBuckets = Math.ceil(capacity / (BUCKET_SIZE * 0.95))
    this.numBuckets = nextPowerOf2(Math.max(minBuckets, 4))
    this.bucketMask = this.numBuckets - 1

    // Initialize buckets as flat Uint16Array for efficiency
    // Each bucket has BUCKET_SIZE slots
    this.buckets = new Uint16Array(this.numBuckets * BUCKET_SIZE)
    this.count = 0
  }

  /**
   * Insert an item into the filter
   * @param {string} item - The item to insert (e.g., "src/css/main.css:Pw3rT8vL")
   * @returns {boolean} - True if inserted, false if filter is full
   */
  insert(item) {
    const fp = fingerprint(item)
    const i1 = primaryBucket(item, this.numBuckets)
    const i2 = alternateBucket(i1, fp, this.numBuckets)

    // Try to insert in bucket i1
    if (this._insertIntoBucket(i1, fp)) {
      this.count++
      return true
    }

    // Try to insert in bucket i2
    if (this._insertIntoBucket(i2, fp)) {
      this.count++
      return true
    }

    // Both buckets full, need to relocate
    // Save state in case we need to rollback
    const savedBuckets = this.buckets.slice()

    // Randomly pick one of the two buckets to start eviction chain
    let bucket = Math.random() < 0.5 ? i1 : i2
    let currentFp = fp

    for (let kick = 0; kick < MAX_KICKS; kick++) {
      // Pick a random slot in the bucket to evict
      const slotIndex = Math.floor(Math.random() * BUCKET_SIZE)
      const bucketOffset = bucket * BUCKET_SIZE

      // Swap fingerprints
      const evictedFp = this.buckets[bucketOffset + slotIndex]
      this.buckets[bucketOffset + slotIndex] = currentFp
      currentFp = evictedFp

      // Find alternate bucket for evicted fingerprint
      bucket = alternateBucket(bucket, currentFp, this.numBuckets)

      // Try to insert evicted fingerprint
      if (this._insertIntoBucket(bucket, currentFp)) {
        this.count++
        return true
      }
    }

    // Filter is too full - rollback changes and report failure
    this.buckets.set(savedBuckets)
    return false
  }

  /**
   * Check if an item might be in the filter
   * @param {string} item - The item to look up
   * @returns {boolean} - True if item might be present (possible false positive),
   *                      False if item is definitely not present
   */
  lookup(item) {
    const fp = fingerprint(item)
    const i1 = primaryBucket(item, this.numBuckets)
    const i2 = alternateBucket(i1, fp, this.numBuckets)

    return this._bucketContains(i1, fp) || this._bucketContains(i2, fp)
  }

  /**
   * Remove an item from the filter
   * @param {string} item - The item to remove
   * @returns {boolean} - True if removed, false if not found
   */
  delete(item) {
    const fp = fingerprint(item)
    const i1 = primaryBucket(item, this.numBuckets)
    const i2 = alternateBucket(i1, fp, this.numBuckets)

    if (this._removeFromBucket(i1, fp)) {
      this.count--
      return true
    }

    if (this._removeFromBucket(i2, fp)) {
      this.count--
      return true
    }

    return false
  }

  /**
   * Serialize the filter to a compact binary format
   * Format: [version:1][numBuckets:2][count:2][fingerprints as 16-bit values...]
   * Using 16-bit storage for simplicity (only 33% overhead vs 12-bit packing)
   * @returns {Uint8Array} - Serialized filter
   */
  serialize() {
    // Header: version (1 byte) + numBuckets (2 bytes) + count (2 bytes) = 5 bytes
    // Data: numBuckets * BUCKET_SIZE fingerprints as 16-bit big-endian values
    const numFingerprints = this.numBuckets * BUCKET_SIZE
    const buffer = new Uint8Array(5 + numFingerprints * 2)

    // Write header
    buffer[0] = 1 // Version
    buffer[1] = (this.numBuckets >> 8) & 0xff
    buffer[2] = this.numBuckets & 0xff
    buffer[3] = (this.count >> 8) & 0xff
    buffer[4] = this.count & 0xff

    // Write fingerprints as 16-bit big-endian values
    for (let i = 0; i < numFingerprints; i++) {
      const fp = this.buckets[i]
      const offset = 5 + i * 2
      buffer[offset] = (fp >> 8) & 0xff
      buffer[offset + 1] = fp & 0xff
    }

    return buffer
  }

  /**
   * Serialize to base64 string (for cookie storage)
   * @returns {string} - Base64-encoded filter (URL-safe)
   */
  toBase64() {
    const bytes = this.serialize()
    // Use URL-safe base64 (replace + with -, / with _)
    // Works in both browser and Node.js
    if (typeof Buffer !== 'undefined' && typeof btoa === 'undefined') {
      // Node.js environment without btoa
      return Buffer.from(bytes).toString('base64url')
    }
    // Browser or Node.js 16+ with btoa
    const binary = String.fromCharCode(...bytes)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  /**
   * Deserialize from binary format
   * @param {Uint8Array} buffer - Serialized filter
   * @returns {CuckooFilter} - Restored filter
   */
  static deserialize(buffer) {
    if (buffer.length < 5) {
      throw new Error('Invalid cache digest: too short')
    }

    const version = buffer[0]
    if (version !== 1) {
      throw new Error(`Invalid cache digest version: ${version}`)
    }

    const numBuckets = (buffer[1] << 8) | buffer[2]
    const count = (buffer[3] << 8) | buffer[4]

    // Create filter with correct size
    const filter = new CuckooFilter(numBuckets * BUCKET_SIZE)
    filter.numBuckets = numBuckets
    filter.bucketMask = numBuckets - 1
    filter.buckets = new Uint16Array(numBuckets * BUCKET_SIZE)
    filter.count = count

    // Read fingerprints as 16-bit big-endian values
    const numFingerprints = numBuckets * BUCKET_SIZE
    for (let i = 0; i < numFingerprints; i++) {
      const offset = 5 + i * 2
      if (offset + 1 < buffer.length) {
        filter.buckets[i] = (buffer[offset] << 8) | buffer[offset + 1]
      }
    }

    return filter
  }

  /**
   * Deserialize from base64 string
   * @param {string} base64 - Base64-encoded filter
   * @returns {CuckooFilter} - Restored filter
   */
  static fromBase64(base64) {
    // Handle URL-safe base64
    let normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    while (normalized.length % 4) {
      normalized += '='
    }

    let bytes
    if (typeof atob !== 'undefined') {
      const binary = atob(normalized)
      bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
    } else {
      // Node.js environment
      bytes = new Uint8Array(Buffer.from(base64, 'base64url'))
    }

    return CuckooFilter.deserialize(bytes)
  }

  // Private helper methods

  _insertIntoBucket(bucketIndex, fp) {
    const offset = bucketIndex * BUCKET_SIZE
    for (let i = 0; i < BUCKET_SIZE; i++) {
      if (this.buckets[offset + i] === EMPTY_FINGERPRINT) {
        this.buckets[offset + i] = fp
        return true
      }
    }
    return false
  }

  _bucketContains(bucketIndex, fp) {
    const offset = bucketIndex * BUCKET_SIZE
    for (let i = 0; i < BUCKET_SIZE; i++) {
      if (this.buckets[offset + i] === fp) {
        return true
      }
    }
    return false
  }

  _removeFromBucket(bucketIndex, fp) {
    const offset = bucketIndex * BUCKET_SIZE
    for (let i = 0; i < BUCKET_SIZE; i++) {
      if (this.buckets[offset + i] === fp) {
        this.buckets[offset + i] = EMPTY_FINGERPRINT
        return true
      }
    }
    return false
  }

  /**
   * Get filter statistics
   */
  get stats() {
    const totalSlots = this.numBuckets * BUCKET_SIZE
    const usedSlots = this.count
    return {
      numBuckets: this.numBuckets,
      bucketSize: BUCKET_SIZE,
      totalSlots,
      usedSlots,
      loadFactor: usedSlots / totalSlots,
      fingerprintBits: FINGERPRINT_BITS,
      estimatedFalsePositiveRate: Math.pow(2, -FINGERPRINT_BITS) * BUCKET_SIZE * 2,
      serializedSizeBytes: 5 + totalSlots * 2, // 5 byte header + 2 bytes per slot
    }
  }
}

/**
 * Round up to next power of 2
 */
function nextPowerOf2(n) {
  n--
  n |= n >> 1
  n |= n >> 2
  n |= n >> 4
  n |= n >> 8
  n |= n >> 16
  return n + 1
}

/**
 * Create a cache digest from a list of asset keys
 * @param {string[]} assetKeys - Array of "name:hash" strings
 * @returns {CuckooFilter} - Populated filter
 */
export function createCacheDigest(assetKeys) {
  const filter = new CuckooFilter(assetKeys.length)
  for (const key of assetKeys) {
    if (!filter.insert(key)) {
      // Filter is full, create a larger one
      const largerFilter = new CuckooFilter(assetKeys.length * 2)
      for (const k of assetKeys) {
        largerFilter.insert(k)
      }
      return largerFilter
    }
  }
  return filter
}

// Export for testing
export { fnv1a, fingerprint, primaryBucket, alternateBucket, FINGERPRINT_BITS, BUCKET_SIZE }

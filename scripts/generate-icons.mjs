/**
 * Simple PNG icon generator for ReleasePulse.
 * Generates solid-color rounded square icons with a bell shape.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(__dirname, '..', 'src', 'assets')

/** Create a simple RGBA PNG from pixel data. */
function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
    return Buffer.concat([length, typeBuf, data, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type (RGBA)
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const rawData = Buffer.alloc(height * (1 + width * 4))
  let offset = 0
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      rawData[offset++] = pixels[idx]     // R
      rawData[offset++] = pixels[idx + 1] // G
      rawData[offset++] = pixels[idx + 2] // B
      rawData[offset++] = pixels[idx + 3] // A
    }
  }

  const compressed = deflateSync(rawData)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** CRC32 lookup table. */
const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c = c >>> 1
  }
  crcTable[n] = c
}

/** Compute CRC32. */
function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Generate icon pixels: blue rounded square with a white bell. */
function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= radius) {
        // Blue background
        pixels[idx] = 0x25     // R
        pixels[idx + 1] = 0x63 // G
        pixels[idx + 2] = 0xeb // B
        pixels[idx + 3] = 0xff // A

        // Draw a simple bell shape
        const bellCx = cx
        const bellCy = cy - size * 0.02
        const bellW = size * 0.18
        const bellH = size * 0.22

        // Bell body (ellipse)
        const bdx = (x - bellCx) / bellW
        const bdy = (y - bellCy) / bellH
        const bdist = bdx * bdx + bdy * bdy

        if (bdist <= 1 && y < cy + size * 0.1) {
          pixels[idx] = 0xff
          pixels[idx + 1] = 0xff
          pixels[idx + 2] = 0xff
        }

        // Bell clapper (small circle below)
        const clapperDx = x - bellCx
        const clapperDy = y - (cy + size * 0.12)
        const clapperDist = Math.sqrt(clapperDx * clapperDx + clapperDy * clapperDy)
        if (clapperDist <= size * 0.06) {
          pixels[idx] = 0xff
          pixels[idx + 1] = 0xff
          pixels[idx + 2] = 0xff
        }
      } else {
        // Transparent
        pixels[idx + 3] = 0
      }
    }
  }

  return pixels
}

// Generate icons
mkdirSync(assetsDir, { recursive: true })

for (const size of [16, 48, 128]) {
  const pixels = generateIcon(size)
  const png = createPNG(size, size, pixels)
  const filepath = join(assetsDir, `icon-${size}.png`)
  writeFileSync(filepath, png)
  console.log(`Generated: ${filepath} (${png.length} bytes)`)
}

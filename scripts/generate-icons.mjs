/**
 * PNG icon generator for ReleasePulse.
 * Draws indigo rounded square with pulse-wave + release arrow motif.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(__dirname, '..', 'src', 'assets')

const BRAND = { r: 0x43, g: 0x38, b: 0xca }
const ACCENT = { r: 0xff, g: 0x6b, b: 0x4a }
const WHITE = { r: 0xff, g: 0xff, b: 0xff }

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
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rawData = Buffer.alloc(height * (1 + width * 4))
  let offset = 0
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      rawData[offset++] = pixels[idx]
      rawData[offset++] = pixels[idx + 1]
      rawData[offset++] = pixels[idx + 2]
      rawData[offset++] = pixels[idx + 3]
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

const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c = c >>> 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function setPixel(pixels, size, x, y, color, alpha = 255) {
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || iy < 0 || ix >= size || iy >= size) return
  const idx = (iy * size + ix) * 4
  pixels[idx] = color.r
  pixels[idx + 1] = color.g
  pixels[idx + 2] = color.b
  pixels[idx + 3] = alpha
}

function drawLine(pixels, size, x0, y0, x1, y1, color, thickness) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = lerp(x0, x1, t)
    const y = lerp(y0, y1, t)
    for (let dx = -thickness; dx <= thickness; dx++) {
      for (let dy = -thickness; dy <= thickness; dy++) {
        if (dx * dx + dy * dy <= thickness * thickness) {
          setPixel(pixels, size, x + dx, y + dy, color)
        }
      }
    }
  }
}

/** Generate icon pixels: gradient rounded square with pulse wave + arrow. */
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
        const t = (x - (cx - radius)) / (radius * 2)
        pixels[idx] = Math.round(lerp(BRAND.r, ACCENT.r, t * 0.35))
        pixels[idx + 1] = Math.round(lerp(BRAND.g, ACCENT.g, t * 0.35))
        pixels[idx + 2] = Math.round(lerp(BRAND.b, ACCENT.b, t * 0.35))
        pixels[idx + 3] = 0xff
      }
    }
  }

  const thickness = Math.max(1, size * 0.045)
  const yBase = cy + size * 0.02
  const xStart = cx - size * 0.22
  const xMid = cx - size * 0.06
  const xPeak = cx + size * 0.02
  const xEnd = cx + size * 0.22

  drawLine(pixels, size, xStart, yBase, xMid, yBase, WHITE, thickness)
  drawLine(pixels, size, xMid, yBase, xPeak, cy - size * 0.12, WHITE, thickness)
  drawLine(pixels, size, xPeak, cy - size * 0.12, xEnd, yBase - size * 0.08, WHITE, thickness)

  const arrowX = cx + size * 0.18
  const arrowY = cy - size * 0.06
  const arrowSize = size * 0.08
  drawLine(pixels, size, arrowX, arrowY - arrowSize, arrowX, arrowY + arrowSize * 0.3, WHITE, thickness)
  drawLine(pixels, size, arrowX - arrowSize * 0.6, arrowY - arrowSize * 0.2, arrowX, arrowY - arrowSize, WHITE, thickness)
  drawLine(pixels, size, arrowX + arrowSize * 0.6, arrowY - arrowSize * 0.2, arrowX, arrowY - arrowSize, WHITE, thickness)

  return pixels
}

mkdirSync(assetsDir, { recursive: true })

for (const iconSize of [16, 48, 128]) {
  const pixels = generateIcon(iconSize)
  const png = createPNG(iconSize, iconSize, pixels)
  const filepath = join(assetsDir, `icon-${iconSize}.png`)
  writeFileSync(filepath, png)
  console.log(`Generated: ${filepath} (${png.length} bytes)`)
}

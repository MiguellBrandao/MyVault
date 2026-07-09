// Gera os ícones da PWA a partir de um SVG (porta de cofre estilizada).
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const INK = '#0C1512'
const INK_LIGHT = '#14231D'
const BRASS = '#D9AC6B'

/** Porta de cofre: anel exterior + roda de 4 raios + eixo central. */
function vaultSvg(size, { padding = 0, rounded = 0 } = {}) {
  const c = size / 2
  const scale = (size - padding * 2) / 512
  const rOuter = 172 * scale
  const rHub = 46 * scale
  const spokeLen = 150 * scale
  const stroke = 30 * scale
  const spokes = [45, 135, 225, 315]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180
      const x2 = c + Math.cos(rad) * spokeLen
      const y2 = c + Math.sin(rad) * spokeLen
      return `<line x1="${c}" y1="${c}" x2="${x2}" y2="${y2}" stroke="${BRASS}" stroke-width="${stroke}" stroke-linecap="round"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="${INK_LIGHT}"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rounded}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="${rOuter}" fill="none" stroke="${BRASS}" stroke-width="${stroke}"/>
  ${spokes}
  <circle cx="${c}" cy="${c}" r="${rHub}" fill="${BRASS}"/>
</svg>`
}

await mkdir('public', { recursive: true })

const outputs = [
  ['public/icon-512.png', vaultSvg(512)],
  ['public/icon-192.png', vaultSvg(192)],
  // Maskable: marca reduzida para a zona segura (80% central).
  ['public/icon-512-maskable.png', vaultSvg(512, { padding: 80 })],
  ['public/apple-touch-icon.png', vaultSvg(180)],
]

for (const [file, svg] of outputs) {
  await sharp(Buffer.from(svg)).png().toFile(file)
  console.log('✓', file)
}

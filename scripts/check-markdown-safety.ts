import { inl } from '../lib/article-markdown'
import { safeUrl } from '../lib/html-safe'

/**
 * Breakout NYATA = tanda kutip struktural yang langsung diikuti nama atribut
 * event. Semua kutip dari input pengguna sudah menjadi &quot;, sehingga setiap
 * `"` yang tersisa adalah pembatas atribut milik kita sendiri.
 */
function hasRealBreakout(html: string): boolean {
  if (/"\s+on\w+\s*=/i.test(html)) return true          // atribut event asli
  if (/(?:href|src)\s*=\s*"\s*(?:javascript|data|vbscript):/i.test(html)) return true
  return false
}

const attacks: [string, string][] = [
  ['img attr breakout',     '![x](" onerror="alert(1))'],
  ['link attr breakout',    '[klik](" onmouseover="alert(1))'],
  ['alt attr breakout',     '![" onerror="alert(1)](https://ok.com/a.jpg)'],
  ['javascript: link',      '[klik](javascript:alert(1))'],
  ['obfuscated javascript', '[klik](java\tscript:alert(1))'],
  ['uppercase javascript',  '[klik](JaVaScRiPt:alert(1))'],
  ['data: uri image',       '![x](data:text/html;base64,PHNjcmlwdD4=)'],
  ['vbscript link',         '[klik](vbscript:msgbox)'],
]

const legits: [string, string, string][] = [
  ['https link',   '[Google](https://google.com)',              'https://google.com'],
  ['relative link','[Beranda](/blog)',                          '/blog'],
  ['anchor link',  '[Bab 2](#bab-2)',                           '#bab-2'],
  ['image',        '![foto](https://cdn.example.com/a.jpg)',    'https://cdn.example.com/a.jpg'],
  ['mailto',       '[Email](mailto:halo@iaundang.online)',      'mailto:halo@iaundang.online'],
]

let failures = 0

console.log('--- SERANGAN (harus diblokir) ---')
for (const [label, input] of attacks) {
  const out = inl(input)
  const bad = hasRealBreakout(out)
  if (bad) { failures++; console.log(`  FAIL  ${label}\n        ${out}`) }
  else console.log(`  ok    ${label}`)
}

console.log('\n--- SAH (harus tetap jalan) ---')
for (const [label, input, expectUrl] of legits) {
  const out = inl(input)
  const preserved = out.includes(expectUrl)
  const bad = hasRealBreakout(out)
  if (!preserved || bad) { failures++; console.log(`  FAIL  ${label}\n        ${out}`) }
  else console.log(`  ok    ${label}  -> ${expectUrl}`)
}

console.log('\n--- safeUrl ---')
for (const u of ['javascript:alert(1)', 'data:text/html,x', 'https://ok.com', '/rel', '#a', 'example.com/x']) {
  console.log(`  ${JSON.stringify(u).padEnd(24)} -> ${JSON.stringify(safeUrl(u))}`)
}

console.log(failures === 0 ? '\nSEMUA LULUS' : `\n${failures} GAGAL`)
process.exit(failures === 0 ? 0 : 1)

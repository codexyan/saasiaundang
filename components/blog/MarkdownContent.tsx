'use client'

import { parseLinkParts } from '@/lib/article-markdown'
import { escapeHtml, escapeAttribute, safeUrlAttribute } from '@/lib/html-safe'

function parseMarkdown(md: string): string {
  const lines = md.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    // Table detection: line with | and next line is separator |---|
    if (lines[i].includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1])) {
      const headerCells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
      const alignLine = lines[i + 1].split('|').map(c => c.trim()).filter(Boolean)
      const aligns = alignLine.map(c => {
        if (c.startsWith(':') && c.endsWith(':')) return 'center'
        if (c.endsWith(':')) return 'right'
        return 'left'
      })
      let table = '<table><thead><tr>'
      headerCells.forEach((cell, ci) => {
        table += `<th style="text-align:${aligns[ci] || 'left'}">${inlineFormat(esc(cell))}</th>`
      })
      table += '</tr></thead><tbody>'
      i += 2
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
        table += '<tr>'
        cells.forEach((cell, ci) => {
          table += `<td style="text-align:${aligns[ci] || 'left'}">${inlineFormat(esc(cell))}</td>`
        })
        table += '</tr>'
        i++
      }
      table += '</tbody></table>'
      output.push(table)
      continue
    }

    const line = lines[i]

    // Headings
    if (line.startsWith('### ')) { output.push(`<h3>${inlineFormat(esc(line.slice(4)))}</h3>`); i++; continue }
    if (line.startsWith('## ')) { output.push(`<h2>${inlineFormat(esc(line.slice(3)))}</h2>`); i++; continue }
    if (line.startsWith('# ')) { output.push(`<h1>${inlineFormat(esc(line.slice(2)))}</h1>`); i++; continue }

    // HR
    if (/^---+$/.test(line.trim())) { output.push('<hr />'); i++; continue }

    // Image (standalone line)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      output.push(`<figure><img src="${esc(imgMatch[2])}" alt="${esc(imgMatch[1])}" loading="lazy" />${imgMatch[1] ? `<figcaption>${esc(imgMatch[1])}</figcaption>` : ''}</figure>`)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) { output.push(`<blockquote>${inlineFormat(esc(line.slice(2)))}</blockquote>`); i++; continue }

    // Unordered list
    if (/^[-*] /.test(line)) {
      let list = '<ul>'
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        list += `<li>${inlineFormat(esc(lines[i].replace(/^[-*] /, '')))}</li>`
        i++
      }
      list += '</ul>'
      output.push(list)
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      let list = '<ol>'
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        list += `<li>${inlineFormat(esc(lines[i].replace(/^\d+\. /, '')))}</li>`
        i++
      }
      list += '</ol>'
      output.push(list)
      continue
    }

    // Empty line
    if (line.trim() === '') { i++; continue }

    // Paragraph (collect consecutive non-empty non-special lines)
    let para = ''
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,3} |^[-*] |^\d+\. |^> |^---+$|^!\[/.test(lines[i]) && !isTableStart(lines, i)) {
      if (para) para += ' '
      para += lines[i]
      i++
    }
    if (para) output.push(`<p>${inlineFormat(esc(para))}</p>`)
  }

  return output.join('\n')
}

function isTableStart(lines: string[], i: number): boolean {
  return lines[i].includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1])
}

const esc = escapeHtml

function inlineFormat(s: string): string {
  return s
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_m, alt: string, src: string) =>
        `<img src="${safeUrlAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" class="inline-image" />`
    )
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t: string, h: string) => {
      const { href, target, rel } = parseLinkParts(h)
      return `<a href="${href}"${target}${rel}>${t}</a>`
    })
}

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
}

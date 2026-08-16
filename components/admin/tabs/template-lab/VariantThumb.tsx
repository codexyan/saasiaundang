/**
 * Mini-mockup visual per variant section, memakai warna template aktif.
 *
 * Dipindah verbatim dari TemplateLab.tsx. Sepenuhnya mandiri: murni fungsi
 * dari propsnya (type/variant + 3 warna), tanpa state, tanpa ikon, tanpa
 * satu pun identifier dari luar — diverifikasi sebelum dipindah.
 */
//  Variant Thumbnail 
// Mini-mockup visual per variant menggunakan warna template aktif
export default function VariantThumb({ type, variant, p, a, t }: { type: string; variant: string; p: string; a: string; t: string }) {
  const base: React.CSSProperties = { width: 54, height: 76, backgroundColor: p, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', display: 'flex', flexDirection: 'column' }
  const heroBase: React.CSSProperties = { width: 72, height: 100, backgroundColor: p, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative', display: 'flex', flexDirection: 'column' }

  if (type === 'hero') {
    // Default — centered symmetric: bismillah → divider → names → divider → scroll
    if (variant === 'default') return (
      <div style={heroBase}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <div style={{ fontSize: 4.5, letterSpacing: 1.5, color: `${a}aa`, lineHeight: 1, marginBottom: 5 }}>بسم</div>
          <div style={{ width: 24, height: 0.5, backgroundColor: `${a}66`, marginBottom: 6 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: t, lineHeight: 1, letterSpacing: -0.3 }}>A</div>
          <div style={{ fontSize: 6, fontStyle: 'italic', color: a, lineHeight: 1, margin: '3px 0' }}>&amp;</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t, lineHeight: 1, letterSpacing: -0.3 }}>B</div>
          <div style={{ width: 24, height: 0.5, backgroundColor: `${a}66`, marginTop: 6 }} />
          <div style={{ fontSize: 3.5, letterSpacing: 1, color: `${t}44`, lineHeight: 1, marginTop: 8 }}>SCROLL</div>
          <div style={{ width: 0.5, height: 8, backgroundColor: `${a}44`, marginTop: 2 }} />
        </div>
      </div>
    )
    // Bottom — full bleed photo with gradient, text anchored bottom
    if (variant === 'bottom') return (
      <div style={{ ...heroBase, justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${a}15 0%, ${p}22 30%, ${p} 100%)` }} />
        <div style={{ position: 'relative', padding: '0 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ fontSize: 3.5, letterSpacing: 1.5, color: `${a}99`, lineHeight: 1, marginBottom: 4, textTransform: 'uppercase' }}>bismillah</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t, lineHeight: 1, textShadow: `0 1px 6px ${p}` }}>A</div>
          <div style={{ fontSize: 5.5, fontStyle: 'italic', color: a, lineHeight: 1, margin: '2px 0' }}>&amp;</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t, lineHeight: 1, textShadow: `0 1px 6px ${p}` }}>B</div>
          <div style={{ width: 20, height: 0.5, backgroundColor: `${a}55`, marginTop: 4 }} />
        </div>
      </div>
    )
    // Minimal — bordered frame with corner squares, diamond separator
    if (variant === 'minimal') return (
      <div style={{ ...heroBase, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 56, height: 82, border: `1px solid ${a}44`, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <div style={{ position: 'absolute', inset: 3, border: `0.5px solid ${a}20` }} />
          {[{ top: -2.5, left: -2.5 }, { top: -2.5, right: -2.5 }, { bottom: -2.5, left: -2.5 }, { bottom: -2.5, right: -2.5 }].map((pos, i) => (
            <div key={i} style={{ position: 'absolute', ...pos, width: 5, height: 5, backgroundColor: a, opacity: 0.5 }} />
          ))}
          <div style={{ fontSize: 3.5, letterSpacing: 1, color: `${a}88`, lineHeight: 1, marginBottom: 6 }}>بسم</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: t, lineHeight: 1 }}>A</div>
          <div style={{ width: 7, height: 7, border: `0.8px solid ${a}88`, transform: 'rotate(45deg)', margin: '5px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: t, lineHeight: 1 }}>B</div>
          <div style={{ fontSize: 3.5, fontStyle: 'italic', color: `${t}55`, lineHeight: 1, marginTop: 6 }}>tagline</div>
        </div>
      </div>
    )
    // Split — photo left, text right aligned left
    if (variant === 'split') return (
      <div style={{ ...heroBase, flexDirection: 'row' }}>
        <div style={{ width: '45%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a}22, ${a}08)` }} />
          <svg viewBox="0 0 32 100" width="100%" height="100%" style={{ position: 'absolute', opacity: 0.3 }}>
            <circle cx="12" cy="35" r="8" fill={`${a}44`} />
            <path d="M0,60 Q10,45 20,52 Q28,56 32,48 L32,100 L0,100 Z" fill={`${a}22`} />
          </svg>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 7px', gap: 0 }}>
          <div style={{ fontSize: 3.5, letterSpacing: 1, color: `${a}88`, lineHeight: 1, marginBottom: 4 }}>بسم</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: t, lineHeight: 1 }}>A</div>
          <div style={{ width: 14, height: 0.5, backgroundColor: `${a}66`, margin: '4px 0' }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: t, lineHeight: 1 }}>B</div>
          <div style={{ fontSize: 3.5, fontStyle: 'italic', color: `${t}44`, lineHeight: 1, marginTop: 5 }}>tagline</div>
        </div>
      </div>
    )
    // Overlay Card — frosted glass card floating on gradient
    if (variant === 'overlay-card') return (
      <div style={{ ...heroBase, alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg, ${a}33 0%, ${p} 60%, ${a}18 100%)` }}>
        <div style={{
          width: 50, padding: '10px 0', borderRadius: 5,
          background: 'rgba(255,255,255,0.15)', border: '0.5px solid rgba(255,255,255,0.22)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        }}>
          <div style={{ fontSize: 3.5, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', lineHeight: 1, marginBottom: 4 }}>بسم</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>A</div>
          <div style={{ fontSize: 5, fontStyle: 'italic', color: a, lineHeight: 1, margin: '3px 0' }}>&amp;</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>B</div>
          <div style={{ width: 22, height: 0.5, backgroundColor: `${a}55`, marginTop: 5 }} />
        </div>
      </div>
    )
    // Editorial — dramatic large ultra-thin text, cinematic
    if (variant === 'editorial') return (
      <div style={{ ...heroBase, alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <div style={{ fontSize: 3.5, letterSpacing: 2.5, textTransform: 'uppercase', color: `${a}88`, lineHeight: 1, marginBottom: 6 }}>THE WEDDING</div>
        <div style={{ fontSize: 20, fontWeight: 200, color: t, lineHeight: 0.85, letterSpacing: 1.5 }}>A</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '5px 0' }}>
          <div style={{ width: 14, height: 0.5, backgroundColor: `${a}44` }} />
          <div style={{ fontSize: 5, color: `${a}aa`, letterSpacing: 1.5 }}>&amp;</div>
          <div style={{ width: 14, height: 0.5, backgroundColor: `${a}44` }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 200, color: t, lineHeight: 0.85, letterSpacing: 1.5 }}>B</div>
        <div style={{ fontSize: 3, fontStyle: 'italic', color: `${t}44`, lineHeight: 1, marginTop: 8 }}>tagline here</div>
      </div>
    )
    // Arch — elegant arch frame with names inside
    if (variant === 'arch') return (
      <div style={{ ...heroBase, alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 60 90" width="60" height="90" fill="none" style={{ position: 'absolute' }}>
          <path d="M12,90 L12,32 Q12,8 30,8 Q48,8 48,32 L48,90" stroke={`${a}55`} strokeWidth="1" />
          <path d="M16,90 L16,35 Q16,14 30,14 Q44,14 44,35 L44,90" stroke={`${a}22`} strokeWidth="0.5" />
        </svg>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 4 }}>
          <div style={{ fontSize: 3.5, color: `${a}88`, lineHeight: 1, marginBottom: 5 }}>بسم الله</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: t, lineHeight: 1 }}>A</div>
          <div style={{ fontSize: 5.5, fontStyle: 'italic', color: a, lineHeight: 1, margin: '3px 0' }}>&amp;</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: t, lineHeight: 1 }}>B</div>
          <div style={{ fontSize: 3, fontStyle: 'italic', color: `${t}55`, lineHeight: 1, marginTop: 5 }}>tagline</div>
        </div>
      </div>
    )
    // Magazine — circle photo + label + horizontal name
    if (variant === 'magazine') return (
      <div style={{ ...heroBase, alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${a}66`, backgroundColor: `${a}18`, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <circle cx="7" cy="5" r="3" fill={`${a}44`} />
            <ellipse cx="7" cy="12" rx="4.5" ry="2.5" fill={`${a}33`} />
          </svg>
        </div>
        <div style={{ fontSize: 3.5, letterSpacing: 1.5, textTransform: 'uppercase', color: `${a}77`, lineHeight: 1, marginBottom: 4 }}>UNDANGAN</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: t, lineHeight: 1 }}>A & B</div>
        <div style={{ width: 26, height: 0.5, backgroundColor: `${a}44`, marginTop: 5 }} />
        <div style={{ fontSize: 3, fontStyle: 'italic', color: `${t}44`, lineHeight: 1, marginTop: 4 }}>tagline here</div>
      </div>
    )
  }

  if (type === 'profiles') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${a}`, backgroundColor: `${a}33` }} />
          <div style={{ width: 1, height: 24, backgroundColor: `${a}44` }} />
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${a}`, backgroundColor: `${a}33` }} />
        </div>
      </div>
    )
    if (variant === 'card') return (
      <div style={{ ...base, justifyContent: 'center', padding: '4px 6px', gap: 4 }}>
        {[0,1].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: `${a}18`, borderRadius: 3, padding: '4px 5px' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${a}`, backgroundColor: `${a}22`, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ width: 18, height: 2, backgroundColor: t, borderRadius: 1 }} />
              <div style={{ width: 12, height: 1.5, backgroundColor: `${t}66`, borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    )
    if (variant === 'vertical') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${a}`, backgroundColor: `${a}33` }} />
        <div style={{ width: 1, height: 10, backgroundColor: `${a}44` }} />
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${a}`, backgroundColor: `${a}33` }} />
      </div>
    )
  }

  if (type === 'events') {
    if (variant === 'default') return (
      <div style={{ ...base, justifyContent: 'center', padding: '4px 6px', gap: 4 }}>
        {[0,1].map(i => (
          <div key={i} style={{ width: '100%', border: `1px solid ${a}30`, padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <div style={{ width: 2, height: 10, backgroundColor: `${a}50` }} />
              <div style={{ width: 20, height: 2, backgroundColor: t }} />
            </div>
            <div style={{ width: '80%', height: 8, backgroundColor: `${a}12` }} />
            <div style={{ width: '60%', height: 1.5, backgroundColor: `${t}44` }} />
          </div>
        ))}
      </div>
    )
    if (variant === 'cinematic') return (
      <div style={{ ...base, justifyContent: 'flex-end', gap: 0, background: `linear-gradient(135deg, ${t}cc, ${t}88)` }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
        <div style={{ position: 'relative', padding: '0 6px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ width: 16, height: 1.5, backgroundColor: `${a}cc` }} />
          <div style={{ width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
          <div style={{ width: 20, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
    )
    if (variant === 'timeline') return (
      <div style={{ ...base, justifyContent: 'center', padding: '4px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }}>
          {[0,1].map(i => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', border: `1.5px solid ${a}60`, flexShrink: 0 }} />
                {i === 0 && <div style={{ width: 0.5, height: 14, backgroundColor: `${a}30` }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 1 }}>
                <div style={{ width: 24, height: 2, backgroundColor: t }} />
                <div style={{ width: 18, height: 1.5, backgroundColor: `${t}44` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    if (variant === 'magazine') return (
      <div style={{ ...base, justifyContent: 'flex-start', gap: 0 }}>
        <div style={{ width: '100%', height: 20, background: `${a}22` }} />
        <div style={{ padding: '4px 6px', display: 'flex', gap: 4 }}>
          <div style={{ width: 2, height: 24, backgroundColor: `${a}40` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 24, height: 2, backgroundColor: t }} />
            <div style={{ width: 18, height: 1.5, backgroundColor: `${t}44` }} />
            <div style={{ width: 14, height: 1.5, backgroundColor: `${t}33` }} />
          </div>
        </div>
      </div>
    )
    if (variant === 'elegant') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ width: 20, height: 1.5, backgroundColor: `${a}55` }} />
        <div style={{ width: 28, height: 2, backgroundColor: t }} />
        <div style={{ fontSize: 7, color: `${t}55`, fontStyle: 'italic' }}>·</div>
        <div style={{ width: 20, height: 1.5, backgroundColor: `${a}55` }} />
        <div style={{ width: 24, height: 2, backgroundColor: t }} />
      </div>
    )
  }

  if (type === 'countdown') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 10, height: 14, border: `1px solid ${a}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 2, backgroundColor: t }} />
            </div>
          ))}
        </div>
        <div style={{ width: 28, height: 0.5, backgroundColor: `${a}44` }} />
      </div>
    )
    if (variant === 'cinematic') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4, background: `linear-gradient(135deg, ${t}cc, ${t}99)` }}>
        <div style={{ width: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 10, height: 14, background: 'rgba(0,0,0,0.35)', border: '0.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 5, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            </div>
          ))}
        </div>
      </div>
    )
    if (variant === 'elegant') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 300, color: t, lineHeight: 1 }}>60</div>
        <div style={{ width: 20, height: 0.5, backgroundColor: `${a}40` }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 6, height: 3, backgroundColor: `${t}88` }} />
          ))}
        </div>
      </div>
    )
    if (variant === 'minimal') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 10, height: 5, backgroundColor: t, opacity: 0.8 }} />
              <div style={{ width: 6, height: 1, backgroundColor: `${a}55` }} />
            </div>
          ))}
        </div>
      </div>
    )
    if (variant === 'rings') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${a}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 2, backgroundColor: t }} />
            </div>
          ))}
        </div>
      </div>
    )
    if (variant === 'magazine') return (
      <div style={{ ...base, justifyContent: 'flex-start', gap: 0 }}>
        <div style={{ width: '100%', height: 22, background: `linear-gradient(135deg, ${a}44, ${a}22)` }} />
        <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ width: 3, height: 12, backgroundColor: `${a}55` }} />
          <div style={{ display: 'flex', gap: 2 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 8, height: 10, borderTop: `1.5px solid ${a}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 5, height: 2, backgroundColor: t }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'gift') {
    if (variant === 'default') return (
      <div style={{ ...base, justifyContent: 'center', padding: '6px 4px', gap: 3 }}>
        {[0,1].map(i => (
          <div key={i} style={{ width: '100%', height: 20, borderRadius: 4, background: `linear-gradient(135deg, ${a}55, ${a}33)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 3, left: 4, width: 8, height: 5, borderRadius: 1.5, backgroundColor: `${a}88`, border: `0.5px solid ${a}` }} />
            <div style={{ position: 'absolute', bottom: 3, left: 4, width: 22, height: 1.5, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
          </div>
        ))}
      </div>
    )
    if (variant === 'swipe') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 36, height: 50 }}>
          <div style={{ position: 'absolute', top: 0, left: 4, right: 4, height: 40, borderRadius: 4, background: `${a}22`, transform: 'scale(0.92)' }} />
          <div style={{ position: 'absolute', top: 4, left: 2, right: 2, height: 40, borderRadius: 4, background: `${a}33`, transform: 'scale(0.96)' }} />
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 40, borderRadius: 4, background: `linear-gradient(135deg, ${a}66, ${a}44)` }}>
            <div style={{ position: 'absolute', top: 4, left: 4, width: 7, height: 4, borderRadius: 1, backgroundColor: `${a}88` }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: i === 0 ? 8 : 3, height: 3, borderRadius: 1.5, backgroundColor: i === 0 ? a : `${a}44` }} />)}
        </div>
      </div>
    )
  }

  if (type === 'closing') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ fontSize: 14 }}>💍</div>
        <div style={{ width: 28, height: 1.5, backgroundColor: `${a}55` }} />
        <div style={{ width: 36, height: 2, backgroundColor: `${t}88`, borderRadius: 1 }} />
        <div style={{ width: 28, height: 2, backgroundColor: a, borderRadius: 1 }} />
        <div style={{ width: 28, height: 1.5, backgroundColor: `${a}55` }} />
      </div>
    )
    if (variant === 'elegant') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 64, border: `1px solid ${a}66`, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <div style={{ width: 22, height: 2.5, backgroundColor: a, borderRadius: 1 }} />
          <div style={{ width: 30, height: 2, backgroundColor: t, borderRadius: 1 }} />
          <div style={{ width: 20, height: 2, backgroundColor: `${t}66`, borderRadius: 1 }} />
        </div>
      </div>
    )
  }

  if (type === 'quote') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ width: 20, height: 0.5, background: `linear-gradient(to right, transparent, ${a}50)` }} />
        <div style={{ fontSize: 8, color: `${a}88`, fontFamily: 'serif', direction: 'rtl' as const }}>بسم</div>
        <div style={{ width: 30, height: 1.5, backgroundColor: `${t}44`, fontStyle: 'italic' }} />
        <div style={{ fontSize: 5, color: `${a}55`, letterSpacing: 1, textTransform: 'uppercase' as const }}>QS</div>
        <div style={{ width: 20, height: 0.5, background: `linear-gradient(to left, transparent, ${a}50)` }} />
      </div>
    )
    if (variant === 'cinematic') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 3, background: `linear-gradient(135deg, ${t}dd, ${t}aa)` }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'serif', direction: 'rtl' as const }}>بسم</div>
        <div style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <div style={{ width: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </div>
    )
    if (variant === 'elegant') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div style={{ fontSize: 14, color: `${a}30`, fontFamily: 'serif', lineHeight: 1 }}>&ldquo;</div>
        <div style={{ width: 26, height: 1.5, backgroundColor: `${t}55` }} />
        <div style={{ fontSize: 14, color: `${a}30`, fontFamily: 'serif', lineHeight: 1 }}>&rdquo;</div>
      </div>
    )
    if (variant === 'magazine') return (
      <div style={{ ...base, justifyContent: 'center', padding: '6px 6px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 2, height: 24, background: `linear-gradient(to bottom, ${a}60, ${a}20)` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 7, color: `${a}77`, fontFamily: 'serif', direction: 'rtl' as const, textAlign: 'right' as const }}>بسم</div>
            <div style={{ width: 22, height: 1.5, backgroundColor: `${t}44` }} />
          </div>
        </div>
      </div>
    )
    if (variant === 'minimal') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <div style={{ width: 12, height: 0.5, backgroundColor: `${a}35` }} />
        <div style={{ width: 24, height: 1.5, backgroundColor: `${t}55` }} />
        <div style={{ width: 18, height: 1, backgroundColor: `${t}33` }} />
        <div style={{ width: 12, height: 0.5, backgroundColor: `${a}35` }} />
      </div>
    )
  }

  if (type === 'video') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ width: 20, height: 0.5, backgroundColor: `${a}40` }} />
        <div style={{ width: 36, height: 22, border: `1px solid ${a}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderLeft: `6px solid ${a}55`, borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
        </div>
        <div style={{ width: 24, height: 1, backgroundColor: `${t}33` }} />
      </div>
    )
    if (variant === 'cinematic') return (
      <div style={{ ...base, justifyContent: 'flex-end', gap: 0 }}>
        <div style={{ width: '100%', flex: 1, background: `${t}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderLeft: `7px solid ${a}55`, borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
        </div>
        <div style={{ width: '100%', height: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', display: 'flex', alignItems: 'flex-end', padding: '0 4px 3px' }}>
          <div style={{ width: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
    )
    if (variant === 'magazine') return (
      <div style={{ ...base, justifyContent: 'center', padding: '6px 6px', gap: 3 }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <div style={{ width: 2, height: 8, backgroundColor: `${a}50` }} />
          <div style={{ width: 18, height: 2, backgroundColor: t }} />
        </div>
        <div style={{ width: '100%', height: 26, border: `1px solid ${a}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderLeft: `5px solid ${a}44`, borderTop: '3px solid transparent', borderBottom: '3px solid transparent' }} />
        </div>
      </div>
    )
    if (variant === 'minimal') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ width: 38, height: 24, border: `0.5px solid ${a}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderLeft: `5px solid ${a}35`, borderTop: '3px solid transparent', borderBottom: '3px solid transparent' }} />
        </div>
        <div style={{ width: 16, height: 1, backgroundColor: `${t}25` }} />
      </div>
    )
  }

  if (type === 'gift-registry') {
    if (variant === 'default') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1].map(i => (
            <div key={i} style={{ width: 20, height: 32, border: `1px solid ${a}25`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 14, background: `${a}12` }} />
              <div style={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{ width: 12, height: 1.5, backgroundColor: t }} />
                <div style={{ width: 8, height: 1, backgroundColor: `${t}44` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    if (variant === 'grid') return (
      <div style={{ ...base, alignItems: 'center', justifyContent: 'center', padding: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: '100%' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 14, border: `0.5px solid ${a}20`, background: `${a}06` }} />
          ))}
        </div>
      </div>
    )
    if (variant === 'list') return (
      <div style={{ ...base, justifyContent: 'center', padding: '4px 6px', gap: 4 }}>
        {[0,1].map(i => (
          <div key={i} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, background: `${a}12`, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ width: 20, height: 1.5, backgroundColor: t }} />
              <div style={{ width: 14, height: 1, backgroundColor: `${t}44` }} />
            </div>
          </div>
        ))}
      </div>
    )
    if (variant === 'minimal') return (
      <div style={{ ...base, justifyContent: 'center', padding: '4px 6px', gap: 4 }}>
        {[0,1].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 22, height: 1.5, backgroundColor: t }} />
            <div style={{ width: 10, height: 6, border: `0.5px solid ${a}30` }} />
          </div>
        ))}
      </div>
    )
  }

  // Default fallback
  return (
    <div style={{ ...base, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <div style={{ width: 32, height: 2.5, backgroundColor: a }} />
        <div style={{ width: 38, height: 2, backgroundColor: `${t}88` }} />
        <div style={{ width: 28, height: 2, backgroundColor: `${t}66` }} />
      </div>
    </div>
  )
}

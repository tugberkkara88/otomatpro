/* ─────────────────────────────────────────────────
   Ayarlar.jsx içindeki tema bölümü için örnek kod
   ───────────────────────────────────────────────── */

import { useTheme } from '../components/ThemePicker';

// Ayarlar bileşeninin içinde:
function TemaAyarlari() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <section style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 6px',
      }}>🎨 Görünüm Teması</h2>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        margin: '0 0 20px',
      }}>
        Arayüzün renk temasını seçin. Tercih tarayıcıda saklanır.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              background: theme === t.id ? 'var(--nav-active-bg)' : 'var(--bg-secondary)',
              border: `1.5px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            {/* Büyük önizleme */}
            <div style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              background: t.bg,
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Sahte kenar çubuğu */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: '28%',
                background: t.dark
                  ? 'rgba(0,0,0,0.3)'
                  : 'rgba(0,0,0,0.05)',
              }} />
              {/* Vurgu çizgisi */}
              <div style={{
                position: 'absolute',
                left: '32%',
                right: '8%',
                bottom: '8px',
                height: '4px',
                borderRadius: '2px',
                background: t.accent,
              }} />
              {/* Sahte içerik çizgileri */}
              {[24, 16].map((w, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: '32%',
                  top: `${10 + i * 9}px`,
                  width: `${w}%`,
                  height: '3px',
                  borderRadius: '2px',
                  background: t.dark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.1)',
                }} />
              ))}
            </div>

            {/* İsim ve aktif badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme === t.id ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {t.label}
              </span>
              {theme === t.id && (
                <span style={{
                  fontSize: '10px',
                  background: 'var(--accent)',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}>✓</span>
              )}
            </div>

            {/* Açık/Koyu etiketi */}
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              {t.dark ? '🌙 Koyu' : '☀️ Açık'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

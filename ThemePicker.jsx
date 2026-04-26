import { useState, useEffect } from 'react';

/* ─── Tema tanımları ─── */
const THEMES = [
  {
    id: 'emerald',
    label: 'Emerald',
    accent: '#00e5a0',
    bg: '#0a0f0d',
    preview: ['#0a0f0d', '#00e5a0', '#111a15'],
    dark: true,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    accent: '#38bdf8',
    bg: '#060e1a',
    preview: ['#060e1a', '#38bdf8', '#0d1b2e'],
    dark: true,
  },
  {
    id: 'sunset',
    label: 'Sunset',
    accent: '#fb923c',
    bg: '#110b06',
    preview: ['#110b06', '#fb923c', '#1c1008'],
    dark: true,
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#a78bfa',
    bg: '#0a0812',
    preview: ['#0a0812', '#a78bfa', '#110e1f'],
    dark: true,
  },
  {
    id: 'graphite',
    label: 'Graphite',
    accent: '#6366f1',
    bg: '#f8f9fa',
    preview: ['#f8f9fa', '#6366f1', '#f1f3f5'],
    dark: false,
  },
  {
    id: 'rose',
    label: 'Rose',
    accent: '#f472b6',
    bg: '#120810',
    preview: ['#120810', '#f472b6', '#1e0d1a'],
    dark: true,
  },
];

/* ─── Yerel depolama anahtarı ─── */
const STORAGE_KEY = 'otomatpro_theme';

/* ─── Hook: tema yönetimi ─── */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'emerald';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme, themes: THEMES };
}

/* ─── Bileşen: Tema Seçici ─── */
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Tetikleyici düğme */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Tema değiştir"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {/* Renk önizleme noktaları */}
        <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {current.preview.map((c, i) => (
            <span key={i} style={{
              width: i === 1 ? '10px' : '6px',
              height: i === 1 ? '10px' : '6px',
              borderRadius: '50%',
              background: c,
              border: i === 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
            }} />
          ))}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>{current.label}</span>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▼</span>
      </button>

      {/* Açılır panel */}
      {open && (
        <>
          {/* Arka plan overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            zIndex: 999,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px',
            width: '220px',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              margin: '0 0 10px',
            }}>Tema</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                    padding: '10px',
                    background: theme === t.id ? 'var(--nav-active-bg)' : 'var(--bg-card)',
                    border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (theme !== t.id) e.currentTarget.style.borderColor = 'var(--border-hover)';
                  }}
                  onMouseLeave={e => {
                    if (theme !== t.id) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {/* Mini renk önizleme */}
                  <div style={{
                    width: '100%',
                    height: '28px',
                    borderRadius: '6px',
                    background: t.bg,
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '6px',
                      right: '6px',
                      height: '4px',
                      borderRadius: '2px',
                      background: t.accent,
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '6px',
                      width: '40%',
                      height: '3px',
                      borderRadius: '2px',
                      background: t.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    }} />
                  </div>

                  {/* Etiket */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: theme === t.id ? 600 : 400,
                    color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

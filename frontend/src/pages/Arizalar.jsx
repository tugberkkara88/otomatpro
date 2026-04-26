// src/pages/Arizalar.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const ONCELIK = {
  dusuk:   { label: 'Düşük',   color: 'var(--muted)',   bg: 'rgba(107,122,153,0.15)' },
  normal:  { label: 'Normal',  color: 'var(--accent2)', bg: 'rgba(79,140,255,0.15)' },
  yuksek:  { label: 'Yüksek', color: 'var(--warn)',    bg: 'rgba(255,209,102,0.15)' },
  kritik:  { label: 'Kritik',  color: 'var(--danger)',  bg: 'rgba(255,77,109,0.15)' },
};
const DURUM = {
  acik:   { label: '🔴 Açık',  color: 'var(--danger)' },
  devam:  { label: '🟡 Devam', color: 'var(--warn)' },
  kapali: { label: '🟢 Kapalı', color: 'var(--accent)' },
};

export default function Arizalar({ showToast }) {
  const [arizalar, setArizalar] = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [filter, setFilter]     = useState('acik');
  const [form, setForm] = useState({ makina_num: '', tip: 'Genel', aciklama: '', oncelik: 'normal' });
  const [loading, setLoading]   = useState(true);

  const load = () => Promise.all([
    api.arizalar.list({ durum: filter }),
    api.makinalar.list(),
  ]).then(([a, m]) => {
    setArizalar(a); setMakinalar(m);
    if (m.length && !form.makina_num) setForm(f => ({ ...f, makina_num: m[0].num }));
  }).catch(e => showToast('❌ ' + e.message, 'err'))
  .finally(() => setLoading(false));

  useEffect(() => { load(); }, [filter]);

  const kaydet = async () => {
    if (!form.aciklama) return showToast('❌ Açıklama gerekli', 'err');
    try {
      await api.arizalar.create({ makina_num: +form.makina_num, tip: form.tip, aciklama: form.aciklama, oncelik: form.oncelik });
      showToast('✅ Arıza kaydedildi');
      setForm(f => ({ ...f, aciklama: '', tip: 'Genel' }));
      load();
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const durumGuncelle = async (id, durum) => {
    try {
      await api.arizalar.update(id, { durum, maliyet: 0, aciklama: '', oncelik: 'normal' });
      load();
      showToast(`✅ Durum: ${DURUM[durum]?.label}`);
    } catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const sil = async (id) => {
    if (!confirm('Arıza kaydı silinecek. Emin misiniz?')) return;
    try { await api.arizalar.delete(id); load(); showToast('🗑️ Silindi'); }
    catch (e) { showToast('❌ ' + e.message, 'err'); }
  };

  const acik = arizalar.filter(a => a.durum === 'acik').length;
  const devam = arizalar.filter(a => a.durum === 'devam').length;

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Açık Arızalar', val: acik, color: 'var(--danger)' },
          { label: 'Devam Eden',    val: devam, color: 'var(--warn)' },
          { label: 'Toplam',        val: arizalar.length, color: 'var(--text)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Yeni arıza formu */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🔧 Yeni Arıza Kaydı</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Otomat</label>
            <select value={form.makina_num} onChange={e => setForm(f => ({ ...f, makina_num: e.target.value }))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', WebkitAppearance: 'none' }}>
              {makinalar.map(m => <option key={m.num} value={m.num}>#{m.num} — {m.loc}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Arıza Tipi</label>
            <select value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', WebkitAppearance: 'none' }}>
              {['Genel', 'Elektronik', 'Mekanik', 'Para Ünitesi', 'Soğutma', 'Ekran', 'İletişim', 'Diğer'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Öncelik</label>
            <select value={form.oncelik} onChange={e => setForm(f => ({ ...f, oncelik: e.target.value }))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', WebkitAppearance: 'none' }}>
              {Object.entries(ONCELIK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Açıklama *</label>
          <textarea value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} rows={2} placeholder="Arıza detaylarını yazın..."
            style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none' }} />
        </div>
        <button onClick={kaydet} style={{ width: '100%', padding: 11, borderRadius: 10, border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700 }}>⚠️ Arıza Kaydet</button>
      </div>

      {/* Arıza listesi */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700 }}>Arıza Kayıtları</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(DURUM).map(([k, v]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '4px 10px', borderRadius: 8, border: filter === k ? `1px solid ${v.color}` : '1px solid var(--border)',
                background: filter === k ? `${v.color}22` : 'transparent', color: filter === k ? v.color : 'var(--muted)',
                fontSize: 11, fontWeight: 700,
              }}>{v.label}</button>
            ))}
            <button onClick={() => setFilter('')} style={{ padding: '4px 10px', borderRadius: 8, border: filter === '' ? '1px solid var(--text)' : '1px solid var(--border)', background: 'transparent', color: filter === '' ? 'var(--text)' : 'var(--muted)', fontSize: 11, fontWeight: 700 }}>Tümü</button>
          </div>
        </div>

        {loading ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>Yükleniyor...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {arizalar.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--accent)', padding: 30 }}>✅ Bu filtrede arıza yok</div>
              : arizalar.map(a => {
                const onc = ONCELIK[a.oncelik] || ONCELIK.normal;
                const dur  = DURUM[a.durum] || DURUM.acik;
                return (
                  <div key={a.id} style={{ background: 'var(--surface2)', border: `1px solid ${a.oncelik === 'kritik' ? 'rgba(255,77,109,0.3)' : 'var(--border)'}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent2)', fontSize: 13 }}>#{a.makina_num}</span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{a.tip}</span>
                          <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: onc.bg, color: onc.color }}>{onc.label}</span>
                          <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: dur.color }}>{dur.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{a.aciklama}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(a.acilis_tar).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {a.durum === 'acik'  && <button onClick={() => durumGuncelle(a.id, 'devam')}  style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,209,102,0.2)', color: 'var(--warn)',   fontSize: 10, fontWeight: 700 }}>Devam Et</button>}
                        {a.durum !== 'kapali' && <button onClick={() => durumGuncelle(a.id, 'kapali')} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(0,229,160,0.2)',  color: 'var(--accent)', fontSize: 10, fontWeight: 700 }}>Kapat</button>}
                        <button onClick={() => sil(a.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,77,109,0.15)', color: 'var(--danger)', fontSize: 10, fontWeight: 700 }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
}

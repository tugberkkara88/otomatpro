// src/pages/Sayim.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { useBarcodeScanner, BarcodeModal, ScanBtn } from '../lib/useBarcode.js';

export default function Sayim({ showToast }) {
  const [makinalar, setMakinalar] = useState([]);
  const [urunler, setUrunler]     = useState([]);
  const [gecmis, setGecmis]       = useState([]);
  const [selMak, setSelMak]       = useState('');
  const [sayilar, setSayilar]     = useState({});
  const [sonuc, setSonuc]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [scanTarget, setScanTarget] = useState(null); // { urun_id } — hangi ürün için tarama
  const inputRefs = useRef({});

  useEffect(() => {
    Promise.all([api.makinalar.list(), api.urunler.list(), api.sayimlar.list({ limit:20 })])
      .then(([m, u, g]) => {
        setMakinalar(m); setUrunler(u); setGecmis(g);
        if (m.length) setSelMak(m[0].num);
        const init = {}; u.forEach(p => { init[p.id] = ''; }); setSayilar(init);
      }).catch(e => showToast('❌ ' + e.message, 'err'));
  }, []);

  useEffect(() => { hesapla(); }, [sayilar, selMak]);

  const hesapla = () => {
    let ciro = 0, kar = 0, kayip = 0;
    urunler.forEach(u => {
      const beklenen = Math.floor((u.stock||0) / Math.max(makinalar.length,1));
      const sayilan  = parseInt(sayilar[u.id])||0;
      const satilan  = Math.max(0, beklenen - sayilan);
      const fark     = sayilan - beklenen;
      ciro += satilan * parseFloat(u.f1||0);
      kar  += satilan * (parseFloat(u.f1||0) - parseFloat(u.cost||0));
      if (fark < 0) kayip += Math.abs(fark) * parseFloat(u.cost||0);
    });
    setSonuc({ ciro, kar, kayip, marj: ciro>0 ? (kar/ciro*100).toFixed(1) : 0 });
  };

  // ── Barkod tarayıcı: barkodla ürünün sayım alanına odaklan ──────────────
  const scanner = useBarcodeScanner({
    onDetected: (barcode) => {
      const found = urunler.find(u => u.barcode === barcode);
      if (found) {
        showToast('📦 ' + found.name + ' — sayı girin');
        // Tabloda o ürünün input'una odaklan
        setTimeout(() => { inputRefs.current[found.id]?.focus(); }, 100);
      } else {
        showToast('⚠️ Barkod bulunamadı: ' + barcode, 'warn');
      }
    },
  });

  const kaydet = async () => {
    if (!selMak) return showToast('❌ Otomat seçin', 'err');
    setLoading(true);
    try {
      const detaylar = urunler.map(u => {
        const beklenen = Math.floor((u.stock||0) / Math.max(makinalar.length,1));
        const sayilan  = parseInt(sayilar[u.id])||0;
        const satilan  = Math.max(0, beklenen - sayilan);
        const fark     = sayilan - beklenen;
        return { urun_id:u.id, urun_ad:u.name, beklenen, sayilan,
          ciro: (satilan * parseFloat(u.f1||0)).toFixed(2),
          kar:  (satilan * (parseFloat(u.f1||0) - parseFloat(u.cost||0))).toFixed(2),
          kayip: fark<0 ? (Math.abs(fark)*parseFloat(u.cost||0)).toFixed(2) : '0' };
      });
      await api.sayimlar.create({ makina_num:selMak, sayim_detaylari:detaylar });
      showToast(`✅ Sayım kaydedildi — Otomat #${selMak}`);
      const g = await api.sayimlar.list({ limit:20 });
      setGecmis(g);
      const init = {}; urunler.forEach(u => { init[u.id] = ''; }); setSayilar(init);
    } catch(e) { showToast('❌ ' + e.message, 'err'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <BarcodeModal scanner={scanner} title="Sayım Barkodu Tara" />

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>🔍 Sayım Yap</div>

        <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Otomat Seç</label>
            <select value={selMak} onChange={e => setSelMak(e.target.value)}
              style={{ width:'100%', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontSize:13, outline:'none', WebkitAppearance:'none' }}>
              {makinalar.map(m => <option key={m.num} value={m.num}>Otomat #{m.num} — {m.loc}</option>)}
            </select>
          </div>
          {/* Barkod ile sayım — hızlı ürün bul */}
          <ScanBtn onClick={scanner.open} style={{ padding:'11px 14px', fontSize:18 }} />
        </div>

        {/* Sonuç özeti */}
        {sonuc && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'Ciro', val:`₺${sonuc.ciro.toFixed(0)}`, color:'var(--accent)' },
              { label:'Kâr',  val:`₺${sonuc.kar.toFixed(0)}`,  color:'var(--accent2)' },
              { label:'Marj', val:`%${sonuc.marj}`,             color:'var(--warn)' },
              { label:'Kayıp',val:`₺${sonuc.kayip.toFixed(0)}`, color:'var(--danger)' },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center', padding:10, background:'var(--surface2)', borderRadius:10 }}>
                <div style={{ fontSize:10, color:'var(--muted)', marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:600, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sayım tablosu */}
        <div style={{ overflowX:'auto', maxHeight:340, overflowY:'auto', marginBottom:14 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>{['Ürün','Barkod','Beklenen','Sayılan','Fark'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--muted)', fontSize:10, fontWeight:700, borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--surface)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {urunler.map(u => {
                const beklenen = Math.floor((u.stock||0) / Math.max(makinalar.length,1));
                const sayilan  = parseInt(sayilar[u.id])||0;
                const fark     = sayilan - beklenen;
                return (
                  <tr key={u.id}>
                    <td style={{ padding:'7px 10px', fontSize:11, fontWeight:600 }}>{u.name}</td>
                    <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--muted)', fontSize:10 }}>{u.barcode||'—'}</td>
                    <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--muted)' }}>{beklenen}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <input ref={el => inputRefs.current[u.id] = el}
                        type="number" min="0" value={sayilar[u.id]??''} placeholder="0"
                        onChange={e => setSayilar(s => ({ ...s, [u.id]: e.target.value }))}
                        style={{ width:70, background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:8, padding:'4px 8px', color:'var(--text)', fontSize:12, outline:'none', fontFamily:'var(--font-mono)' }} />
                    </td>
                    <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', fontWeight:700,
                      color: sayilar[u.id]==='' ? 'var(--muted)' : fark>=0 ? 'var(--accent)' : 'var(--danger)' }}>
                      {sayilar[u.id]==='' ? '—' : fark>0 ? `+${fark}` : fark}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={kaydet} disabled={loading} style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'var(--accent)', color:'#0d0f14', fontWeight:700, fontSize:13 }}>
          {loading ? '⏳ Kaydediliyor...' : '💾 Sayımı Kaydet'}
        </button>
      </div>

      {/* Sayım geçmişi */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, marginBottom:12 }}>Sayım Geçmişi</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr>{['Otomat','Ürün','Beklenen','Sayılan','Fark','Ciro','Tarih'].map(h => (
            <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--muted)', fontSize:10, fontWeight:700, borderBottom:'1px solid var(--border)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {gecmis.length === 0
              ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>Sayım geçmişi yok</td></tr>
              : gecmis.slice(0,15).map(g => (
                <tr key={g.id}>
                  <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--accent2)' }}>#{g.makina_num}</td>
                  <td style={{ padding:'7px 10px', fontSize:11 }}>{g.urun_ad||'Genel'}</td>
                  <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--muted)' }}>{g.beklenen}</td>
                  <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)' }}>{g.sayilan}</td>
                  <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', fontWeight:700, color:g.fark>=0?'var(--accent)':'var(--danger)' }}>
                    {g.fark>0?`+${g.fark}`:g.fark}
                  </td>
                  <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', color:'var(--accent)' }}>₺{parseFloat(g.ciro||0).toFixed(0)}</td>
                  <td style={{ padding:'7px 10px', fontSize:10, color:'var(--muted)' }}>{new Date(g.tarih).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

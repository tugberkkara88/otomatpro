// src/pages/Stok.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useBarcodeScanner, BarcodeModal, ScanBtn } from '../lib/useBarcode.js';

export default function Stok({ showToast }) {
  const [urunler, setUrunler] = useState([]);
  const [gecmis, setGecmis]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ urun_id:'', fiyat:'', miktar:'', birim:'Adet', fatura_no:'', hedef:'depot' });
  const [hesap, setHesap] = useState(null);

  useEffect(() => {
    Promise.all([api.urunler.list(), api.stok.list({ tip:'giris', limit:20 })])
      .then(([u, g]) => { setUrunler(u); setGecmis(g); if (u.length) setForm(f => ({ ...f, urun_id: u[0].id })); })
      .catch(e => showToast('❌ ' + e.message, 'err'));
  }, []);

  useEffect(() => { calcHesap(); }, [form.urun_id, form.fiyat, form.miktar]);

  const calcHesap = () => {
    const u = urunler.find(x => x.id == form.urun_id);
    const qty = parseFloat(form.miktar)||0, fiyat = parseFloat(form.fiyat)||0;
    if (!u || !qty || !fiyat) return setHesap(null);
    const eskiStok = parseInt(u.stock)||0, eskiMaliyet = parseFloat(u.cost)||0;
    const toplam = qty * fiyat, yeniStok = eskiStok + qty;
    const yeniOrt = yeniStok > 0 ? ((eskiStok * eskiMaliyet) + (qty * fiyat)) / yeniStok : fiyat;
    setHesap({ toplam, eskiMaliyet, yeniOrt, yeniStok });
  };

  // ── Barkod tarayıcı: barkodla ürün seç ──────────────────────────────────
  const scanner = useBarcodeScanner({
    onDetected: (barcode) => {
      const found = urunler.find(u => u.barcode === barcode);
      if (found) { setForm(f => ({ ...f, urun_id: found.id })); showToast('✅ ' + found.name + ' seçildi'); }
      else showToast('⚠️ Barkod bulunamadı: ' + barcode, 'warn');
    },
  });

  const kaydet = async () => {
    if (!form.urun_id || !form.miktar || !form.fiyat) return showToast('❌ Tüm alanları doldurun', 'err');
    setLoading(true);
    try {
      await api.stok.giris({ urun_id:+form.urun_id, miktar:+form.miktar, birim:form.birim, fiyat:+form.fiyat, fatura_no:form.fatura_no||'Manuel', hedef:form.hedef });
      showToast(`✅ ${form.miktar} ${form.birim} stok eklendi`);
      const [u, g] = await Promise.all([api.urunler.list(), api.stok.list({ tip:'giris', limit:20 })]);
      setUrunler(u); setGecmis(g);
      setForm(f => ({ ...f, fiyat:'', miktar:'', fatura_no:'' }));
      setHesap(null);
    } catch(e) { showToast('❌ ' + e.message, 'err'); }
    finally { setLoading(false); }
  };

  const secilenUrun = urunler.find(x => x.id == form.urun_id);

  const inp = (key, extra = {}) => ({
    value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    style: { width:'100%', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontSize:13, outline:'none', ...extra }
  });

  return (
    <div>
      <BarcodeModal scanner={scanner} title="Ürün Barkodunu Tara" />

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
          🛒 Stok Girişi — Fatura
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>🏭 Hedef Depo</label>
            <select {...inp('hedef')} style={{ ...inp('hedef').style, WebkitAppearance:'none' }}>
              <option value="depot">🏭 Ana Depo</option>
              <option value="truck">🚚 Araç Deposu</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>🧾 Fatura No</label>
            <input {...inp('fatura_no')} placeholder="FAT-2026-001" />
          </div>
        </div>

        {/* Ürün seçimi — barkod butonlu */}
        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Ürün</label>
          <div style={{ display:'flex', gap:6 }}>
            <select {...inp('urun_id')} style={{ ...inp('urun_id').style, WebkitAppearance:'none', fontSize:12, flex:1 }}>
              {urunler.map(u => <option key={u.id} value={u.id}>{u.name} (Stok: {u.stock})</option>)}
            </select>
            <ScanBtn onClick={scanner.open} />
          </div>
          {/* Seçili ürün bilgisi */}
          {secilenUrun && (
            <div style={{ marginTop:6, padding:'8px 12px', borderRadius:8, background:'rgba(79,140,255,0.08)', border:'1px solid rgba(79,140,255,0.2)', display:'flex', gap:16, fontSize:11 }}>
              <span style={{ color:'var(--muted)' }}>Barkod: <b style={{ color:'var(--text)', fontFamily:'var(--font-mono)' }}>{secilenUrun.barcode||'—'}</b></span>
              <span style={{ color:'var(--muted)' }}>Mevcut Stok: <b style={{ color: secilenUrun.stock<10?'var(--danger)':secilenUrun.stock<50?'var(--warn)':'var(--accent)', fontFamily:'var(--font-mono)' }}>{secilenUrun.stock}</b></span>
              <span style={{ color:'var(--muted)' }}>Maliyet: <b style={{ color:'var(--warn)', fontFamily:'var(--font-mono)' }}>₺{parseFloat(secilenUrun.cost||0).toFixed(2)}</b></span>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Alış Fiyatı ₺</label>
            <input {...inp('fiyat')} type="number" step="0.01" placeholder="0.00" />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Birim</label>
            <select {...inp('birim')} style={{ ...inp('birim').style, WebkitAppearance:'none' }}>
              {['Adet','Koli','Paket','Kg','Lt'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:4 }}>Miktar</label>
            <input {...inp('miktar')} type="number" placeholder="0" />
          </div>
        </div>

        {hesap && (
          <div style={{ background:'rgba(0,229,160,0.05)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, color:'var(--muted)', fontWeight:700, marginBottom:8 }}>MALİYET HESABI (Ağırlıklı Ort.)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Toplam Tutar',    val:`₺${hesap.toplam.toFixed(2)}`,    color:'var(--accent2)' },
                { label:'Eski Maliyet',    val:`₺${hesap.eskiMaliyet.toFixed(2)}`, color:'var(--muted)' },
                { label:'Yeni Ort. Maliyet', val:`₺${hesap.yeniOrt.toFixed(2)}`,  color:'var(--accent)' },
              ].map((k,i) => (
                <div key={i} style={{ textAlign:'center', padding:8, borderRight:i<2?'1px solid var(--border)':'none' }}>
                  <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:k.color }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={kaydet} disabled={loading} style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'var(--accent)', color:'#0d0f14', fontWeight:700, fontSize:13, opacity:loading?0.7:1 }}>
          {loading ? '⏳ Kaydediliyor...' : '✅ Girişi Onayla & Kaydet'}
        </button>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, marginBottom:12 }}>Son Girişler</div>
        <div style={{ overflowX:'auto', maxHeight:300, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['Ürün','Miktar','Birim','Alış Fiyatı','Fatura','Tarih'].map(h => (
              <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--muted)', fontSize:10, fontWeight:700, borderBottom:'1px solid var(--border)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {gecmis.length === 0
                ? <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>Henüz giriş yok</td></tr>
                : gecmis.map(h => (
                  <tr key={h.id}>
                    <td style={{ padding:'8px 10px', fontSize:11 }}>{h.urun_ad}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', color:'var(--accent2)' }}>{h.miktar}</td>
                    <td style={{ padding:'8px 10px', color:'var(--muted)' }}>{h.birim}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', color:'var(--accent)' }}>₺{parseFloat(h.fiyat||0).toFixed(2)}</td>
                    <td style={{ padding:'8px 10px', color:'var(--muted)', fontSize:11 }}>{h.fatura_no||'—'}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)' }}>{new Date(h.tarih).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

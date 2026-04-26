// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const Card = ({ children, style }) => (
  <div style={{
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, padding:16, ...style
  }}>{children}</div>
);

const CardTitle = ({ children }) => (
  <div style={{
    fontFamily:'var(--font-head)', fontSize:11, fontWeight:700,
    color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:10,
  }}>{children}</div>
);

export default function Dashboard({ showToast }) {
  const [data, setData]       = useState(null);
  const [topSatan, setTopSatan] = useState([]);
  const [kritik, setKritik]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.raporlar.dashboard(),
      api.raporlar.enCokSatan(5),
      api.raporlar.kritikStok(),
    ]).then(([d, ts, kr]) => {
      setData(d);
      setTopSatan(ts);
      setKritik(kr);
    }).catch(e => showToast('❌ ' + e.message, 'err'))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <div className="spinner" />
      <span style={{ color:'var(--muted)' }}>Yükleniyor...</span>
    </div>
  );

  if (!data) return null;

  const { finansal, makinalar, urunler, arizalar } = data;
  const barColors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', 'var(--warn)', 'var(--danger)'];

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
        {[
          { label:'Aylık Ciro',   val:`₺${parseFloat(finansal.ciro||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,  color:'var(--accent)',  change:'Son 30 gün' },
          { label:'Brüt Kâr',    val:`₺${parseFloat(finansal.kar||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,    color:'var(--accent2)', change:`Marj: %${finansal.marj}` },
          { label:'Toplam Stok', val:parseInt(urunler.toplam_stok||0).toLocaleString('tr-TR'),                               color:'var(--warn)',    change:`${urunler.toplam} ürün` },
          { label:'Kayıp',       val:`₺${parseFloat(finansal.kayip||0).toLocaleString('tr-TR',{maximumFractionDigits:0})}`,  color:'var(--danger)', change:'Sayım farkı' },
        ].map((k,i) => (
          <Card key={i} style={{ padding:'12px 14px' }}>
            <CardTitle>{k.label}</CardTitle>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{k.change}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        {/* Makina durumu */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <CardTitle style={{ margin:0 }}>Otomat Durumu</CardTitle>
            <div style={{ display:'flex', gap:5 }}>
              {[
                { label:`${makinalar.dolu} ✓`, color:'var(--accent)', bg:'rgba(0,229,160,0.15)' },
                { label:`${makinalar.orta} ⚠`, color:'var(--warn)',   bg:'rgba(255,209,102,0.15)' },
                { label:`${makinalar.bos} ✗`,  color:'var(--danger)', bg:'rgba(255,77,109,0.15)' },
              ].map((b,i) => (
                <span key={i} style={{
                  padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                  fontFamily:'var(--font-mono)', background:b.bg, color:b.color,
                }}>{b.label}</span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {[
              { label:'Toplam', val:makinalar.toplam, color:'var(--text)' },
              { label:'Dolu',   val:makinalar.dolu,   color:'var(--accent)' },
              { label:'Kritik', val:makinalar.bos,    color:'var(--danger)' },
              { label:'Arıza',  val:arizalar.acik,    color:'var(--warn)' },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:'center', padding:'10px 6px', background:'var(--surface2)', borderRadius:10 }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:600, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* En çok satan */}
        <Card>
          <CardTitle>En Çok Satılan (30 gün)</CardTitle>
          {topSatan.length === 0 ? (
            <div style={{ color:'var(--muted)', fontSize:12, textAlign:'center', padding:'20px 0' }}>
              Henüz satış verisi yok
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {topSatan.map((p,i) => {
                const maxQty = topSatan[0]?.toplam_miktar || 1;
                const pct = Math.round((p.toplam_miktar / maxQty) * 100);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
                    <div style={{ width:100, color:'var(--muted)', fontSize:10, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {p.urun_ad}
                    </div>
                    <div style={{ flex:1, background:'var(--surface2)', borderRadius:4, height:18, overflow:'hidden' }}>
                      <div style={{
                        width:`${pct}%`, height:'100%', borderRadius:4,
                        background:barColors[i], display:'flex', alignItems:'center',
                        paddingLeft:6, fontSize:9, fontWeight:700, color:'rgba(0,0,0,0.7)',
                        fontFamily:'var(--font-mono)', transition:'width 0.6s',
                      }}>{p.toplam_miktar}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, width:50, textAlign:'right', color:barColors[i] }}>
                      ₺{parseFloat(p.toplam_ciro||0).toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Kritik stok */}
        <Card>
          <CardTitle>⚠️ Kritik Stok (&lt;50 adet)</CardTitle>
          {kritik.length === 0 ? (
            <div style={{ color:'var(--accent)', fontSize:12, textAlign:'center', padding:'20px 0' }}>✅ Tüm stoklar yeterli</div>
          ) : (
            <div style={{ overflowY:'auto', maxHeight:200 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>
                    {['Ürün','Stok','ABC'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'5px 8px', color:'var(--muted)', fontSize:10, fontWeight:700, borderBottom:'1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kritik.map((u,i) => (
                    <tr key={i}>
                      <td style={{ padding:'7px 8px', fontSize:11 }}>{u.name}</td>
                      <td style={{ padding:'7px 8px', fontFamily:'var(--font-mono)', color:u.stock<10?'var(--danger)':'var(--warn)', fontWeight:600 }}>{u.stock}</td>
                      <td style={{ padding:'7px 8px' }}>
                        <span style={{
                          padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:700,
                          background: u.abc==='A'?'rgba(0,229,160,0.15)':u.abc==='B'?'rgba(79,140,255,0.15)':'rgba(255,209,102,0.15)',
                          color: u.abc==='A'?'var(--accent)':u.abc==='B'?'var(--accent2)':'var(--warn)',
                        }}>{u.abc}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stok akışı */}
        <Card>
          <CardTitle>Stok Akış Şeması</CardTitle>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5 }}>
            {[
              { label:'🏭 Ana Depo', color:'var(--accent2)', bg:'rgba(79,140,255,0.1)', border:'var(--accent2)' },
              { label:'↓ Transfer', isArrow:true },
              { label:'🚚 Araç Deposu', color:'var(--accent3)', bg:'rgba(255,107,53,0.1)', border:'var(--accent3)' },
              { label:'↓ Yükleme', isArrow:true },
              { label:'🏪 Otomat 1–34', color:'var(--accent)', bg:'rgba(0,229,160,0.1)', border:'var(--accent)' },
              { label:'↓ Sayım', isArrow:true },
              { label:'📊 Kâr/Zarar', color:'var(--warn)', bg:'rgba(255,209,102,0.1)', border:'var(--warn)' },
            ].map((item,i) => item.isArrow
              ? <div key={i} style={{ paddingLeft:20, fontSize:11, color:'var(--muted)' }}>{item.label}</div>
              : <div key={i} style={{
                  padding:'8px 14px', borderRadius:10, border:`1.5px solid ${item.border}`,
                  background:item.bg, fontSize:12, fontWeight:600, color:item.color, minWidth:140,
                }}>{item.label}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

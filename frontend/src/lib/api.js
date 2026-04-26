// src/lib/api.js — OtomatPro API (Supabase tabanlı, Express yok)
import { supabase } from './supabase.js';

function check(data, error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

const urunler = {
  async list(params = {}) {
    let q = supabase.from('urunler').select('*');
    if (params.cat)    q = q.eq('cat', params.cat);
    if (params.abc)    q = q.eq('abc', params.abc);
    if (params.search) q = q.or(`name.ilike.%${params.search}%,barcode.ilike.%${params.search}%`);
    q = q.order('name');
    const { data, error } = await q;
    return check(data, error, 'urunler.list');
  },
  async get(id) {
    const { data, error } = await supabase.from('urunler').select('*').eq('id', id).single();
    return check(data, error, 'urunler.get');
  },
  async create(payload) {
    const { data, error } = await supabase.from('urunler').insert([payload]).select().single();
    return check(data, error, 'urunler.create');
  },
  async update(id, payload) {
    const { data, error } = await supabase.from('urunler').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return check(data, error, 'urunler.update');
  },
  async delete(id) {
    const { error } = await supabase.from('urunler').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  async bulk(arr) {
    let added = 0, updated = 0;
    for (const u of arr) {
      if (!u.name) continue;
      if (u.barcode) {
        const { data: ex } = await supabase.from('urunler').select('id').eq('barcode', u.barcode).maybeSingle();
        if (ex) { await supabase.from('urunler').update({ name: u.name, cat: u.cat, unit: u.unit, abc: u.abc, updated_at: new Date().toISOString() }).eq('id', ex.id); updated++; continue; }
      }
      await supabase.from('urunler').insert([{ barcode: u.barcode||'', name: u.name, cat: u.cat||'📦 Diğer', unit: u.unit||'Adet', abc: u.abc||'B', f1: u.f1||0, f2: u.f2||0, f3: u.f3||0, cost: 0, stock: 0 }]);
      added++;
    }
    return { added, updated };
  },
};

const makinalar = {
  async list() {
    const { data, error } = await supabase.from('makinalar').select('*').order('num');
    return check(data, error, 'makinalar.list');
  },
  async get(num) {
    const { data, error } = await supabase.from('makinalar').select('*').eq('num', num).single();
    return check(data, error, 'makinalar.get');
  },
  async update(num, payload) {
    const { data, error } = await supabase.from('makinalar').update({ ...payload, updated_at: new Date().toISOString() }).eq('num', num).select().single();
    return check(data, error, 'makinalar.update');
  },
  async create(payload) {
    const { data: mx } = await supabase.from('makinalar').select('num').order('num', { ascending: false }).limit(1).single();
    const newNum = (mx?.num || 0) + 1;
    const { data, error } = await supabase.from('makinalar').insert([{ num: newNum, loc: payload.loc||`Yeni Konum #${newNum}`, pct: 0, price_tier: payload.price_tier||'F1', status: 'aktif' }]).select().single();
    return check(data, error, 'makinalar.create');
  },
  async delete(num) {
    const { error } = await supabase.from('makinalar').delete().eq('num', num);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

const stok = {
  async list(params = {}) {
    let q = supabase.from('stok_hareketleri').select('*');
    if (params.tip) q = q.eq('tip', params.tip);
    q = q.order('tarih', { ascending: false }).limit(parseInt(params.limit)||50);
    const { data, error } = await q;
    return check(data, error, 'stok.list');
  },
  async giris({ urun_id, miktar, birim, fiyat, fatura_no, hedef }) {
    const { data: urun, error: ue } = await supabase.from('urunler').select('*').eq('id', urun_id).single();
    if (ue) throw new Error(ue.message);
    const eskiStok = parseInt(urun.stock)||0;
    const eskiMal  = parseFloat(urun.cost)||0;
    const qty = parseInt(miktar), price = parseFloat(fiyat);
    const yeniStok = eskiStok + qty;
    const yeniMal  = yeniStok > 0 ? ((eskiStok*eskiMal)+(qty*price))/yeniStok : price;
    await supabase.from('urunler').update({ stock: yeniStok, cost: parseFloat(yeniMal.toFixed(4)), updated_at: new Date().toISOString() }).eq('id', urun_id);
    const { data, error } = await supabase.from('stok_hareketleri').insert([{ urun_id, urun_ad: urun.name, tip: 'giris', miktar: qty, birim: birim||'Adet', fiyat: price, fatura_no: fatura_no||'Manuel', hedef: hedef||'depot' }]).select().single();
    return check(data, error, 'stok.giris');
  },
  async transfer({ transferler, kaynak, hedef }) {
    const results = [];
    for (const t of transferler) {
      if (kaynak === 'depot') {
        const { data: u } = await supabase.from('urunler').select('stock').eq('id', t.urun_id).single();
        await supabase.from('urunler').update({ stock: Math.max(0,(u?.stock||0)-t.miktar), updated_at: new Date().toISOString() }).eq('id', t.urun_id);
      }
      const { data: u2 } = await supabase.from('urunler').select('name').eq('id', t.urun_id).single();
      const { data } = await supabase.from('stok_hareketleri').insert([{ urun_id: t.urun_id, urun_ad: u2?.name||'', tip: 'transfer', miktar: t.miktar, kaynak, hedef }]).select().single();
      if (data) results.push(data);
    }
    return { success: true, hareketler: results };
  },
};

const sayimlar = {
  async list(params = {}) {
    let q = supabase.from('sayimlar').select('*');
    if (params.makina) q = q.eq('makina_num', params.makina);
    q = q.order('tarih', { ascending: false }).limit(parseInt(params.limit)||50);
    const { data, error } = await q;
    return check(data, error, 'sayimlar.list');
  },
  async create({ makina_num, sayim_detaylari }) {
    const rows = sayim_detaylari.map(d => ({ makina_num, urun_id: d.urun_id||null, urun_ad: d.urun_ad, beklenen: d.beklenen||0, sayilan: d.sayilan||0, ciro: parseFloat(d.ciro)||0, kar: parseFloat(d.kar)||0, kayip: parseFloat(d.kayip)||0 }));
    const { error } = await supabase.from('sayimlar').insert(rows);
    if (error) throw new Error(error.message);
    const topB = sayim_detaylari.reduce((s,d)=>s+(d.beklenen||0),0);
    const topS = sayim_detaylari.reduce((s,d)=>s+(d.sayilan||0),0);
    const pct  = topB>0 ? Math.min(100,Math.round((topS/topB)*100)) : 0;
    await supabase.from('makinalar').update({ pct, updated_at: new Date().toISOString() }).eq('num', makina_num);
    return { success: true, kayit_sayisi: rows.length };
  },
};

const maliyetler = {
  async list(params = {}) {
    let q = supabase.from('maliyetler').select('*');
    if (params.tip) q = q.eq('tip', params.tip);
    q = q.order('tarih', { ascending: false }).limit(parseInt(params.limit)||100);
    const { data, error } = await q;
    return check(data, error, 'maliyetler.list');
  },
  async create(payload) {
    const { data, error } = await supabase.from('maliyetler').insert([payload]).select().single();
    return check(data, error, 'maliyetler.create');
  },
  async delete(id) {
    const { error } = await supabase.from('maliyetler').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

const arizalar = {
  async list(params = {}) {
    let q = supabase.from('arizalar').select('*');
    if (params.durum) q = q.eq('durum', params.durum);
    if (params.makina) q = q.eq('makina_num', params.makina);
    q = q.order('acilis_tar', { ascending: false });
    const { data, error } = await q;
    return check(data, error, 'arizalar.list');
  },
  async create(payload) {
    const { data, error } = await supabase.from('arizalar').insert([{ ...payload, durum: 'acik' }]).select().single();
    return check(data, error, 'arizalar.create');
  },
  async update(id, payload) {
    const upd = { ...payload, updated_at: new Date().toISOString() };
    if (payload.durum === 'kapali') upd.kapanis_tar = new Date().toISOString();
    const { data, error } = await supabase.from('arizalar').update(upd).eq('id', id).select().single();
    return check(data, error, 'arizalar.update');
  },
  async delete(id) {
    const { error } = await supabase.from('arizalar').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

const raporlar = {
  async dashboard() {
    const since = new Date(Date.now()-30*86400000).toISOString();
    const [{ data: uD },{ data: mD },{ data: sD },{ data: sayD },{ data: malD },{ data: aD }] = await Promise.all([
      supabase.from('urunler').select('stock'),
      supabase.from('makinalar').select('pct'),
      supabase.from('stok_hareketleri').select('miktar,fiyat').eq('tip','giris').gte('tarih',since),
      supabase.from('sayimlar').select('ciro,kar,kayip').gte('tarih',since),
      supabase.from('maliyetler').select('tutar').gte('tarih',since),
      supabase.from('arizalar').select('id').eq('durum','acik'),
    ]);
    const toplam_stok=(uD||[]).reduce((s,u)=>s+(parseInt(u.stock)||0),0);
    const ciro=(sayD||[]).reduce((s,r)=>s+(parseFloat(r.ciro)||0),0);
    const kar=(sayD||[]).reduce((s,r)=>s+(parseFloat(r.kar)||0),0);
    const kayip=(sayD||[]).reduce((s,r)=>s+(parseFloat(r.kayip)||0),0);
    const gider=(malD||[]).reduce((s,m)=>s+(parseFloat(m.tutar)||0),0);
    const net_kar=kar-gider;
    const maks=mD||[];
    return {
      urunler:{ toplam:uD?.length||0, toplam_stok },
      makinalar:{ toplam:maks.length, dolu:maks.filter(m=>m.pct>=70).length, orta:maks.filter(m=>m.pct>=30&&m.pct<70).length, bos:maks.filter(m=>m.pct<30).length },
      stok_30gun:{ giris_sayisi:sD?.length||0 },
      finansal:{ ciro, kar, gider, net_kar, kayip, marj:ciro>0?(net_kar/ciro*100).toFixed(1):0 },
      arizalar:{ acik:aD?.length||0 },
    };
  },
  async enCokSatan(limit=10) {
    const since=new Date(Date.now()-30*86400000).toISOString();
    const { data }=await supabase.from('stok_hareketleri').select('urun_ad,miktar,fiyat').eq('tip','giris').gte('tarih',since);
    const g={};
    (data||[]).forEach(r=>{ if(!g[r.urun_ad]) g[r.urun_ad]={urun_ad:r.urun_ad,toplam_miktar:0,toplam_ciro:0}; g[r.urun_ad].toplam_miktar+=parseInt(r.miktar)||0; g[r.urun_ad].toplam_ciro+=(parseFloat(r.miktar)*parseFloat(r.fiyat))||0; });
    return Object.values(g).sort((a,b)=>b.toplam_miktar-a.toplam_miktar).slice(0,limit);
  },
  async abc() {
    const { data }=await supabase.from('urunler').select('name,stock,cost,f1,abc').order('stock',{ascending:false});
    const rows=data||[];
    const toplam=rows.reduce((s,r)=>s+(parseInt(r.stock)||0),0);
    let cum=0;
    return rows.map(r=>{ cum+=parseInt(r.stock)||0; const cumPct=toplam>0?Math.round((cum/toplam)*100):0; return {...r,deger:(parseInt(r.stock)*parseFloat(r.f1||0)),cumPct,hesap_abc:cumPct<=70?'A':cumPct<=90?'B':'C'}; });
  },
  async makina(num) {
    const [{ data:sD },{ data:aD }]=await Promise.all([
      supabase.from('sayimlar').select('tarih,ciro,kar,kayip').eq('makina_num',num).order('tarih',{ascending:false}).limit(30),
      supabase.from('arizalar').select('*').eq('makina_num',num).order('acilis_tar',{ascending:false}),
    ]);
    return { sayimlar:sD||[], arizalar:aD||[] };
  },
  async kritikStok() {
    const { data }=await supabase.from('urunler').select('id,name,stock,cost,f1,abc').lt('stock',50).order('stock').limit(20);
    return data||[];
  },
};

async function health() {
  const { error }=await supabase.from('makinalar').select('num').limit(1);
  if (error) throw new Error(error.message);
  return { status:'ok', backend:'Supabase' };
}

export const api = { health, urunler, makinalar, stok, sayimlar, maliyetler, arizalar, raporlar };

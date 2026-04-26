-- =====================================================================
-- OtomatPro — Supabase SQL Schema
-- supabase.com → projen → SQL Editor → buraya yapıştır → Run
-- =====================================================================

-- 1. ÜRÜNLER
CREATE TABLE IF NOT EXISTS urunler (
  id         BIGSERIAL PRIMARY KEY,
  barcode    TEXT DEFAULT '',
  name       TEXT NOT NULL,
  cat        TEXT DEFAULT '📦 Diğer',
  unit       TEXT DEFAULT 'Adet',
  abc        CHAR(1) DEFAULT 'B',
  f1         NUMERIC(10,2) DEFAULT 0,
  f2         NUMERIC(10,2) DEFAULT 0,
  f3         NUMERIC(10,2) DEFAULT 0,
  cost       NUMERIC(10,4) DEFAULT 0,
  stock      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MAKINALAR
CREATE TABLE IF NOT EXISTS makinalar (
  id         BIGSERIAL PRIMARY KEY,
  num        INTEGER UNIQUE NOT NULL,
  loc        TEXT DEFAULT '',
  pct        INTEGER DEFAULT 0,
  price_tier TEXT DEFAULT 'F1',
  status     TEXT DEFAULT 'aktif',
  notes      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STOK HAREKETLERİ
CREATE TABLE IF NOT EXISTS stok_hareketleri (
  id         BIGSERIAL PRIMARY KEY,
  urun_id    BIGINT REFERENCES urunler(id) ON DELETE SET NULL,
  urun_ad    TEXT,
  tip        TEXT NOT NULL CHECK (tip IN ('giris','transfer','sayim')),
  miktar     INTEGER NOT NULL,
  birim      TEXT DEFAULT 'Adet',
  fiyat      NUMERIC(10,2) DEFAULT 0,
  fatura_no  TEXT DEFAULT '',
  kaynak     TEXT DEFAULT '',
  hedef      TEXT DEFAULT '',
  tarih      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAYIMLAR
CREATE TABLE IF NOT EXISTS sayimlar (
  id         BIGSERIAL PRIMARY KEY,
  makina_num INTEGER NOT NULL,
  urun_id    BIGINT REFERENCES urunler(id) ON DELETE SET NULL,
  urun_ad    TEXT,
  beklenen   INTEGER DEFAULT 0,
  sayilan    INTEGER DEFAULT 0,
  fark       INTEGER GENERATED ALWAYS AS (sayilan - beklenen) STORED,
  ciro       NUMERIC(10,2) DEFAULT 0,
  kar        NUMERIC(10,2) DEFAULT 0,
  kayip      NUMERIC(10,2) DEFAULT 0,
  tarih      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MALİYETLER
CREATE TABLE IF NOT EXISTS maliyetler (
  id         BIGSERIAL PRIMARY KEY,
  tip        TEXT NOT NULL,
  tutar      NUMERIC(10,2) NOT NULL,
  aciklama   TEXT DEFAULT '',
  makina_num INTEGER,
  tarih      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ARIZALAR
CREATE TABLE IF NOT EXISTS arizalar (
  id          BIGSERIAL PRIMARY KEY,
  makina_num  INTEGER NOT NULL,
  tip         TEXT DEFAULT 'Genel',
  aciklama    TEXT,
  durum       TEXT DEFAULT 'acik' CHECK (durum IN ('acik','devam','kapali')),
  oncelik     TEXT DEFAULT 'normal' CHECK (oncelik IN ('dusuk','normal','yuksek','kritik')),
  maliyet     NUMERIC(10,2) DEFAULT 0,
  acilis_tar  TIMESTAMPTZ DEFAULT NOW(),
  kapanis_tar TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_stok_tarih    ON stok_hareketleri(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_stok_urun     ON stok_hareketleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_sayim_makina  ON sayimlar(makina_num);
CREATE INDEX IF NOT EXISTS idx_sayim_tarih   ON sayimlar(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_ariza_makina  ON arizalar(makina_num);
CREATE INDEX IF NOT EXISTS idx_ariza_durum   ON arizalar(durum);
CREATE INDEX IF NOT EXISTS idx_urunler_abc   ON urunler(abc);

-- ROW LEVEL SECURITY (RLS) — anon key ile okuma/yazma izni
ALTER TABLE urunler           ENABLE ROW LEVEL SECURITY;
ALTER TABLE makinalar         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_hareketleri  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sayimlar          ENABLE ROW LEVEL SECURITY;
ALTER TABLE maliyetler        ENABLE ROW LEVEL SECURITY;
ALTER TABLE arizalar          ENABLE ROW LEVEL SECURITY;

-- Tüm tablolar için anon key'e tam erişim (iç ağ uygulaması)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['urunler','makinalar','stok_hareketleri','sayimlar','maliyetler','arizalar'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS allow_all ON %I', tbl);
    EXECUTE format('CREATE POLICY allow_all ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- 34 VARSAYILAN OTOMAT
INSERT INTO makinalar (num, loc, pct, price_tier, status)
SELECT gs, 'Konum #' || gs, 0, 'F1', 'aktif'
FROM generate_series(1, 34) gs
ON CONFLICT (num) DO NOTHING;

-- Başarı kontrolü
SELECT 
  'urunler'          AS tablo, COUNT(*) AS kayit FROM urunler UNION ALL
  SELECT 'makinalar',          COUNT(*) FROM makinalar UNION ALL
  SELECT 'stok_hareketleri',   COUNT(*) FROM stok_hareketleri UNION ALL
  SELECT 'sayimlar',           COUNT(*) FROM sayimlar UNION ALL
  SELECT 'maliyetler',         COUNT(*) FROM maliyetler UNION ALL
  SELECT 'arizalar',           COUNT(*) FROM arizalar;

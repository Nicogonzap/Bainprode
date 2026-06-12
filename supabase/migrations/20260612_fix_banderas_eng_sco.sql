-- Fix flag URLs for England and Scotland (non-standard ISO codes stored in DB)
-- EN and SC are not real ISO 3166-1 alpha-2 codes, so fallback flag lookup fails.
-- SC resolves to Seychelles flag; EN resolves to 404.
-- Setting bandera_url explicitly overrides the codigo_iso-based fallback.
UPDATE public.equipos
SET bandera_url = 'https://flagcdn.com/w80/gb-eng.png'
WHERE nombre_pais = 'Inglaterra';

UPDATE public.equipos
SET bandera_url = 'https://flagcdn.com/w80/gb-sct.png'
WHERE nombre_pais = 'Escocia';
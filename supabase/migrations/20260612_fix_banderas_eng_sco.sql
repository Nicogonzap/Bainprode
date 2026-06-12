-- bandera_url is a GENERATED column computed from codigo_iso.
-- SC = Seychelles (wrong flag), EN = no ISO code (404).
-- Fix by updating codigo_iso to the correct flagcdn subdivision codes.
UPDATE public.equipos
SET codigo_iso = 'gb-eng'
WHERE nombre_pais = 'Inglaterra';

UPDATE public.equipos
SET codigo_iso = 'gb-sct'
WHERE nombre_pais = 'Escocia';
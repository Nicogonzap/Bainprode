-- 1. Tabla de jugadores por seleccion
CREATE TABLE IF NOT EXISTS public.jugadores (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre    TEXT NOT NULL,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  posicion  TEXT CHECK (posicion IN ('ARQ', 'DEF', 'MED', 'DEL')),
  numero    INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jugadores' AND policyname = 'Anyone can read jugadores') THEN
    CREATE POLICY "Anyone can read jugadores" ON public.jugadores FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS jugadores_equipo_id_idx ON public.jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS jugadores_posicion_idx ON public.jugadores(posicion);

-- 2. Nuevos campos en predicciones_especiales: balon de oro y guante de oro
--    Se mantiene la columna sorpresa para no perder datos existentes
ALTER TABLE public.predicciones_especiales
  ADD COLUMN IF NOT EXISTS balon_de_oro_nombre TEXT,
  ADD COLUMN IF NOT EXISTS balon_de_oro_equipo TEXT,
  ADD COLUMN IF NOT EXISTS guante_de_oro_nombre TEXT,
  ADD COLUMN IF NOT EXISTS guante_de_oro_equipo TEXT;
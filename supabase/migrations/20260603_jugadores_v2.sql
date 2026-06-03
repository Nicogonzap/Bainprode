-- Agregar api_football_player_id para poder hacer upsert desde la API
ALTER TABLE public.jugadores
  ADD COLUMN IF NOT EXISTS api_football_player_id INTEGER;

-- Constraint unique para upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jugadores_api_id_unique'
  ) THEN
    ALTER TABLE public.jugadores
      ADD CONSTRAINT jugadores_api_id_unique UNIQUE (api_football_player_id);
  END IF;
END $$;

-- Index para busqueda por posicion + equipo (util para el guante de oro)
CREATE INDEX IF NOT EXISTS jugadores_equipo_posicion_idx 
  ON public.jugadores(equipo_id, posicion);
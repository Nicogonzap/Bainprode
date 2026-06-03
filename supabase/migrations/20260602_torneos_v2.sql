-- Agregar descripcion a torneos
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Agregar estado a torneo_miembros (activo por default para no romper registros existentes)
ALTER TABLE torneo_miembros ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activo';

-- Politica para que usuarios puedan actualizar su propio estado (pendiente -> activo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'torneo_miembros' AND policyname = 'Members can update own membership state'
  ) THEN
    CREATE POLICY "Members can update own membership state" ON torneo_miembros
      FOR UPDATE USING (auth.uid() = usuario_id);
  END IF;
END $$;
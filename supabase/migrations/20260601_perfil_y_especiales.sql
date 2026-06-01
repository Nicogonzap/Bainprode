-- Migracion: agregar campos de perfil a usuarios y tabla predicciones_especiales
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas nombre, apellido, tenure a usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS apellido TEXT,
  ADD COLUMN IF NOT EXISTS tenure TEXT CHECK (tenure IN ('AC', 'SAC', 'C', 'M', 'SM', 'AP', 'P'));

-- 2. Crear tabla predicciones_especiales
CREATE TABLE IF NOT EXISTS public.predicciones_especiales (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campeon        TEXT,
  goleador_nombre  TEXT,
  goleador_equipo  TEXT,
  asistente_nombre TEXT,
  asistente_equipo TEXT,
  sorpresa       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- 3. RLS para predicciones_especiales
ALTER TABLE public.predicciones_especiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias predicciones especiales"
  ON public.predicciones_especiales FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden insertar sus predicciones especiales"
  ON public.predicciones_especiales FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus predicciones especiales"
  ON public.predicciones_especiales FOR UPDATE
  USING (auth.uid() = usuario_id);

-- 4. RLS para usuarios (perfil propio)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuarios pueden ver su propio perfil"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Usuarios pueden actualizar su propio perfil"
  ON public.usuarios FOR UPDATE
  USING (auth.uid() = id);

-- 5. Funcion para crear perfil de usuario al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre_usuario, nombre, apellido, tenure)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_usuario', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido',
    NEW.raw_user_meta_data->>'tenure'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para crear perfil automaticamente al registrar usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
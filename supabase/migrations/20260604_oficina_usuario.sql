-- Migration: Add oficina column to usuarios and update handle_new_user trigger

-- 1. Add oficina column to usuarios table
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS oficina TEXT;

-- 2. Update handle_new_user trigger to capture oficina from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellido, tenure, oficina, nombre_usuario)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido',
    NEW.raw_user_meta_data->>'tenure',
    NEW.raw_user_meta_data->>'oficina',
    COALESCE(NEW.raw_user_meta_data->>'nombre_usuario',
      TRIM(CONCAT(NEW.raw_user_meta_data->>'nombre', ' ', NEW.raw_user_meta_data->>'apellido')))
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre         = EXCLUDED.nombre,
    apellido       = EXCLUDED.apellido,
    tenure         = EXCLUDED.tenure,
    oficina        = EXCLUDED.oficina,
    nombre_usuario = EXCLUDED.nombre_usuario;
  RETURN NEW;
END;
$$;
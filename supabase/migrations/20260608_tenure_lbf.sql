-- Agregar LBF al CHECK constraint de tenure en usuarios
ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_tenure_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_tenure_check
  CHECK (tenure IN ('AC', 'SAC', 'C', 'M', 'SM', 'AP', 'P', 'LBF'));
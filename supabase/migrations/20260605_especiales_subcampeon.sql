-- Agregar subcampeon y tercer_puesto a predicciones_especiales
ALTER TABLE public.predicciones_especiales
  ADD COLUMN IF NOT EXISTS subcampeon TEXT,
  ADD COLUMN IF NOT EXISTS tercer_puesto TEXT;
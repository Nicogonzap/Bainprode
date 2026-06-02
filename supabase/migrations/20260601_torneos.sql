-- Tabla torneos
CREATE TABLE IF NOT EXISTS public.torneos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT NOT NULL,
  invite_code UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  creado_por  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla torneo_miembros
CREATE TABLE IF NOT EXISTS public.torneo_miembros (
  torneo_id  UUID NOT NULL REFERENCES public.torneos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (torneo_id, usuario_id)
);

-- RLS
ALTER TABLE public.torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneo_miembros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read torneos" ON public.torneos FOR SELECT USING (true);
CREATE POLICY "Users can create torneos" ON public.torneos FOR INSERT WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "Creator can update torneo" ON public.torneos FOR UPDATE USING (auth.uid() = creado_por);
CREATE POLICY "Creator can delete torneo" ON public.torneos FOR DELETE USING (auth.uid() = creado_por);

CREATE POLICY "Anyone can read torneo_miembros" ON public.torneo_miembros FOR SELECT USING (true);
CREATE POLICY "Users can join torneos" ON public.torneo_miembros FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can leave torneos" ON public.torneo_miembros FOR DELETE USING (auth.uid() = usuario_id);

-- Trigger: auto-unir al creador como primer miembro
CREATE OR REPLACE FUNCTION public.handle_new_torneo()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.torneo_miembros (torneo_id, usuario_id)
  VALUES (NEW.id, NEW.creado_por);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_torneo_created ON public.torneos;
CREATE TRIGGER on_torneo_created
  AFTER INSERT ON public.torneos
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_torneo();
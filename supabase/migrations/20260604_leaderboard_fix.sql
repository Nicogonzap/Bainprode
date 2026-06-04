-- Migration: Arreglar leaderboard view y agregar columna activo a torneos

-- 1. Agregar columna activo a torneos (soft-delete)
ALTER TABLE public.torneos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- 2. Recrear la vista leaderboard basada en TODOS los usuarios
--    (no en grupos_torneo que es el schema viejo)
CREATE OR REPLACE VIEW public.leaderboard AS
WITH puntos_por_usuario AS (
  SELECT
    usuario_id,
    COALESCE(SUM(puntos), 0)::INTEGER      AS puntos_totales,
    COUNT(*)::INTEGER                       AS partidos_puntuados
  FROM public.historial_puntos
  GROUP BY usuario_id
)
SELECT
  u.id                                                          AS usuario_id,
  COALESCE(u.nombre_usuario, split_part(u.email, '@', 1))      AS nombre_usuario,
  u.avatar_url,
  u.fecha_registro,
  COALESCE(p.puntos_totales, 0)                                 AS puntos_totales,
  COALESCE(p.partidos_puntuados, 0)                             AS partidos_puntuados,
  RANK() OVER (
    ORDER BY COALESCE(p.puntos_totales, 0) DESC,
             COALESCE(p.partidos_puntuados, 0) DESC
  )::INTEGER                                                     AS posicion,
  NULL::UUID                                                     AS grupo_id,
  'Ranking General'::TEXT                                        AS nombre_torneo
FROM public.usuarios u
LEFT JOIN puntos_por_usuario p ON p.usuario_id = u.id;

-- 3. Dar acceso a la vista
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard TO anon;
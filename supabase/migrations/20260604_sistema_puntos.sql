-- Migration: Sistema de puntos con fases y bonus goleada

-- 1. Add es_exacto column to historial_puntos for % aciertos calculation
ALTER TABLE public.historial_puntos
  ADD COLUMN IF NOT EXISTS es_exacto BOOLEAN NOT NULL DEFAULT false;

-- 2. Create or replace the scoring function
CREATE OR REPLACE FUNCTION public.calcular_puntos_prediccion(p_partido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partido     RECORD;
  v_pred        RECORD;
  v_puntos      INTEGER;
  v_exacto      BOOLEAN;
  v_regla       TEXT;
  v_real_diff   INTEGER;
  v_pred_diff   INTEGER;
  v_real_winner INTEGER; -- -1 local, 0 draw, 1 visitante
  v_pred_winner INTEGER;
BEGIN
  -- Get the match result
  SELECT fase, goles_local, goles_visitante, estado
    INTO v_partido
    FROM public.partidos
   WHERE id = p_partido_id;

  -- Only score finished matches
  IF v_partido.estado <> 'finalizado' THEN RETURN; END IF;
  IF v_partido.goles_local IS NULL OR v_partido.goles_visitante IS NULL THEN RETURN; END IF;

  v_real_diff := v_partido.goles_local - v_partido.goles_visitante;
  IF v_real_diff > 0 THEN v_real_winner := -1;
  ELSIF v_real_diff < 0 THEN v_real_winner := 1;
  ELSE v_real_winner := 0;
  END IF;

  -- Loop over all predictions for this match
  FOR v_pred IN
    SELECT id, usuario_id, goles_local, goles_visitante
      FROM public.predicciones
     WHERE partido_id = p_partido_id
  LOOP
    v_puntos := 0;
    v_exacto := false;
    v_regla := NULL;

    v_pred_diff := v_pred.goles_local - v_pred.goles_visitante;
    IF v_pred_diff > 0 THEN v_pred_winner := -1;
    ELSIF v_pred_diff < 0 THEN v_pred_winner := 1;
    ELSE v_pred_winner := 0;
    END IF;

    -- Exact score
    IF v_pred.goles_local = v_partido.goles_local AND v_pred.goles_visitante = v_partido.goles_visitante THEN
      v_exacto := true;
      CASE v_partido.fase
        WHEN 'grupos'        THEN v_puntos := 5;
        WHEN 'octavos'       THEN v_puntos := 5;
        WHEN 'cuartos'       THEN v_puntos := 6;
        WHEN 'semifinal'     THEN v_puntos := 7;
        WHEN 'tercer_puesto' THEN v_puntos := 7;
        WHEN 'final'         THEN v_puntos := 8;
        ELSE v_puntos := 5;
      END CASE;
      v_regla := 'exacto';

    -- Correct winner / draw
    ELSIF v_pred_winner = v_real_winner THEN
      CASE v_partido.fase
        WHEN 'grupos'        THEN v_puntos := 3;
        WHEN 'octavos'       THEN v_puntos := 3;
        WHEN 'cuartos'       THEN v_puntos := 4;
        WHEN 'semifinal'     THEN v_puntos := 5;
        WHEN 'tercer_puesto' THEN v_puntos := 5;
        WHEN 'final'         THEN v_puntos := 6;
        ELSE v_puntos := 3;
      END CASE;
      v_regla := 'ganador';
    END IF;

    -- Goleada bonus (grupos only): real diff >= 3 AND correct winner predicted
    IF v_partido.fase = 'grupos'
       AND ABS(v_real_diff) >= 3
       AND v_pred_winner = v_real_winner
       AND v_puntos > 0
    THEN
      v_puntos := v_puntos + 2;
      v_regla := v_regla || '+goleada';
    END IF;

    -- Update puntos_obtenidos on prediccion
    UPDATE public.predicciones
       SET puntos_obtenidos = v_puntos
     WHERE id = v_pred.id;

    -- Upsert into historial_puntos
    INSERT INTO public.historial_puntos (usuario_id, partido_id, puntos, regla_aplicada, es_exacto, calculado_en)
    VALUES (v_pred.usuario_id, p_partido_id, v_puntos, v_regla, v_exacto, NOW())
    ON CONFLICT (usuario_id, partido_id)
      DO UPDATE SET puntos = EXCLUDED.puntos,
                    regla_aplicada = EXCLUDED.regla_aplicada,
                    es_exacto = EXCLUDED.es_exacto,
                    calculado_en = EXCLUDED.calculado_en;
  END LOOP;
END;
$$;

-- 3. Add unique constraint to historial_puntos for the upsert above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'historial_puntos_usuario_partido_unique'
  ) THEN
    ALTER TABLE public.historial_puntos
      ADD CONSTRAINT historial_puntos_usuario_partido_unique UNIQUE (usuario_id, partido_id);
  END IF;
END $$;
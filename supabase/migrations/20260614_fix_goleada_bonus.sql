-- Migration: corregir regla goleada y recalcular puntos históricos
-- Cambios vs versión anterior:
--   · Bonus goleada: +2 -> +1
--   · Condición: ganador correcto -> resultado exacto únicamente
--   · Alcance: solo grupos -> todas las fases

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
  v_real_winner INTEGER;
  v_pred_winner INTEGER;
BEGIN
  SELECT fase, goles_local, goles_visitante, estado
    INTO v_partido
    FROM public.partidos
   WHERE id = p_partido_id;

  IF v_partido.estado <> 'finalizado' THEN RETURN; END IF;
  IF v_partido.goles_local IS NULL OR v_partido.goles_visitante IS NULL THEN RETURN; END IF;

  v_real_diff := v_partido.goles_local - v_partido.goles_visitante;
  IF v_real_diff > 0 THEN v_real_winner := -1;
  ELSIF v_real_diff < 0 THEN v_real_winner := 1;
  ELSE v_real_winner := 0;
  END IF;

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

    -- Resultado exacto
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

    -- Ganador / empate correcto
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

    -- Bonus goleada: +1 si resultado exacto Y diferencia >= 3 (todas las fases)
    IF v_exacto AND ABS(v_real_diff) >= 3 THEN
      v_puntos := v_puntos + 1;
      v_regla := v_regla || '+goleada';
    END IF;

    UPDATE public.predicciones
       SET puntos_obtenidos = v_puntos
     WHERE id = v_pred.id;

    INSERT INTO public.historial_puntos (usuario_id, partido_id, puntos, regla_aplicada, es_exacto, calculado_en)
    VALUES (v_pred.usuario_id, p_partido_id, v_puntos, v_regla, v_exacto, NOW())
    ON CONFLICT (usuario_id, partido_id)
      DO UPDATE SET puntos          = EXCLUDED.puntos,
                    regla_aplicada  = EXCLUDED.regla_aplicada,
                    es_exacto       = EXCLUDED.es_exacto,
                    calculado_en    = EXCLUDED.calculado_en;
  END LOOP;
END;
$$;

-- Recalcular puntos para todos los partidos ya finalizados
DO $$
DECLARE
  v_id UUID;
BEGIN
  FOR v_id IN SELECT id FROM public.partidos WHERE estado = 'finalizado'
  LOOP
    PERFORM public.calcular_puntos_prediccion(v_id);
  END LOOP;
END $$;
// Tipos generados del schema real de Supabase (inspeccionado 2026-05-26)

export type EstadoPartido = 'programado' | 'en_juego' | 'finalizado' | 'suspendido'
export type FasePartido = 'grupos' | 'octavos' | 'cuartos' | 'semifinal' | 'tercer_puesto' | 'final'
export type TipoEvento =
  | 'gol'
  | 'gol_penal'
  | 'gol_propio'
  | 'tarjeta_amarilla'
  | 'tarjeta_roja'
  | 'segunda_amarilla'
  | 'sustitucion'

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre_usuario: string
          email: string
          password_hash: string | null
          avatar_url: string | null
          fecha_registro: string
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre_usuario: string
          email: string
          password_hash?: string | null
          avatar_url?: string | null
          fecha_registro?: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre_usuario?: string
          email?: string
          avatar_url?: string | null
          role?: string | null
          updated_at?: string
        }
      }
      grupos_torneo: {
        Row: {
          id: string
          nombre: string
          codigo_invitacion: string
          created_by: string
          fecha_creacion: string
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          codigo_invitacion?: string
          created_by: string
          fecha_creacion?: string
          created_at?: string
        }
        Update: {
          nombre?: string
          codigo_invitacion?: string
        }
      }
      usuarios_grupos: {
        Row: {
          id: string
          usuario_id: string
          grupo_id: string
          fecha_union: string
        }
        Insert: {
          id?: string
          usuario_id: string
          grupo_id: string
          fecha_union?: string
        }
        Update: {
          fecha_union?: string
        }
      }
      equipos: {
        Row: {
          id: string
          nombre_pais: string
          codigo_iso: string
          continente: string
          ranking_fifa: number
          grupo_fase: string
          logo_url: string | null
          bandera_url: string | null
        }
        Insert: {
          id?: string
          nombre_pais: string
          codigo_iso: string
          continente: string
          ranking_fifa: number
          grupo_fase: string
          logo_url?: string | null
          bandera_url?: string | null
        }
        Update: {
          nombre_pais?: string
          codigo_iso?: string
          continente?: string
          ranking_fifa?: number
          grupo_fase?: string
          logo_url?: string | null
          bandera_url?: string | null
        }
      }
      grupo_equipos: {
        Row: {
          id: string
          grupo_fase: string
          equipo_id: string
        }
        Insert: {
          id?: string
          grupo_fase: string
          equipo_id: string
        }
        Update: {
          grupo_fase?: string
        }
      }
      partidos: {
        Row: {
          id: string
          api_fixture_id: number
          equipo_local_id: string
          equipo_visitante_id: string
          fecha_hora: string
          estadio: string | null
          ciudad: string | null
          fase: FasePartido
          grupo_fase: string | null
          estado: EstadoPartido
          minuto_juego: number | null
          periodo: string | null
          goles_local: number | null
          goles_visitante: number | null
          tarjetas_amarillas_local: number | null
          tarjetas_amarillas_visitante: number | null
          tarjetas_rojas_local: number | null
          tarjetas_rojas_visitante: number | null
          ganador_id: string | null
          diferencia_goles: number | null
          ultimo_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_fixture_id: number
          equipo_local_id: string
          equipo_visitante_id: string
          fecha_hora: string
          estadio?: string | null
          ciudad?: string | null
          fase: FasePartido
          grupo_fase?: string | null
          estado?: EstadoPartido
          minuto_juego?: number | null
          periodo?: string | null
          goles_local?: number | null
          goles_visitante?: number | null
          tarjetas_amarillas_local?: number | null
          tarjetas_amarillas_visitante?: number | null
          tarjetas_rojas_local?: number | null
          tarjetas_rojas_visitante?: number | null
          ganador_id?: string | null
          diferencia_goles?: number | null
          ultimo_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          estado?: EstadoPartido
          minuto_juego?: number | null
          periodo?: string | null
          goles_local?: number | null
          goles_visitante?: number | null
          tarjetas_amarillas_local?: number | null
          tarjetas_amarillas_visitante?: number | null
          tarjetas_rojas_local?: number | null
          tarjetas_rojas_visitante?: number | null
          ganador_id?: string | null
          diferencia_goles?: number | null
          ultimo_sync?: string | null
          updated_at?: string
        }
      }
      eventos_partido: {
        Row: {
          id: string
          partido_id: string
          equipo_id: string
          tipo: TipoEvento
          minuto: number
          minuto_adicional: number | null
          jugador_nombre: string | null
          jugador_nombre2: string | null
          detalle: string | null
          created_at: string
        }
        Insert: {
          id?: string
          partido_id: string
          equipo_id: string
          tipo: TipoEvento
          minuto: number
          minuto_adicional?: number | null
          jugador_nombre?: string | null
          jugador_nombre2?: string | null
          detalle?: string | null
          created_at?: string
        }
        Update: {
          tipo?: TipoEvento
          minuto?: number
          minuto_adicional?: number | null
          jugador_nombre?: string | null
          jugador_nombre2?: string | null
          detalle?: string | null
        }
      }
      playoffs: {
        Row: {
          id: string
          partido_id: string
          ronda: string
          condicion_equipo1: string | null
          condicion_equipo2: string | null
          goles_et_local: number | null
          goles_et_visitante: number | null
          fue_a_penales: boolean | null
          penales_local: number | null
          penales_visitante: number | null
        }
        Insert: {
          id?: string
          partido_id: string
          ronda: string
          condicion_equipo1?: string | null
          condicion_equipo2?: string | null
          goles_et_local?: number | null
          goles_et_visitante?: number | null
          fue_a_penales?: boolean | null
          penales_local?: number | null
          penales_visitante?: number | null
        }
        Update: {
          goles_et_local?: number | null
          goles_et_visitante?: number | null
          fue_a_penales?: boolean | null
          penales_local?: number | null
          penales_visitante?: number | null
        }
      }
      predicciones: {
        Row: {
          id: string
          usuario_id: string
          partido_id: string
          goles_local: number
          goles_visitante: number
          ganador_predicho_id: string | null
          fecha_prediccion: string
          puntos_obtenidos: number | null
        }
        Insert: {
          id?: string
          usuario_id: string
          partido_id: string
          goles_local: number
          goles_visitante: number
          ganador_predicho_id?: string | null
          fecha_prediccion?: string
          puntos_obtenidos?: number | null
        }
        Update: {
          goles_local?: number
          goles_visitante?: number
          ganador_predicho_id?: string | null
          puntos_obtenidos?: number | null
        }
      }
      reglas_puntaje: {
        Row: {
          id: string
          descripcion: string | null
          condicion: string | null
          puntos: number
        }
        Insert: {
          id?: string
          descripcion?: string | null
          condicion?: string | null
          puntos: number
        }
        Update: {
          descripcion?: string | null
          condicion?: string | null
          puntos?: number
        }
      }
      historial_puntos: {
        Row: {
          id: string
          usuario_id: string
          partido_id: string
          puntos: number
          regla_aplicada: string | null
          calculado_en: string
        }
        Insert: {
          id?: string
          usuario_id: string
          partido_id: string
          puntos: number
          regla_aplicada?: string | null
          calculado_en?: string
        }
        Update: {
          puntos?: number
          regla_aplicada?: string | null
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          grupo_id: string
          nombre_torneo: string
          usuario_id: string
          nombre_usuario: string
          avatar_url: string | null
          fecha_registro: string
          puntos_totales: number
          partidos_puntuados: number
          posicion: number
        }
      }
      partidos_en_vivo: {
        Row: {
          id: string
          api_fixture_id: number
          fase: FasePartido
          grupo_fase: string | null
          fecha_hora: string
          estadio: string | null
          ciudad: string | null
          estado: EstadoPartido
          minuto_juego: number | null
          periodo: string | null
          local_id: string
          local_nombre: string
          local_iso: string
          local_bandera: string | null
          local_logo: string | null
          goles_local: number | null
          tarjetas_amarillas_local: number | null
          tarjetas_rojas_local: number | null
          visitante_id: string
          visitante_nombre: string
          visitante_iso: string
          visitante_bandera: string | null
          visitante_logo: string | null
          goles_visitante: number | null
          tarjetas_amarillas_visitante: number | null
          tarjetas_rojas_visitante: number | null
          ultimo_sync: string | null
          updated_at: string
        }
      }
      predicciones_vs_resultado: {
        Row: {
          prediccion_id: string
          nombre_usuario: string
          local: string
          visitante: string
          fase: FasePartido
          fecha_hora: string
          pred_goles_local: number
          pred_goles_visitante: number
          pred_ganador: string | null
          real_goles_local: number | null
          real_goles_visitante: number | null
          real_ganador: string | null
          estado_partido: EstadoPartido
          puntos_obtenidos: number | null
        }
      }
    }
    Functions: {
      calcular_puntos_prediccion: {
        Args: { partido_id: string }
        Returns: void
      }
    }
    Enums: {
      estado_partido: EstadoPartido
      fase_partido: FasePartido
      tipo_evento: TipoEvento
    }
  }
}

// ── Convenience row types ──────────────────────────────────────────────────────
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type GrupoTorneo = Database['public']['Tables']['grupos_torneo']['Row']
export type UsuarioGrupo = Database['public']['Tables']['usuarios_grupos']['Row']
export type Equipo = Database['public']['Tables']['equipos']['Row']
export type GrupoEquipo = Database['public']['Tables']['grupo_equipos']['Row']
export type Partido = Database['public']['Tables']['partidos']['Row']
export type EventoPartido = Database['public']['Tables']['eventos_partido']['Row']
export type Playoff = Database['public']['Tables']['playoffs']['Row']
export type Prediccion = Database['public']['Tables']['predicciones']['Row']
export type ReglasPuntaje = Database['public']['Tables']['reglas_puntaje']['Row']
export type HistorialPuntos = Database['public']['Tables']['historial_puntos']['Row']

// ── Convenience view types ─────────────────────────────────────────────────────
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row']
export type PartidoEnVivo = Database['public']['Views']['partidos_en_vivo']['Row']
export type PrediccionVsResultado = Database['public']['Views']['predicciones_vs_resultado']['Row']

// ── Insert / Update types ──────────────────────────────────────────────────────
export type EquipoInsert = Database['public']['Tables']['equipos']['Insert']
export type PartidoInsert = Database['public']['Tables']['partidos']['Insert']
export type PartidoUpdate = Database['public']['Tables']['partidos']['Update']
export type PrediccionInsert = Database['public']['Tables']['predicciones']['Insert']
export type PrediccionUpdate = Database['public']['Tables']['predicciones']['Update']
export type EventoInsert = Database['public']['Tables']['eventos_partido']['Insert']

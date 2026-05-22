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
          email: string
          nombre: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          nombre?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      grupos_torneo: {
        Row: {
          id: string
          nombre: string
          codigo_invitacion: string
          creador_id: string
          max_participantes: number | null
          es_publico: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          codigo_invitacion?: string
          creador_id: string
          max_participantes?: number | null
          es_publico?: boolean
          created_at?: string
        }
        Update: {
          nombre?: string
          max_participantes?: number | null
          es_publico?: boolean
        }
      }
      usuarios_grupos: {
        Row: {
          id: string
          usuario_id: string
          grupo_id: string
          puntos_total: number
          joined_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          grupo_id: string
          puntos_total?: number
          joined_at?: string
        }
        Update: {
          puntos_total?: number
        }
      }
      equipos: {
        Row: {
          id: string
          api_football_id: number | null
          nombre_pais: string
          codigo_iso: string
          continente: string
          ranking_fifa: number
          grupo_fase: string
        }
        Insert: {
          id?: string
          api_football_id?: number | null
          nombre_pais: string
          codigo_iso: string
          continente: string
          ranking_fifa: number
          grupo_fase: string
        }
        Update: {
          api_football_id?: number | null
          nombre_pais?: string
          codigo_iso?: string
          continente?: string
          ranking_fifa?: number
          grupo_fase?: string
        }
      }
      grupo_equipos: {
        Row: {
          id: string
          grupo_letra: string
          equipo_id: string
          pj: number
          pg: number
          pe: number
          pp: number
          gf: number
          gc: number
        }
        Insert: {
          id?: string
          grupo_letra: string
          equipo_id: string
          pj?: number
          pg?: number
          pe?: number
          pp?: number
          gf?: number
          gc?: number
        }
        Update: {
          pj?: number
          pg?: number
          pe?: number
          pp?: number
          gf?: number
          gc?: number
        }
      }
      partidos: {
        Row: {
          id: string
          api_football_id: number
          equipo_local_id: string
          equipo_visitante_id: string
          fecha_hora: string
          estadio: string | null
          ciudad: string | null
          fase: FasePartido
          estado: EstadoPartido
          minuto_juego: number | null
          periodo: string | null
          goles_local: number | null
          goles_visitante: number | null
          tarjetas_amarillas_local: number | null
          tarjetas_amarillas_visitante: number | null
          tarjetas_rojas_local: number | null
          tarjetas_rojas_visitante: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_football_id: number
          equipo_local_id: string
          equipo_visitante_id: string
          fecha_hora: string
          estadio?: string | null
          ciudad?: string | null
          fase: FasePartido
          estado?: EstadoPartido
          minuto_juego?: number | null
          periodo?: string | null
          goles_local?: number | null
          goles_visitante?: number | null
          tarjetas_amarillas_local?: number | null
          tarjetas_amarillas_visitante?: number | null
          tarjetas_rojas_local?: number | null
          tarjetas_rojas_visitante?: number | null
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
          updated_at?: string
        }
      }
      eventos_partido: {
        Row: {
          id: string
          partido_id: string
          api_event_id: number | null
          tipo: TipoEvento
          minuto: number
          minuto_extra: number | null
          equipo_id: string
          jugador_nombre: string | null
          jugador_asistencia: string | null
          created_at: string
        }
        Insert: {
          id?: string
          partido_id: string
          api_event_id?: number | null
          tipo: TipoEvento
          minuto: number
          minuto_extra?: number | null
          equipo_id: string
          jugador_nombre?: string | null
          jugador_asistencia?: string | null
          created_at?: string
        }
        Update: {
          tipo?: TipoEvento
          minuto?: number
          minuto_extra?: number | null
          jugador_nombre?: string | null
          jugador_asistencia?: string | null
        }
      }
      playoffs: {
        Row: {
          id: string
          partido_id: string
          ronda: string
          penales_local: number | null
          penales_visitante: number | null
          ganador_id: string | null
        }
        Insert: {
          id?: string
          partido_id: string
          ronda: string
          penales_local?: number | null
          penales_visitante?: number | null
          ganador_id?: string | null
        }
        Update: {
          penales_local?: number | null
          penales_visitante?: number | null
          ganador_id?: string | null
        }
      }
      predicciones: {
        Row: {
          id: string
          usuario_id: string
          partido_id: string
          goles_local_pred: number
          goles_visitante_pred: number
          puntos_obtenidos: number | null
          calculado_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          partido_id: string
          goles_local_pred: number
          goles_visitante_pred: number
          puntos_obtenidos?: number | null
          calculado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          goles_local_pred?: number
          goles_visitante_pred?: number
          puntos_obtenidos?: number | null
          calculado_at?: string | null
          updated_at?: string
        }
      }
      reglas_puntaje: {
        Row: {
          id: string
          fase: FasePartido
          acierto_resultado: number
          acierto_marcador_exacto: number
          acierto_diferencia_goles: number | null
        }
        Insert: {
          id?: string
          fase: FasePartido
          acierto_resultado: number
          acierto_marcador_exacto: number
          acierto_diferencia_goles?: number | null
        }
        Update: {
          acierto_resultado?: number
          acierto_marcador_exacto?: number
          acierto_diferencia_goles?: number | null
        }
      }
      historial_puntos: {
        Row: {
          id: string
          usuario_id: string
          grupo_id: string
          partido_id: string
          puntos: number
          detalle: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          grupo_id: string
          partido_id: string
          puntos: number
          detalle?: string | null
          created_at?: string
        }
        Update: {
          puntos?: number
          detalle?: string | null
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          grupo_id: string
          usuario_id: string
          nombre: string
          avatar_url: string | null
          puntos_total: number
          posicion: number
        }
      }
      partidos_en_vivo: {
        Row: {
          id: string
          api_football_id: number
          equipo_local_id: string
          equipo_visitante_id: string
          nombre_local: string
          nombre_visitante: string
          codigo_iso_local: string
          codigo_iso_visitante: string
          goles_local: number | null
          goles_visitante: number | null
          minuto_juego: number | null
          periodo: string | null
          estado: EstadoPartido
          fase: FasePartido
          estadio: string | null
          ciudad: string | null
          fecha_hora: string
        }
      }
      predicciones_vs_resultado: {
        Row: {
          prediccion_id: string
          usuario_id: string
          partido_id: string
          nombre_local: string
          nombre_visitante: string
          goles_local_pred: number
          goles_visitante_pred: number
          goles_local_real: number | null
          goles_visitante_real: number | null
          estado_partido: EstadoPartido
          puntos_obtenidos: number | null
          fase: FasePartido
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

// Convenience row types
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

// Convenience view types
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row']
export type PartidoEnVivo = Database['public']['Views']['partidos_en_vivo']['Row']
export type PrediccionVsResultado = Database['public']['Views']['predicciones_vs_resultado']['Row']

// Insert types
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type GrupoTorneoInsert = Database['public']['Tables']['grupos_torneo']['Insert']
export type PrediccionInsert = Database['public']['Tables']['predicciones']['Insert']
export type PrediccionUpdate = Database['public']['Tables']['predicciones']['Update']
export type PartidoInsert = Database['public']['Tables']['partidos']['Insert']
export type PartidoUpdate = Database['public']['Tables']['partidos']['Update']
export type EventoInsert = Database['public']['Tables']['eventos_partido']['Insert']
export type EquipoInsert = Database['public']['Tables']['equipos']['Insert']

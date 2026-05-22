# Prode Mundial 2026 — Backend

Backend completo para una app de prode del Mundial 2026.
**Stack:** Node.js · TypeScript · Supabase JS v2 · Deno (Edge Functions)

---

## Estructura del proyecto

```
.
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Clientes Supabase (público + admin)
│   ├── types/
│   │   └── database.types.ts     # Tipos TypeScript del schema
│   └── services/
│       ├── usuarios.ts
│       ├── torneos.ts
│       ├── partidos.ts
│       ├── predicciones.ts
│       ├── leaderboard.ts
│       ├── estadisticas.ts
│       ├── eventos.ts
│       └── index.ts              # Re-exporta todo
├── scripts/
│   ├── seed.ts                   # Carga los 48 equipos
│   └── sync-fixture.ts          # Carga el fixture completo desde API-Football
├── supabase/
│   └── functions/
│       └── sync-live-matches/
│           └── index.ts         # Edge Function (Deno) — sincroniza cada 5 min
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` con tus valores:

| Variable | Dónde encontrarla |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (¡no exponer al cliente!) |
| `API_FOOTBALL_KEY` | [api-football.com](https://www.api-football.com) → Dashboard → API Key |

### 3. Verificar TypeScript

```bash
npm run typecheck
```

---

## Inicializar datos (primera vez)

Los pasos deben ejecutarse en orden.

### Paso 1 — Seed: cargar los 48 equipos

```bash
npm run seed
```

Inserta los 48 equipos del Mundial 2026 (grupos A–L, sorteo del 5/12/2025) e inicializa la tabla `grupo_equipos` con standings en 0.

### Paso 2 — Sync fixture: cargar todos los partidos

```bash
npm run sync-fixture
```

Llama a API-Football (`/fixtures?league=1&season=2026`) y hace upsert de todos los partidos en la tabla `partidos`. También actualiza `api_football_id` en `equipos` para que el Edge Function pueda cruzar datos.

> **Nota:** API-Football tiene límite de requests según tu plan. El sync-fixture hace una sola llamada; el Edge Function hace una llamada por ejecución más N llamadas de eventos (una por partido en curso).

---

## Edge Function — sync-live-matches

### Qué hace (cada 5 minutos)

1. Llama a `/fixtures?league=1&season=2026&date=HOY`
2. Por cada partido encontrado: upsert en `partidos` (estado, minuto, goles, tarjetas)
3. Por cada partido **en curso**: sincroniza eventos en `eventos_partido` (goles, tarjetas, sustituciones)
4. Por cada partido **recién finalizado**: llama a `calcular_puntos_prediccion(partido_id)`

### Deploy a Supabase

```bash
# Instalar Supabase CLI si no la tenés
npm install -g supabase

# Login
supabase login

# Linkear al proyecto
supabase link --project-ref TU_PROJECT_REF

# Deploy de la función
supabase functions deploy sync-live-matches --no-verify-jwt
```

### Variables de entorno en producción

En el Supabase Dashboard → Edge Functions → sync-live-matches → Secrets:

```
SUPABASE_URL          = (se inyecta automáticamente)
SUPABASE_SERVICE_ROLE_KEY = tu-service-role-key
API_FOOTBALL_KEY      = tu-api-football-key
```

### Configurar el cron en Supabase (cada 5 minutos)

En el Dashboard → Database → Extensions, habilitá `pg_cron`. Luego en el SQL Editor:

```sql
select cron.schedule(
  'sync-live-matches',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := 'https://TU_PROJECT_REF.supabase.co/functions/v1/sync-live-matches',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
```

Reemplazá `TU_PROJECT_REF` con el ID de tu proyecto de Supabase.

Para verificar que el cron está activo:

```sql
select * from cron.job;
```

Para eliminar el cron:

```sql
select cron.unschedule('sync-live-matches');
```

---

## Servicios disponibles

```typescript
import {
  getUsuario, updatePerfil,
  getTorneosDeUsuario, createTorneo, joinTorneoByCode,
  getPartidosByFase, getPartidosEnVivo, getPartidoById,
  getPrediccionesDeUsuario, upsertPrediccion, getPrediccionesVsResultados,
  getLeaderboardByTorneo,
  getEstadisticasPersonales,
  getEventosByPartido,
} from './src/services'
```

### Estadísticas personales

`getEstadisticasPersonales(usuarioId)` devuelve:

- **puntos_por_grupo_mundial**: puntos acumulados por grupo del Mundial (A–L)
- **diferencia_por_continente**: diferencia promedio de goles predichos vs reales, agrupada por continente
- **puntos_por_fase**: puntos totales por fase (grupos, octavos, cuartos, semifinal, etc.)
- **goleador_imaginario**: top 10 equipos cuyos goles el usuario predijo con mayor precisión

---

## Notas importantes

- El **World Cup 2026 tiene 48 equipos en 12 grupos (A–L)**, no 32 como ediciones anteriores.
- El **League ID de API-Football para el Mundial es `1`**, Season `2026`.
- Los códigos ISO de **Inglaterra (`EN`) y Escocia (`SC`) son códigos FIFA**, no ISO 3166-1 estándar (el código ISO del Reino Unido es `GB`).
- El cliente `supabaseAdmin` usa `SERVICE_ROLE_KEY` y bypasea RLS — **nunca exponerlo al cliente**.
- El script `sync-fixture` usa un mapa de alias de nombres para resolver equipos cuando `api_football_id` aún no está registrado en la BD.

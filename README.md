# App Gym — tu progreso físico

App web (PWA) para registrar y visualizar tu progreso de gym, básquet, cardio y
medidas corporales, pensada para usarse rápido desde el celular mientras entrenás.
Incluye biblioteca de ejercicios con técnica y tutoriales, progreso detallado por
ejercicio, rutinas predefinidas y propias, fotos de progreso, notificaciones push,
modo claro/oscuro, y un asistente con IA que te da un tip diario basado en tus datos reales.

## Stack

- **Next.js 16** (App Router) — desplegado en **Vercel**
- **Supabase** — base de datos Postgres, autenticación y Storage (fotos)
- **Tailwind CSS v4** — estilos, con tokens de tema para modo claro/oscuro
- **Recharts** — gráficas del dashboard
- **Framer Motion** — animaciones
- **OpenAI (gpt-4o-mini)** — tip diario del asistente, generado server-side
- **web-push** — notificaciones push (Web Push API estándar, sin servicios de terceros)
- PWA instalable (se puede "agregar a la pantalla de inicio" en el celular)

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Andá a **SQL Editor** y ejecutá, EN ORDEN, el contenido completo de:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_library_ai_and_metrics.sql`
   3. `supabase/migrations/0003_photos_routines_push.sql`

   Esto crea todas las tablas, seguridad a nivel de fila (RLS), la biblioteca
   completa de ~45 ejercicios, el bucket de Storage para fotos de progreso,
   4 rutinas de ejemplo (Push/Pull/Legs/Full body) y la tabla de suscripciones push.
3. Andá a **Project Settings → API** y copiá:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (sección "Project API keys", ⚠️ secreta) → será
     `SUPABASE_SERVICE_ROLE_KEY` (solo la usan las rutas de cron, nunca el navegador)
4. (Opcional) En **Authentication → Providers**, confirmá que "Email" esté
   habilitado. Si querés que el registro sea inmediato sin confirmar correo
   (recomendado para uso personal), desactivá "Confirm email" en
   **Authentication → Sign In / Providers → Email**.

## 2. Obtener una API key de OpenAI (tip diario del asistente)

1. Entrá a [platform.openai.com/api-keys](https://platform.openai.com/api-keys) y
   creá una nueva key → `OPENAI_API_KEY` (server-only).
2. Sin esta variable la app funciona igual, solo sin la tarjeta "Tip de hoy".
3. Se genera un solo tip por usuario por día (cacheado), con `gpt-4o-mini` —
   el gasto es mínimo (fracciones de centavo por día).

## 3. Generar las claves VAPID (notificaciones push)

Las notificaciones push usan el estándar Web Push (no dependen de Firebase ni
de ningún servicio de pago). Generá tu propio par de claves una sola vez:

```bash
npx web-push generate-vapid-keys
```

Esto imprime un `Public Key` y un `Private Key`:

- `Public Key` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY`
- Además definí `VAPID_SUBJECT=mailto:tu-correo@ejemplo.com` (identifica quién
  envía las notificaciones, lo pide la spec de Web Push).

Sin estas variables, la app funciona igual — el botón de "Activar notificaciones"
en Ajustes simplemente no aparece disponible.

## 4. Notificaciones automáticas (Vercel Cron)

El archivo `vercel.json` ya define dos tareas programadas:

- `/api/cron/daily-tip` — todos los días a las **7:00 a. m. (hora Bogotá)**:
  genera (si hace falta) y envía por push el tip diario del asistente.
- `/api/cron/streak-reminder` — todos los días a las **8:00 p. m. (hora Bogotá)**:
  si llevás 2+ días seguidos entrenando y todavía no registraste nada hoy, te
  avisa para no cortar la racha.

Para que Vercel autorice esas llamadas, definí una variable de entorno
`CRON_SECRET` con cualquier string aleatorio largo (por ejemplo generado con
`openssl rand -hex 32`) — Vercel la agrega automáticamente como header
`Authorization: Bearer <CRON_SECRET>` en cada llamada programada, y las rutas
verifican ese header antes de hacer nada.

> Los Cron Jobs de Vercel están disponibles incluso en el plan Hobby (gratis),
> con un mínimo de una ejecución por día por cron — encaja perfecto con este uso.

## 5. Variables de entorno — resumen

```bash
npm install
cp .env.local.example .env.local
# completá las variables (ver secciones 1-3 de arriba)
npm run dev
```

| Variable | Obligatoria | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Cliente y servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Cliente y servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo para push | Rutas `/api/cron/*` |
| `OPENAI_API_KEY` | Opcional | Tip diario del asistente |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Solo para push | Cliente (suscripción) |
| `VAPID_PRIVATE_KEY` | Solo para push | Rutas `/api/cron/*` |
| `VAPID_SUBJECT` | Solo para push | Rutas `/api/cron/*` |
| `CRON_SECRET` | Solo para push | Autoriza las rutas de cron |

Abrí http://localhost:3000 — te va a redirigir a `/login`. Creá tu cuenta con
tu correo y una contraseña.

## 6. Desplegar en Vercel

1. Subí este proyecto a un repo de GitHub (o usá `vercel` CLI directo).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. En **Environment Variables** agregá todas las de la tabla de arriba.
4. Deploy. Vercel te da una URL tipo `https://app-gym-tuusuario.vercel.app`
   y activa automáticamente los Cron Jobs definidos en `vercel.json`.

## 7. Instalar como app en el celular

Abrí la URL de Vercel en el navegador del celular:

- **Android (Chrome)**: menú ⋮ → "Agregar a pantalla de inicio" / "Instalar app".
- **iPhone (Safari)**: botón compartir → "Agregar a pantalla de inicio".

Va a quedar como un ícono más, abriendo en pantalla completa sin barra del
navegador. Desde **Ajustes (⚙️ en el header) → Notificaciones push → Activar**
podés sumar recordatorios aunque no tengas la app abierta.

## Funcionalidades

- **Registrar (⚡)**: pantalla optimizada para cargar datos en segundos.
  - **Gym**: selector visual de ejercicio (buscador, filtro por músculo,
    recientes), botón "🔁 Repetir última serie" para loguear en un toque,
    steppers grandes de peso/reps, feedback animado al guardar.
  - **Básquet**: tipo de entrenamiento, contador de tiros anotados/intentados,
    duración y % de acierto en vivo.
  - **Cardio**: duración con presets rápidos y notas.
- **Rutinas (📋)**: 4 plantillas de ejemplo (Push, Pull, Legs, Full body) más
  las que vos armes. Cada rutina muestra sus ejercicios con series/reps
  objetivo, un check ✓ cuando ya lo registraste hoy, y acceso directo a
  `/log` con el ejercicio correcto preseleccionado.
- **Dashboard (📊)**: tip diario del asistente IA (basado en tus datos reales,
  nunca inventa cifras) y gráficas de frecuencia semanal, peso corporal,
  % de grasa, progresión de cargas y precisión de tiro.
- **Ejercicios (📚)**: biblioteca completa (~45 ejercicios) filtrable por
  grupo muscular, con descripción, músculos trabajados, equipo, dificultad,
  botón a tutoriales reales de YouTube (vía búsqueda, no links fijos), e
  historial de progreso con récords personales (PR).
- **Medidas (📏)**: cadencia semanal o mensual configurable, con aviso de
  próxima medición, más acceso directo a **fotos de progreso**.
- **Fotos de progreso**: subida desde cámara o galería (Supabase Storage,
  privado por usuario), grilla cronológica y modo "comparar" para ver dos
  fotos lado a lado.
- **Ajustes (⚙️)**: toggle de modo claro/oscuro (persistente), activar/desactivar
  notificaciones push, y cerrar sesión.
- **Notificaciones push**: tip diario y aviso de racha en riesgo (ver sección 4).

## Estructura del proyecto

```
src/
  app/
    login/                     # pantalla de login/registro
    api/cron/                  # rutas de notificaciones programadas
      daily-tip/
      streak-reminder/
    (app)/                     # rutas protegidas (requieren sesión)
      layout.tsx                # header + nav inferior
      bottom-nav.tsx             # navegación con indicador animado
      log/                       # registro rápido (gym / básquet / cardio)
      routines/                  # rutinas predefinidas y propias
        [id]/                     # detalle + checklist del día
        new/                       # crear rutina propia
      dashboard/                  # gráficas + tip diario de IA
      exercises/                   # biblioteca de ejercicios
        [id]/                       # detalle + progreso por ejercicio
      metrics/                    # medidas corporales
      photos/                      # fotos de progreso
      settings/                     # tema, notificaciones, cerrar sesión
  components/
    exercise-picker.tsx         # selector visual de ejercicios (bottom sheet)
    theme-provider.tsx           # wrapper de next-themes
    theme-toggle.tsx              # switch de modo claro/oscuro
    tap.tsx                        # botón con animación de presión
    success-toast.tsx               # feedback animado al guardar
    count-up.tsx                     # números que cuentan al aparecer
    service-worker-register.tsx       # registra /sw.js
  lib/
    supabase/                   # clientes de Supabase (browser/server/proxy/admin)
    session.ts                   # helper para reusar la sesión de hoy
    daily-tip.ts                  # cálculo de estadísticas + llamada a OpenAI
    push-client.ts                 # suscripción push desde el navegador
    push-server.ts                  # envío de push con web-push
    push-fanout.ts                   # envía a todos los dispositivos de un usuario
    chart-colors.ts                   # paleta de gráficas por tema (dataviz)
    muscle-icons.ts                    # ícono/gradiente por grupo muscular
    types.ts                            # tipos del dominio
public/
  sw.js                        # service worker (solo push, sin cache de assets)
supabase/
  migrations/
    0001_init.sql               # esquema base
    0002_library_ai_and_metrics.sql   # biblioteca completa, IA, frecuencia de medidas
    0003_photos_routines_push.sql      # Storage de fotos, rutinas, suscripciones push
vercel.json                    # cron jobs (tip diario y aviso de racha)
```

## Extender la app

Ideas para seguir creciendo esto (buen punto de partida para continuar en Claude Code):

- Reemplazar el link de búsqueda de YouTube por un video embebido real usando
  la YouTube Data API (requiere otra API key de Google Cloud).
- Reordenar ejercicios dentro de una rutina (drag and drop) y editar rutinas ya creadas.
- Notificación push al llegar la fecha de la próxima medición (semanal/mensual).
- Comparación de fotos con overlay/slider en vez de lado a lado.
- Compartir progreso con un entrenador (RLS ya está pensado para
  extenderse a "compartir por invitación").
- Aplicar el mismo pulido de modo claro a badges de estado que quedaron con
  colores fijos de acento (revisar `dark:` vs. clases base en componentes
  con `text-orange-400`, `text-cyan-300`, etc. — funcionan bien pero no se
  retocaron finamente para contraste en modo claro).

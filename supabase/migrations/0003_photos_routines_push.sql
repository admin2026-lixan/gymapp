-- App Gym: fotos de progreso, rutinas predefinidas y notificaciones push
-- Ejecutar DESPUÉS de 0001_init.sql y 0002_library_ai_and_metrics.sql

-- =========================================================
-- 1. FOTOS DE PROGRESO (Supabase Storage + tabla de metadatos)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Políticas de Storage: cada usuario solo puede ver/subir/borrar archivos
-- dentro de una carpeta con su propio user_id como primer segmento de ruta
-- (convención: progress-photos/<user_id>/<archivo>).
create policy "progress-photos: select own"
on storage.objects for select
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress-photos: insert own"
on storage.objects for insert
with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress-photos: delete own"
on storage.objects for delete
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at date not null default current_date,
  storage_path text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

create policy "photos: select own" on public.progress_photos
  for select using (auth.uid() = user_id);
create policy "photos: insert own" on public.progress_photos
  for insert with check (auth.uid() = user_id);
create policy "photos: delete own" on public.progress_photos
  for delete using (auth.uid() = user_id);

create index if not exists idx_photos_user_date on public.progress_photos(user_id, taken_at desc);

-- =========================================================
-- 2. RUTINAS (plantillas globales + rutinas propias del usuario)
-- =========================================================
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = plantilla global
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "routines: select global or own" on public.routines
  for select using (user_id is null or auth.uid() = user_id);
create policy "routines: insert own" on public.routines
  for insert with check (auth.uid() = user_id);
create policy "routines: update own" on public.routines
  for update using (auth.uid() = user_id);
create policy "routines: delete own" on public.routines
  for delete using (auth.uid() = user_id);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_index integer not null default 0,
  target_sets integer,
  target_reps integer,
  notes text
);

alter table public.routine_exercises enable row level security;

-- Sigue la misma visibilidad que la rutina a la que pertenece
create policy "routine_exercises: select via routine" on public.routine_exercises
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and (r.user_id is null or r.user_id = auth.uid())
    )
  );
create policy "routine_exercises: insert via own routine" on public.routine_exercises
  for insert with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );
create policy "routine_exercises: update via own routine" on public.routine_exercises
  for update using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );
create policy "routine_exercises: delete via own routine" on public.routine_exercises
  for delete using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );

-- Plantillas de ejemplo (4 rutinas clásicas), usando el catálogo global de ejercicios
do $$
declare
  r_id uuid;
begin
  -- Push (empuje)
  if not exists (select 1 from public.routines where name = 'Push (empuje)' and user_id is null) then
    insert into public.routines (name, description) values
      ('Push (empuje)', 'Pecho, hombros y tríceps') returning id into r_id;
    insert into public.routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps)
    select r_id, e.id, v.ord, v.sets, v.reps
    from (values
      ('Press de banca', 1, 4, 8),
      ('Press militar con mancuernas', 2, 3, 10),
      ('Press inclinado con mancuernas', 3, 3, 10),
      ('Elevaciones laterales', 4, 3, 15),
      ('Extensión de tríceps', 5, 3, 12)
    ) as v(name, ord, sets, reps)
    join public.exercises e on e.name = v.name and e.user_id is null;
  end if;

  -- Pull (jalón)
  if not exists (select 1 from public.routines where name = 'Pull (jalón)' and user_id is null) then
    insert into public.routines (name, description) values
      ('Pull (jalón)', 'Espalda y bíceps') returning id into r_id;
    insert into public.routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps)
    select r_id, e.id, v.ord, v.sets, v.reps
    from (values
      ('Peso muerto', 1, 4, 6),
      ('Dominadas', 2, 3, 8),
      ('Remo con barra', 3, 3, 10),
      ('Jalón al pecho', 4, 3, 12),
      ('Curl de bíceps', 5, 3, 12)
    ) as v(name, ord, sets, reps)
    join public.exercises e on e.name = v.name and e.user_id is null;
  end if;

  -- Legs (piernas)
  if not exists (select 1 from public.routines where name = 'Legs (piernas)' and user_id is null) then
    insert into public.routines (name, description) values
      ('Legs (piernas)', 'Cuádriceps, isquiotibiales y glúteos') returning id into r_id;
    insert into public.routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps)
    select r_id, e.id, v.ord, v.sets, v.reps
    from (values
      ('Sentadilla', 1, 4, 8),
      ('Peso muerto rumano', 2, 3, 10),
      ('Prensa de piernas', 3, 3, 12),
      ('Sentadilla búlgara', 4, 3, 10),
      ('Elevación de talones (gemelos)', 5, 4, 15)
    ) as v(name, ord, sets, reps)
    join public.exercises e on e.name = v.name and e.user_id is null;
  end if;

  -- Full body
  if not exists (select 1 from public.routines where name = 'Full body' and user_id is null) then
    insert into public.routines (name, description) values
      ('Full body', 'Cuerpo completo en una sola sesión, ideal si entrenás 2-3 veces por semana') returning id into r_id;
    insert into public.routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps)
    select r_id, e.id, v.ord, v.sets, v.reps
    from (values
      ('Sentadilla', 1, 3, 10),
      ('Press de banca', 2, 3, 10),
      ('Remo con barra', 3, 3, 10),
      ('Press militar', 4, 3, 10),
      ('Plancha', 5, 3, 1)
    ) as v(name, ord, sets, reps)
    join public.exercises e on e.name = v.name and e.user_id is null;
  end if;
end $$;

-- =========================================================
-- 3. SUSCRIPCIONES A NOTIFICACIONES PUSH
-- =========================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subs: select own" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "push_subs: insert own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "push_subs: delete own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Nota: el envío real de notificaciones (cron de tip diario y de racha en
-- riesgo) corre con la Service Role Key desde rutas /api/cron/*, que
-- necesitan leer suscripciones de TODOS los usuarios — por eso esas rutas
-- usan el cliente de servicio y no quedan sujetas a RLS.

-- App Gym: esquema inicial
-- Ejecutar en el SQL Editor de Supabase (https://app.supabase.com -> tu proyecto -> SQL Editor)

-- =========================================================
-- 1. PERFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  height_cm numeric,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Crea el perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 2. EJERCICIOS (catálogo, precargado + los que el usuario cree)
-- =========================================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = ejercicio global/predeterminado
  name text not null,
  category text not null default 'gym' check (category in ('gym', 'cardio')),
  muscle_group text,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises: select global or own" on public.exercises
  for select using (user_id is null or auth.uid() = user_id);
create policy "exercises: insert own" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "exercises: update own" on public.exercises
  for update using (auth.uid() = user_id);
create policy "exercises: delete own" on public.exercises
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 3. SESIONES DE ENTRENAMIENTO (gym, básquet o cardio)
-- =========================================================
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('gym', 'basketball', 'cardio')),
  started_at timestamptz not null default now(),
  duration_min integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "sessions: select own" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "sessions: insert own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions: update own" on public.workout_sessions
  for update using (auth.uid() = user_id);
create policy "sessions: delete own" on public.workout_sessions
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 4. SETS DE GYM (series dentro de una sesión de tipo 'gym')
-- =========================================================
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_number integer not null default 1,
  weight_kg numeric,
  reps integer,
  rpe numeric, -- percepción de esfuerzo 1-10 (opcional)
  created_at timestamptz not null default now()
);

alter table public.exercise_sets enable row level security;

create policy "sets: select own" on public.exercise_sets
  for select using (auth.uid() = user_id);
create policy "sets: insert own" on public.exercise_sets
  for insert with check (auth.uid() = user_id);
create policy "sets: update own" on public.exercise_sets
  for update using (auth.uid() = user_id);
create policy "sets: delete own" on public.exercise_sets
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 5. DETALLE DE SESIONES DE BÁSQUET
-- =========================================================
create table if not exists public.basketball_details (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_type text, -- ej: 'tiro', 'resistencia', 'tecnica', 'partido', 'dribbling'
  shots_made integer,
  shots_attempted integer,
  created_at timestamptz not null default now()
);

alter table public.basketball_details enable row level security;

create policy "bball: select own" on public.basketball_details
  for select using (auth.uid() = user_id);
create policy "bball: insert own" on public.basketball_details
  for insert with check (auth.uid() = user_id);
create policy "bball: update own" on public.basketball_details
  for update using (auth.uid() = user_id);
create policy "bball: delete own" on public.basketball_details
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 6. MÉTRICAS CORPORALES (cambio físico)
-- =========================================================
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, measured_at)
);

alter table public.body_metrics enable row level security;

create policy "metrics: select own" on public.body_metrics
  for select using (auth.uid() = user_id);
create policy "metrics: insert own" on public.body_metrics
  for insert with check (auth.uid() = user_id);
create policy "metrics: update own" on public.body_metrics
  for update using (auth.uid() = user_id);
create policy "metrics: delete own" on public.body_metrics
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 7. ÍNDICES para consultas rápidas del dashboard
-- =========================================================
create index if not exists idx_sessions_user_started on public.workout_sessions(user_id, started_at desc);
create index if not exists idx_sets_user_exercise on public.exercise_sets(user_id, exercise_id, created_at);
create index if not exists idx_metrics_user_date on public.body_metrics(user_id, measured_at desc);
create index if not exists idx_bball_session on public.basketball_details(session_id);

-- =========================================================
-- 8. EJERCICIOS PREDETERMINADOS (catálogo global, user_id = null)
-- =========================================================
insert into public.exercises (name, category, muscle_group)
select v.name, v.category, v.muscle_group
from (values
  ('Press de banca', 'gym', 'Pecho'),
  ('Sentadilla', 'gym', 'Piernas'),
  ('Peso muerto', 'gym', 'Espalda/Piernas'),
  ('Press militar', 'gym', 'Hombros'),
  ('Dominadas', 'gym', 'Espalda'),
  ('Remo con barra', 'gym', 'Espalda'),
  ('Curl de bíceps', 'gym', 'Brazos'),
  ('Extensión de tríceps', 'gym', 'Brazos'),
  ('Zancadas', 'gym', 'Piernas'),
  ('Plancha', 'gym', 'Core'),
  ('Prensa de piernas', 'gym', 'Piernas'),
  ('Elevaciones laterales', 'gym', 'Hombros')
) as v(name, category, muscle_group)
where not exists (
  select 1 from public.exercises e where e.name = v.name and e.user_id is null
);

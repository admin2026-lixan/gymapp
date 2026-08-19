-- App Gym: biblioteca de ejercicios completa, asistente IA y cadencia de medidas
-- Ejecutar DESPUÉS de 0001_init.sql en el SQL Editor de Supabase

-- =========================================================
-- 1. AMPLIAR TABLA DE EJERCICIOS
-- =========================================================
alter table public.exercises
  add column if not exists description text,
  add column if not exists primary_muscle text,
  add column if not exists secondary_muscles text,
  add column if not exists equipment text,
  add column if not exists difficulty text check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  add column if not exists video_query text;

-- =========================================================
-- 2. FRECUENCIA DE MEDICIÓN CORPORAL EN EL PERFIL
-- =========================================================
alter table public.profiles
  add column if not exists measurement_frequency text not null default 'weekly'
    check (measurement_frequency in ('weekly', 'monthly'));

-- =========================================================
-- 3. TIPS DIARIOS DEL ASISTENTE IA (cacheados, uno por día)
-- =========================================================
create table if not exists public.daily_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tip_date date not null default current_date,
  tip_text text not null,
  highlight_type text, -- 'pr' | 'streak' | 'consistency' | 'general'
  created_at timestamptz not null default now(),
  unique (user_id, tip_date)
);

alter table public.daily_tips enable row level security;

create policy "tips: select own" on public.daily_tips
  for select using (auth.uid() = user_id);
create policy "tips: insert own" on public.daily_tips
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- 4. ACTUALIZAR / AMPLIAR CATÁLOGO DE EJERCICIOS
-- Se actualizan los 12 ejercicios ya creados en 0001 con su info completa
-- y se agregan ~30 más, cubriendo todos los grupos musculares.
-- =========================================================

-- Helper: actualiza por nombre (solo catálogo global, user_id is null)
update public.exercises set
  description = 'Ejercicio compuesto para el tren superior. Acostado en el banco, baja la barra al pecho controladamente y empuja hacia arriba.',
  primary_muscle = 'Pecho', secondary_muscles = 'Tríceps, Hombro anterior',
  equipment = 'Barra y banco', difficulty = 'intermedio',
  video_query = 'como hacer press de banca tecnica correcta'
where name = 'Press de banca' and user_id is null;

update public.exercises set
  description = 'El rey de los ejercicios de pierna. Baja las caderas como si te sentaras en una silla manteniendo el pecho erguido.',
  primary_muscle = 'Piernas', secondary_muscles = 'Glúteos, Core',
  equipment = 'Barra (o peso corporal)', difficulty = 'intermedio',
  video_query = 'como hacer sentadilla tecnica correcta'
where name = 'Sentadilla' and user_id is null;

update public.exercises set
  description = 'Ejercicio compuesto de cadena posterior. Levanta la barra del piso manteniendo la espalda neutra, empujando con las piernas y caderas.',
  primary_muscle = 'Espalda', secondary_muscles = 'Piernas, Glúteos, Core',
  equipment = 'Barra', difficulty = 'avanzado',
  video_query = 'como hacer peso muerto tecnica correcta'
where name = 'Peso muerto' and user_id is null;

update public.exercises set
  description = 'De pie, empuja la barra desde los hombros hacia arriba por encima de la cabeza, sin usar impulso de piernas.',
  primary_muscle = 'Hombros', secondary_muscles = 'Tríceps, Core',
  equipment = 'Barra', difficulty = 'intermedio',
  video_query = 'como hacer press militar tecnica correcta'
where name = 'Press militar' and user_id is null;

update public.exercises set
  description = 'Colgado de una barra, sube el cuerpo hasta que el mentón supere la barra, controlando la bajada.',
  primary_muscle = 'Espalda', secondary_muscles = 'Bíceps',
  equipment = 'Barra de dominadas', difficulty = 'avanzado',
  video_query = 'como hacer dominadas tecnica correcta principiantes'
where name = 'Dominadas' and user_id is null;

update public.exercises set
  description = 'Inclinado hacia adelante, tira de la barra hacia el abdomen apretando los omóplatos.',
  primary_muscle = 'Espalda', secondary_muscles = 'Bíceps',
  equipment = 'Barra', difficulty = 'intermedio',
  video_query = 'como hacer remo con barra tecnica correcta'
where name = 'Remo con barra' and user_id is null;

update public.exercises set
  description = 'De pie, flexiona los codos llevando la barra o mancuernas hacia los hombros, sin balancear el cuerpo.',
  primary_muscle = 'Brazos', secondary_muscles = 'Antebrazo',
  equipment = 'Barra o mancuernas', difficulty = 'principiante',
  video_query = 'como hacer curl de biceps tecnica correcta'
where name = 'Curl de bíceps' and user_id is null;

update public.exercises set
  description = 'Extiende los codos empujando una cuerda o barra hacia abajo, manteniendo los codos pegados al torso.',
  primary_muscle = 'Brazos', secondary_muscles = null,
  equipment = 'Polea', difficulty = 'principiante',
  video_query = 'como hacer extension de triceps en polea tecnica'
where name = 'Extensión de tríceps' and user_id is null;

update public.exercises set
  description = 'Da un paso largo hacia adelante y baja la rodilla trasera casi hasta el piso, alternando piernas.',
  primary_muscle = 'Piernas', secondary_muscles = 'Glúteos',
  equipment = 'Peso corporal o mancuernas', difficulty = 'principiante',
  video_query = 'como hacer zancadas tecnica correcta'
where name = 'Zancadas' and user_id is null;

update public.exercises set
  description = 'Mantén el cuerpo recto en línea desde la cabeza a los talones apoyado en antebrazos y pies.',
  primary_muscle = 'Core', secondary_muscles = null,
  equipment = 'Peso corporal', difficulty = 'principiante',
  video_query = 'como hacer plancha abdominal tecnica correcta'
where name = 'Plancha' and user_id is null;

update public.exercises set
  description = 'Sentado en la máquina, empuja la plataforma con las piernas extendiendo las rodillas sin bloquearlas.',
  primary_muscle = 'Piernas', secondary_muscles = 'Glúteos',
  equipment = 'Máquina prensa', difficulty = 'principiante',
  video_query = 'como hacer prensa de piernas tecnica correcta'
where name = 'Prensa de piernas' and user_id is null;

update public.exercises set
  description = 'De pie con mancuernas, eleva los brazos hacia los lados hasta la altura del hombro.',
  primary_muscle = 'Hombros', secondary_muscles = null,
  equipment = 'Mancuernas', difficulty = 'principiante',
  video_query = 'como hacer elevaciones laterales tecnica correcta'
where name = 'Elevaciones laterales' and user_id is null;

-- Nuevos ejercicios
insert into public.exercises (name, category, description, primary_muscle, secondary_muscles, equipment, difficulty, video_query)
select v.name, v.category, v.description, v.primary_muscle, v.secondary_muscles, v.equipment, v.difficulty, v.video_query
from (values
  ('Press inclinado con mancuernas', 'gym', 'Similar al press de banca pero en banco inclinado, enfatiza la parte superior del pecho.', 'Pecho', 'Hombro anterior, Tríceps', 'Mancuernas y banco', 'intermedio', 'press inclinado con mancuernas tecnica correcta'),
  ('Aperturas con mancuernas', 'gym', 'Acostado en banco, abre los brazos con mancuernas en arco controlado para estirar el pecho.', 'Pecho', null, 'Mancuernas y banco', 'principiante', 'aperturas con mancuernas tecnica correcta'),
  ('Fondos en paralelas', 'gym', 'Baja y sube el cuerpo entre dos barras paralelas flexionando los codos, inclinando el torso adelante para pecho.', 'Pecho', 'Tríceps, Hombro anterior', 'Paralelas', 'avanzado', 'como hacer fondos en paralelas tecnica'),
  ('Press de banca con mancuernas', 'gym', 'Variante del press de banca con mancuernas, permite mayor rango de movimiento.', 'Pecho', 'Tríceps, Hombro anterior', 'Mancuernas y banco', 'intermedio', 'press de banca con mancuernas tecnica'),
  ('Jalón al pecho', 'gym', 'Sentado en la polea alta, tira de la barra hacia el pecho controlando la subida.', 'Espalda', 'Bíceps', 'Polea alta', 'principiante', 'como hacer jalon al pecho tecnica correcta'),
  ('Remo con mancuerna a un brazo', 'gym', 'Apoyado en banco, tira de la mancuerna hacia la cadera manteniendo la espalda estable.', 'Espalda', 'Bíceps', 'Mancuerna y banco', 'principiante', 'remo con mancuerna a un brazo tecnica'),
  ('Remo en polea baja', 'gym', 'Sentado, tira del agarre hacia el abdomen manteniendo el torso erguido.', 'Espalda', 'Bíceps', 'Polea baja', 'principiante', 'remo en polea baja tecnica correcta'),
  ('Hiperextensiones', 'gym', 'En banco romano, baja el torso y súbelo activando la zona lumbar y glúteos.', 'Espalda', 'Glúteos', 'Banco romano', 'principiante', 'como hacer hiperextensiones lumbares tecnica'),
  ('Sentadilla búlgara', 'gym', 'Con el pie trasero elevado en un banco, baja en sentadilla con la pierna delantera.', 'Piernas', 'Glúteos', 'Mancuernas y banco', 'intermedio', 'sentadilla bulgara tecnica correcta'),
  ('Peso muerto rumano', 'gym', 'Con piernas casi rectas, baja la barra pegada a las piernas activando isquiotibiales.', 'Piernas', 'Glúteos, Espalda baja', 'Barra', 'intermedio', 'peso muerto rumano tecnica correcta'),
  ('Extensión de cuádriceps', 'gym', 'Sentado en máquina, extiende las rodillas levantando el peso con los cuádriceps.', 'Piernas', null, 'Máquina de extensión', 'principiante', 'extension de cuadriceps en maquina tecnica'),
  ('Curl femoral', 'gym', 'Acostado o sentado en máquina, flexiona las rodillas llevando el peso hacia los glúteos.', 'Piernas', null, 'Máquina de curl femoral', 'principiante', 'curl femoral en maquina tecnica'),
  ('Elevación de talones (gemelos)', 'gym', 'De pie, sube los talones lo más alto posible activando la pantorrilla.', 'Piernas', 'Pantorrilla', 'Máquina o peso corporal', 'principiante', 'elevacion de talones gemelos tecnica correcta'),
  ('Hip thrust', 'gym', 'Con la espalda apoyada en un banco, empuja la cadera hacia arriba activando glúteos.', 'Glúteos', 'Piernas', 'Barra y banco', 'intermedio', 'como hacer hip thrust tecnica correcta'),
  ('Patada de glúteo en polea', 'gym', 'De pie en la polea baja, empuja la pierna hacia atrás activando el glúteo.', 'Glúteos', 'Piernas', 'Polea baja', 'principiante', 'patada de gluteo en polea tecnica'),
  ('Press militar con mancuernas', 'gym', 'Sentado o de pie, empuja las mancuernas por encima de la cabeza.', 'Hombros', 'Tríceps', 'Mancuernas', 'intermedio', 'press militar con mancuernas tecnica correcta'),
  ('Elevaciones frontales', 'gym', 'De pie, eleva mancuernas al frente hasta la altura del hombro.', 'Hombros', null, 'Mancuernas', 'principiante', 'elevaciones frontales de hombro tecnica'),
  ('Pájaros (elevaciones posteriores)', 'gym', 'Inclinado hacia adelante, eleva mancuernas hacia los lados para el deltoide posterior.', 'Hombros', 'Espalda alta', 'Mancuernas', 'principiante', 'elevaciones posteriores pajaros hombro tecnica'),
  ('Encogimientos de hombros', 'gym', 'De pie con mancuernas o barra, eleva los hombros hacia las orejas.', 'Hombros', 'Trapecio', 'Mancuernas o barra', 'principiante', 'encogimientos de hombros trapecio tecnica'),
  ('Curl martillo', 'gym', 'Curl de bíceps con agarre neutro (palmas enfrentadas), trabaja también el antebrazo.', 'Brazos', 'Antebrazo', 'Mancuernas', 'principiante', 'curl martillo biceps tecnica correcta'),
  ('Curl en banco Scott', 'gym', 'Apoyado en el banco Scott, flexiona los codos aislando el bíceps.', 'Brazos', null, 'Barra Z y banco Scott', 'intermedio', 'curl en banco scott predicador tecnica'),
  ('Press francés', 'gym', 'Acostado, baja la barra hacia la frente flexionando solo los codos.', 'Brazos', null, 'Barra Z', 'intermedio', 'press frances triceps tecnica correcta'),
  ('Fondos en banco (tríceps)', 'gym', 'Apoyado de espaldas en un banco, baja y sube el cuerpo flexionando los codos.', 'Brazos', 'Pecho', 'Banco', 'principiante', 'fondos de triceps en banco tecnica'),
  ('Crunch abdominal', 'gym', 'Acostado, flexiona el torso llevando los hombros hacia las rodillas.', 'Core', null, 'Peso corporal', 'principiante', 'crunch abdominal tecnica correcta'),
  ('Elevación de piernas colgado', 'gym', 'Colgado de una barra, eleva las piernas hacia el pecho controladamente.', 'Core', 'Espalda', 'Barra de dominadas', 'avanzado', 'elevacion de piernas colgado abdominales tecnica'),
  ('Rueda abdominal', 'gym', 'De rodillas, rueda hacia adelante extendiendo el cuerpo y regresa contrayendo el abdomen.', 'Core', 'Hombros', 'Rueda abdominal', 'avanzado', 'rueda abdominal tecnica correcta'),
  ('Russian twist', 'gym', 'Sentado con el torso inclinado, rota el tronco de lado a lado con o sin peso.', 'Core', null, 'Peso corporal o disco', 'principiante', 'russian twist abdominales tecnica'),
  ('Face pull', 'gym', 'En polea alta, tira de la cuerda hacia el rostro separando las manos, para el hombro posterior.', 'Hombros', 'Espalda alta', 'Polea alta', 'principiante', 'face pull tecnica correcta hombro'),
  ('Peso muerto sumo', 'gym', 'Variante de peso muerto con piernas separadas y agarre estrecho, más énfasis en piernas.', 'Piernas', 'Espalda, Glúteos', 'Barra', 'avanzado', 'peso muerto sumo tecnica correcta')
) as v(name, category, description, primary_muscle, secondary_muscles, equipment, difficulty, video_query)
where not exists (
  select 1 from public.exercises e where e.name = v.name and e.user_id is null
);

-- Ejercicios de cardio con info básica
insert into public.exercises (name, category, description, primary_muscle, equipment, difficulty, video_query)
select v.name, v.category, v.description, v.primary_muscle, v.equipment, v.difficulty, v.video_query
from (values
  ('Trote / running', 'cardio', 'Carrera continua a ritmo moderado para resistencia cardiovascular.', 'Cardio', 'Ninguno', 'principiante', 'tecnica de carrera para principiantes'),
  ('Bicicleta estática', 'cardio', 'Pedaleo continuo en bicicleta fija, bajo impacto en articulaciones.', 'Cardio', 'Bicicleta estática', 'principiante', 'rutina bicicleta estatica cardio'),
  ('Saltar la cuerda', 'cardio', 'Saltos continuos con cuerda, mejora coordinación y resistencia.', 'Cardio', 'Cuerda', 'principiante', 'como saltar la cuerda tecnica correcta'),
  ('HIIT / intervalos', 'cardio', 'Bloques cortos de esfuerzo máximo alternados con descanso, muy eficiente en tiempo.', 'Cardio', 'Ninguno', 'intermedio', 'rutina hiit principiantes')
) as v(name, category, description, primary_muscle, equipment, difficulty, video_query)
where not exists (
  select 1 from public.exercises e where e.name = v.name and e.user_id is null
);

/**
 * Parte del MODO MOCK (ver mock-shared.ts para cómo desactivarlo).
 *
 * Motor de la base de datos "en memoria" que respalda el modo mock:
 * guarda todas las tablas en un objeto en memoria del proceso de Node
 * (persistido en `globalThis` para sobrevivir al Fast Refresh de
 * `next dev`), la siembra con datos de prueba realistas tomados de las
 * migraciones SQL reales (`supabase/migrations/*.sql`), y expone
 * `runQuery` / `runStorage`, que ejecutan las "operaciones" que arma
 * `MockQueryBuilder`.
 *
 * Se usa:
 *   - directamente desde `mock-client-server.ts` (Server Components, mismo
 *     proceso de Node, sin necesidad de red), y
 *   - indirectamente desde el browser a través de las rutas
 *     `/api/mock/db` y `/api/mock/storage` (`mock-client-browser.ts`),
 *     para que las mutaciones hechas desde el cliente lleguen al mismo
 *     store que usa el servidor al renderizar.
 *
 * Los datos se pierden al reiniciar el servidor de desarrollo — es
 * intencional, ver README de la sección "Modo mock" para más detalle.
 */

import { FAKE_USER_ID } from "./mock-shared";
import type { MockOp } from "./mock-builder";

type Row = Record<string, unknown>;

type Store = {
  profiles: Row[];
  exercises: Row[];
  workout_sessions: Row[];
  exercise_sets: Row[];
  basketball_details: Row[];
  body_metrics: Row[];
  progress_photos: Row[];
  routines: Row[];
  routine_exercises: Row[];
  daily_tips: Row[];
  push_subscriptions: Row[];
  storageFiles: Map<string, { dataUrl: string }>;
};

declare global {
  // eslint-disable-next-line no-var
  var __APP_GYM_MOCK_STORE__: Store | undefined;
}

function uid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

// ============================================================
// Semilla: biblioteca de ejercicios (fuente de verdad: migraciones
// 0001_init.sql + 0002_library_ai_and_metrics.sql)
// ============================================================

type ExerciseSeed = {
  name: string;
  category: "gym" | "cardio";
  description: string;
  primary_muscle: string;
  secondary_muscles: string | null;
  equipment: string;
  difficulty: "principiante" | "intermedio" | "avanzado";
  video_query: string;
};

const EXERCISE_SEEDS: ExerciseSeed[] = [
  { name: "Press de banca", category: "gym", description: "Ejercicio compuesto para el tren superior. Acostado en el banco, baja la barra al pecho controladamente y empuja hacia arriba.", primary_muscle: "Pecho", secondary_muscles: "Tríceps, Hombro anterior", equipment: "Barra y banco", difficulty: "intermedio", video_query: "como hacer press de banca tecnica correcta" },
  { name: "Sentadilla", category: "gym", description: "El rey de los ejercicios de pierna. Baja las caderas como si te sentaras en una silla manteniendo el pecho erguido.", primary_muscle: "Piernas", secondary_muscles: "Glúteos, Core", equipment: "Barra (o peso corporal)", difficulty: "intermedio", video_query: "como hacer sentadilla tecnica correcta" },
  { name: "Peso muerto", category: "gym", description: "Ejercicio compuesto de cadena posterior. Levanta la barra del piso manteniendo la espalda neutra, empujando con las piernas y caderas.", primary_muscle: "Espalda", secondary_muscles: "Piernas, Glúteos, Core", equipment: "Barra", difficulty: "avanzado", video_query: "como hacer peso muerto tecnica correcta" },
  { name: "Press militar", category: "gym", description: "De pie, empuja la barra desde los hombros hacia arriba por encima de la cabeza, sin usar impulso de piernas.", primary_muscle: "Hombros", secondary_muscles: "Tríceps, Core", equipment: "Barra", difficulty: "intermedio", video_query: "como hacer press militar tecnica correcta" },
  { name: "Dominadas", category: "gym", description: "Colgado de una barra, sube el cuerpo hasta que el mentón supere la barra, controlando la bajada.", primary_muscle: "Espalda", secondary_muscles: "Bíceps", equipment: "Barra de dominadas", difficulty: "avanzado", video_query: "como hacer dominadas tecnica correcta principiantes" },
  { name: "Remo con barra", category: "gym", description: "Inclinado hacia adelante, tira de la barra hacia el abdomen apretando los omóplatos.", primary_muscle: "Espalda", secondary_muscles: "Bíceps", equipment: "Barra", difficulty: "intermedio", video_query: "como hacer remo con barra tecnica correcta" },
  { name: "Curl de bíceps", category: "gym", description: "De pie, flexiona los codos llevando la barra o mancuernas hacia los hombros, sin balancear el cuerpo.", primary_muscle: "Brazos", secondary_muscles: "Antebrazo", equipment: "Barra o mancuernas", difficulty: "principiante", video_query: "como hacer curl de biceps tecnica correcta" },
  { name: "Extensión de tríceps", category: "gym", description: "Extiende los codos empujando una cuerda o barra hacia abajo, manteniendo los codos pegados al torso.", primary_muscle: "Brazos", secondary_muscles: null, equipment: "Polea", difficulty: "principiante", video_query: "como hacer extension de triceps en polea tecnica" },
  { name: "Zancadas", category: "gym", description: "Da un paso largo hacia adelante y baja la rodilla trasera casi hasta el piso, alternando piernas.", primary_muscle: "Piernas", secondary_muscles: "Glúteos", equipment: "Peso corporal o mancuernas", difficulty: "principiante", video_query: "como hacer zancadas tecnica correcta" },
  { name: "Plancha", category: "gym", description: "Mantén el cuerpo recto en línea desde la cabeza a los talones apoyado en antebrazos y pies.", primary_muscle: "Core", secondary_muscles: null, equipment: "Peso corporal", difficulty: "principiante", video_query: "como hacer plancha abdominal tecnica correcta" },
  { name: "Prensa de piernas", category: "gym", description: "Sentado en la máquina, empuja la plataforma con las piernas extendiendo las rodillas sin bloquearlas.", primary_muscle: "Piernas", secondary_muscles: "Glúteos", equipment: "Máquina prensa", difficulty: "principiante", video_query: "como hacer prensa de piernas tecnica correcta" },
  { name: "Elevaciones laterales", category: "gym", description: "De pie con mancuernas, eleva los brazos hacia los lados hasta la altura del hombro.", primary_muscle: "Hombros", secondary_muscles: null, equipment: "Mancuernas", difficulty: "principiante", video_query: "como hacer elevaciones laterales tecnica correcta" },
  { name: "Press inclinado con mancuernas", category: "gym", description: "Similar al press de banca pero en banco inclinado, enfatiza la parte superior del pecho.", primary_muscle: "Pecho", secondary_muscles: "Hombro anterior, Tríceps", equipment: "Mancuernas y banco", difficulty: "intermedio", video_query: "press inclinado con mancuernas tecnica correcta" },
  { name: "Aperturas con mancuernas", category: "gym", description: "Acostado en banco, abre los brazos con mancuernas en arco controlado para estirar el pecho.", primary_muscle: "Pecho", secondary_muscles: null, equipment: "Mancuernas y banco", difficulty: "principiante", video_query: "aperturas con mancuernas tecnica correcta" },
  { name: "Fondos en paralelas", category: "gym", description: "Baja y sube el cuerpo entre dos barras paralelas flexionando los codos, inclinando el torso adelante para pecho.", primary_muscle: "Pecho", secondary_muscles: "Tríceps, Hombro anterior", equipment: "Paralelas", difficulty: "avanzado", video_query: "como hacer fondos en paralelas tecnica" },
  { name: "Press de banca con mancuernas", category: "gym", description: "Variante del press de banca con mancuernas, permite mayor rango de movimiento.", primary_muscle: "Pecho", secondary_muscles: "Tríceps, Hombro anterior", equipment: "Mancuernas y banco", difficulty: "intermedio", video_query: "press de banca con mancuernas tecnica" },
  { name: "Jalón al pecho", category: "gym", description: "Sentado en la polea alta, tira de la barra hacia el pecho controlando la subida.", primary_muscle: "Espalda", secondary_muscles: "Bíceps", equipment: "Polea alta", difficulty: "principiante", video_query: "como hacer jalon al pecho tecnica correcta" },
  { name: "Remo con mancuerna a un brazo", category: "gym", description: "Apoyado en banco, tira de la mancuerna hacia la cadera manteniendo la espalda estable.", primary_muscle: "Espalda", secondary_muscles: "Bíceps", equipment: "Mancuerna y banco", difficulty: "principiante", video_query: "remo con mancuerna a un brazo tecnica" },
  { name: "Remo en polea baja", category: "gym", description: "Sentado, tira del agarre hacia el abdomen manteniendo el torso erguido.", primary_muscle: "Espalda", secondary_muscles: "Bíceps", equipment: "Polea baja", difficulty: "principiante", video_query: "remo en polea baja tecnica correcta" },
  { name: "Hiperextensiones", category: "gym", description: "En banco romano, baja el torso y súbelo activando la zona lumbar y glúteos.", primary_muscle: "Espalda", secondary_muscles: "Glúteos", equipment: "Banco romano", difficulty: "principiante", video_query: "como hacer hiperextensiones lumbares tecnica" },
  { name: "Sentadilla búlgara", category: "gym", description: "Con el pie trasero elevado en un banco, baja en sentadilla con la pierna delantera.", primary_muscle: "Piernas", secondary_muscles: "Glúteos", equipment: "Mancuernas y banco", difficulty: "intermedio", video_query: "sentadilla bulgara tecnica correcta" },
  { name: "Peso muerto rumano", category: "gym", description: "Con piernas casi rectas, baja la barra pegada a las piernas activando isquiotibiales.", primary_muscle: "Piernas", secondary_muscles: "Glúteos, Espalda baja", equipment: "Barra", difficulty: "intermedio", video_query: "peso muerto rumano tecnica correcta" },
  { name: "Extensión de cuádriceps", category: "gym", description: "Sentado en máquina, extiende las rodillas levantando el peso con los cuádriceps.", primary_muscle: "Piernas", secondary_muscles: null, equipment: "Máquina de extensión", difficulty: "principiante", video_query: "extension de cuadriceps en maquina tecnica" },
  { name: "Curl femoral", category: "gym", description: "Acostado o sentado en máquina, flexiona las rodillas llevando el peso hacia los glúteos.", primary_muscle: "Piernas", secondary_muscles: null, equipment: "Máquina de curl femoral", difficulty: "principiante", video_query: "curl femoral en maquina tecnica" },
  { name: "Elevación de talones (gemelos)", category: "gym", description: "De pie, sube los talones lo más alto posible activando la pantorrilla.", primary_muscle: "Piernas", secondary_muscles: "Pantorrilla", equipment: "Máquina o peso corporal", difficulty: "principiante", video_query: "elevacion de talones gemelos tecnica correcta" },
  { name: "Hip thrust", category: "gym", description: "Con la espalda apoyada en un banco, empuja la cadera hacia arriba activando glúteos.", primary_muscle: "Glúteos", secondary_muscles: "Piernas", equipment: "Barra y banco", difficulty: "intermedio", video_query: "como hacer hip thrust tecnica correcta" },
  { name: "Patada de glúteo en polea", category: "gym", description: "De pie en la polea baja, empuja la pierna hacia atrás activando el glúteo.", primary_muscle: "Glúteos", secondary_muscles: "Piernas", equipment: "Polea baja", difficulty: "principiante", video_query: "patada de gluteo en polea tecnica" },
  { name: "Press militar con mancuernas", category: "gym", description: "Sentado o de pie, empuja las mancuernas por encima de la cabeza.", primary_muscle: "Hombros", secondary_muscles: "Tríceps", equipment: "Mancuernas", difficulty: "intermedio", video_query: "press militar con mancuernas tecnica correcta" },
  { name: "Elevaciones frontales", category: "gym", description: "De pie, eleva mancuernas al frente hasta la altura del hombro.", primary_muscle: "Hombros", secondary_muscles: null, equipment: "Mancuernas", difficulty: "principiante", video_query: "elevaciones frontales de hombro tecnica" },
  { name: "Pájaros (elevaciones posteriores)", category: "gym", description: "Inclinado hacia adelante, eleva mancuernas hacia los lados para el deltoide posterior.", primary_muscle: "Hombros", secondary_muscles: "Espalda alta", equipment: "Mancuernas", difficulty: "principiante", video_query: "elevaciones posteriores pajaros hombro tecnica" },
  { name: "Encogimientos de hombros", category: "gym", description: "De pie con mancuernas o barra, eleva los hombros hacia las orejas.", primary_muscle: "Hombros", secondary_muscles: "Trapecio", equipment: "Mancuernas o barra", difficulty: "principiante", video_query: "encogimientos de hombros trapecio tecnica" },
  { name: "Curl martillo", category: "gym", description: "Curl de bíceps con agarre neutro (palmas enfrentadas), trabaja también el antebrazo.", primary_muscle: "Brazos", secondary_muscles: "Antebrazo", equipment: "Mancuernas", difficulty: "principiante", video_query: "curl martillo biceps tecnica correcta" },
  { name: "Curl en banco Scott", category: "gym", description: "Apoyado en el banco Scott, flexiona los codos aislando el bíceps.", primary_muscle: "Brazos", secondary_muscles: null, equipment: "Barra Z y banco Scott", difficulty: "intermedio", video_query: "curl en banco scott predicador tecnica" },
  { name: "Press francés", category: "gym", description: "Acostado, baja la barra hacia la frente flexionando solo los codos.", primary_muscle: "Brazos", secondary_muscles: null, equipment: "Barra Z", difficulty: "intermedio", video_query: "press frances triceps tecnica correcta" },
  { name: "Fondos en banco (tríceps)", category: "gym", description: "Apoyado de espaldas en un banco, baja y sube el cuerpo flexionando los codos.", primary_muscle: "Brazos", secondary_muscles: "Pecho", equipment: "Banco", difficulty: "principiante", video_query: "fondos de triceps en banco tecnica" },
  { name: "Crunch abdominal", category: "gym", description: "Acostado, flexiona el torso llevando los hombros hacia las rodillas.", primary_muscle: "Core", secondary_muscles: null, equipment: "Peso corporal", difficulty: "principiante", video_query: "crunch abdominal tecnica correcta" },
  { name: "Elevación de piernas colgado", category: "gym", description: "Colgado de una barra, eleva las piernas hacia el pecho controladamente.", primary_muscle: "Core", secondary_muscles: "Espalda", equipment: "Barra de dominadas", difficulty: "avanzado", video_query: "elevacion de piernas colgado abdominales tecnica" },
  { name: "Rueda abdominal", category: "gym", description: "De rodillas, rueda hacia adelante extendiendo el cuerpo y regresa contrayendo el abdomen.", primary_muscle: "Core", secondary_muscles: "Hombros", equipment: "Rueda abdominal", difficulty: "avanzado", video_query: "rueda abdominal tecnica correcta" },
  { name: "Russian twist", category: "gym", description: "Sentado con el torso inclinado, rota el tronco de lado a lado con o sin peso.", primary_muscle: "Core", secondary_muscles: null, equipment: "Peso corporal o disco", difficulty: "principiante", video_query: "russian twist abdominales tecnica" },
  { name: "Face pull", category: "gym", description: "En polea alta, tira de la cuerda hacia el rostro separando las manos, para el hombro posterior.", primary_muscle: "Hombros", secondary_muscles: "Espalda alta", equipment: "Polea alta", difficulty: "principiante", video_query: "face pull tecnica correcta hombro" },
  { name: "Peso muerto sumo", category: "gym", description: "Variante de peso muerto con piernas separadas y agarre estrecho, más énfasis en piernas.", primary_muscle: "Piernas", secondary_muscles: "Espalda, Glúteos", equipment: "Barra", difficulty: "avanzado", video_query: "peso muerto sumo tecnica correcta" },
  { name: "Trote / running", category: "cardio", description: "Carrera continua a ritmo moderado para resistencia cardiovascular.", primary_muscle: "Cardio", secondary_muscles: null, equipment: "Ninguno", difficulty: "principiante", video_query: "tecnica de carrera para principiantes" },
  { name: "Bicicleta estática", category: "cardio", description: "Pedaleo continuo en bicicleta fija, bajo impacto en articulaciones.", primary_muscle: "Cardio", secondary_muscles: null, equipment: "Bicicleta estática", difficulty: "principiante", video_query: "rutina bicicleta estatica cardio" },
  { name: "Saltar la cuerda", category: "cardio", description: "Saltos continuos con cuerda, mejora coordinación y resistencia.", primary_muscle: "Cardio", secondary_muscles: null, equipment: "Cuerda", difficulty: "principiante", video_query: "como saltar la cuerda tecnica correcta" },
  { name: "HIIT / intervalos", category: "cardio", description: "Bloques cortos de esfuerzo máximo alternados con descanso, muy eficiente en tiempo.", primary_muscle: "Cardio", secondary_muscles: null, equipment: "Ninguno", difficulty: "intermedio", video_query: "rutina hiit principiantes" },
];

function buildExerciseLibrary(): Row[] {
  return EXERCISE_SEEDS.map((e) => ({
    id: uid(),
    user_id: null,
    name: e.name,
    category: e.category,
    muscle_group: e.primary_muscle,
    description: e.description,
    primary_muscle: e.primary_muscle,
    secondary_muscles: e.secondary_muscles,
    equipment: e.equipment,
    difficulty: e.difficulty,
    video_query: e.video_query,
    created_at: nowIso(),
  }));
}

// ============================================================
// Semilla: rutinas de ejemplo (fuente de verdad: 0003_photos_routines_push.sql)
// ============================================================

type RoutineDef = {
  name: string;
  description: string;
  items: [string, number, number][]; // [nombreEjercicio, series, reps]
};

const ROUTINE_DEFS: RoutineDef[] = [
  {
    name: "Push (empuje)",
    description: "Pecho, hombros y tríceps",
    items: [
      ["Press de banca", 4, 8],
      ["Press militar con mancuernas", 3, 10],
      ["Press inclinado con mancuernas", 3, 10],
      ["Elevaciones laterales", 3, 15],
      ["Extensión de tríceps", 3, 12],
    ],
  },
  {
    name: "Pull (jalón)",
    description: "Espalda y bíceps",
    items: [
      ["Peso muerto", 4, 6],
      ["Dominadas", 3, 8],
      ["Remo con barra", 3, 10],
      ["Jalón al pecho", 4, 12],
      ["Curl de bíceps", 3, 12],
    ],
  },
  {
    name: "Legs (piernas)",
    description: "Cuádriceps, isquiotibiales y glúteos",
    items: [
      ["Sentadilla", 4, 8],
      ["Peso muerto rumano", 3, 10],
      ["Prensa de piernas", 3, 12],
      ["Sentadilla búlgara", 3, 10],
      ["Elevación de talones (gemelos)", 4, 15],
    ],
  },
  {
    name: "Full body",
    description: "Cuerpo completo en una sola sesión, ideal si entrenás 2-3 veces por semana",
    items: [
      ["Sentadilla", 3, 10],
      ["Press de banca", 3, 10],
      ["Remo con barra", 3, 10],
      ["Press militar", 3, 10],
      ["Plancha", 3, 1],
    ],
  },
];

function buildRoutines(byName: Map<string, Row>): { routines: Row[]; routine_exercises: Row[] } {
  const routines: Row[] = [];
  const routine_exercises: Row[] = [];
  for (const def of ROUTINE_DEFS) {
    const routineId = uid();
    routines.push({
      id: routineId,
      user_id: null,
      name: def.name,
      description: def.description,
      created_at: nowIso(),
    });
    def.items.forEach(([exName, sets, reps], idx) => {
      const ex = byName.get(exName);
      if (!ex) return;
      routine_exercises.push({
        id: uid(),
        routine_id: routineId,
        exercise_id: ex.id,
        order_index: idx,
        target_sets: sets,
        target_reps: reps,
        notes: null,
      });
    });
  }
  return { routines, routine_exercises };
}

// ============================================================
// Semilla: historial de entrenamientos y medidas (últimos ~30 días)
// ============================================================

const GYM_ROTATION = ["Press de banca", "Sentadilla", "Peso muerto", "Press militar", "Remo con barra", "Dominadas"];
const BASE_WEIGHTS: Record<string, number> = {
  "Press de banca": 60,
  Sentadilla: 80,
  "Peso muerto": 100,
  "Press militar": 40,
  "Remo con barra": 55,
  Dominadas: 0,
};

function buildWorkoutHistory(byName: Map<string, Row>) {
  const sessions: Row[] = [];
  const sets: Row[] = [];
  const bballDetails: Row[] = [];
  const metrics: Row[] = [];
  let rotationIdx = 0;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(18, 30, 0, 0);
    const dow = date.getDay(); // 0 dom .. 6 sáb

    if (dow === 1 || dow === 3 || dow === 5) {
      // Gym: lunes, miércoles, viernes
      const sessionId = uid();
      sessions.push({
        id: sessionId,
        user_id: FAKE_USER_ID,
        type: "gym",
        started_at: date.toISOString(),
        duration_min: 50 + Math.round(Math.random() * 20),
        notes: null,
        created_at: date.toISOString(),
      });

      const dayExercises = [
        GYM_ROTATION[rotationIdx % GYM_ROTATION.length],
        GYM_ROTATION[(rotationIdx + 1) % GYM_ROTATION.length],
        GYM_ROTATION[(rotationIdx + 2) % GYM_ROTATION.length],
      ];
      rotationIdx++;

      dayExercises.forEach((exName, exIdx) => {
        const ex = byName.get(exName);
        if (!ex) return;
        const baseWeight = BASE_WEIGHTS[exName] ?? 40;
        const progress = (29 - daysAgo) * 0.15; // progresión de carga lenta a lo largo del mes
        for (let setNum = 1; setNum <= 4; setNum++) {
          const weight = Math.round((baseWeight + progress - (setNum - 1) * 2.5) * 2) / 2;
          const createdAt = new Date(date.getTime() + exIdx * 9 * 60000 + setNum * 2 * 60000);
          sets.push({
            id: uid(),
            session_id: sessionId,
            user_id: FAKE_USER_ID,
            exercise_id: ex.id,
            set_number: setNum,
            weight_kg: Math.max(5, weight),
            reps: 12 - setNum,
            rpe: 6 + (setNum % 4),
            created_at: createdAt.toISOString(),
          });
        }
      });
    } else if (dow === 6) {
      // Básquet: sábado
      const sessionId = uid();
      sessions.push({
        id: sessionId,
        user_id: FAKE_USER_ID,
        type: "basketball",
        started_at: date.toISOString(),
        duration_min: 60,
        notes: null,
        created_at: date.toISOString(),
      });
      const attempted = 20 + Math.round(Math.random() * 15);
      const made = Math.round(attempted * (0.4 + Math.random() * 0.3));
      bballDetails.push({
        id: uid(),
        session_id: sessionId,
        user_id: FAKE_USER_ID,
        drill_type: "Tiro",
        shots_made: made,
        shots_attempted: attempted,
        created_at: date.toISOString(),
      });
    } else if (dow === 0) {
      // Cardio: domingo
      const sessionId = uid();
      sessions.push({
        id: sessionId,
        user_id: FAKE_USER_ID,
        type: "cardio",
        started_at: date.toISOString(),
        duration_min: 25 + Math.round(Math.random() * 20),
        notes: "Trote suave",
        created_at: date.toISOString(),
      });
    }
  }

  for (let weeksAgo = 4; weeksAgo >= 0; weeksAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - weeksAgo * 7);
    const t = (4 - weeksAgo) / 4; // 0 (hace 4 semanas) .. 1 (hoy): leve progreso físico
    metrics.push({
      id: uid(),
      user_id: FAKE_USER_ID,
      measured_at: date.toISOString().slice(0, 10),
      weight_kg: Math.round((82 - t * 3) * 10) / 10,
      body_fat_pct: Math.round((22 - t * 3) * 10) / 10,
      waist_cm: Math.round(88 - t * 3),
      chest_cm: Math.round(98 + t * 2),
      arm_cm: Math.round((34 + t * 1.5) * 10) / 10,
      thigh_cm: Math.round((56 + t * 1.5) * 10) / 10,
      notes: null,
      created_at: date.toISOString(),
    });
  }

  return { sessions, sets, bballDetails, metrics };
}

// ============================================================
// Store y semilla inicial
// ============================================================

function seed(): Store {
  const exercises = buildExerciseLibrary();
  const byName = new Map(exercises.map((e) => [e.name as string, e]));

  const profiles: Row[] = [
    {
      id: FAKE_USER_ID,
      display_name: "Demo",
      height_cm: 178,
      measurement_frequency: "weekly",
      created_at: nowIso(),
    },
  ];

  const { routines, routine_exercises } = buildRoutines(byName);
  const { sessions, sets, bballDetails, metrics } = buildWorkoutHistory(byName);

  return {
    profiles,
    exercises,
    workout_sessions: sessions,
    exercise_sets: sets,
    basketball_details: bballDetails,
    body_metrics: metrics,
    progress_photos: [],
    routines,
    routine_exercises,
    daily_tips: [],
    push_subscriptions: [],
    storageFiles: new Map(),
  };
}

function getStore(): Store {
  if (!globalThis.__APP_GYM_MOCK_STORE__) {
    globalThis.__APP_GYM_MOCK_STORE__ = seed();
  }
  return globalThis.__APP_GYM_MOCK_STORE__;
}

// ============================================================
// Relaciones embebidas soportadas (las que realmente usa la app)
// ============================================================

type RelationDef =
  | { type: "belongsTo"; table: keyof Store; localKey: string }
  | { type: "hasManyCount"; table: keyof Store; foreignKey: string };

const RELATIONS: Partial<Record<keyof Store, Record<string, RelationDef>>> = {
  exercise_sets: { exercises: { type: "belongsTo", table: "exercises", localKey: "exercise_id" } },
  basketball_details: {
    workout_sessions: { type: "belongsTo", table: "workout_sessions", localKey: "session_id" },
  },
  routine_exercises: { exercises: { type: "belongsTo", table: "exercises", localKey: "exercise_id" } },
  routines: {
    routine_exercises: { type: "hasManyCount", table: "routine_exercises", foreignKey: "routine_id" },
  },
};

function attachRelations(table: keyof Store, rows: Row[], selectStr: string): Row[] {
  const relDefs = RELATIONS[table];
  if (!relDefs || !selectStr) return rows;
  const matches = [...selectStr.matchAll(/(\w+)\(([^)]*)\)/g)];
  if (matches.length === 0) return rows;
  const store = getStore();
  return rows.map((row) => {
    const copy: Row = { ...row };
    for (const m of matches) {
      const relName = m[1];
      const relDef = relDefs[relName];
      if (!relDef) continue;
      if (relDef.type === "belongsTo") {
        const target = (store[relDef.table] as Row[]).find((r) => r.id === row[relDef.localKey]);
        copy[relName] = target ? { ...target } : null;
      } else if (relDef.type === "hasManyCount") {
        const count = (store[relDef.table] as Row[]).filter(
          (r) => r[relDef.foreignKey] === row.id
        ).length;
        copy[relName] = [{ count }];
      }
    }
    return copy;
  });
}

// ============================================================
// Filtros y orden
// ============================================================

function matchesOr(row: Row, raw: string): boolean {
  const conds = raw.split(",");
  return conds.some((cond) => {
    const [col, op, val] = cond.split(".");
    if (!col || !op) return false;
    if (op === "is") return val === "null" ? row[col] == null : String(row[col]) === val;
    if (op === "eq") return String(row[col]) === val;
    return false;
  });
}

function matchesFilter(row: Row, f: MockOp["filters"][number]): boolean {
  switch (f.type) {
    case "eq":
      return row[f.column] === f.value;
    case "neq":
      return row[f.column] !== f.value;
    case "gte": {
      const v = row[f.column];
      return v != null && (v as string | number) >= (f.value as string | number);
    }
    case "lte": {
      const v = row[f.column];
      return v != null && (v as string | number) <= (f.value as string | number);
    }
    case "in":
      return Array.isArray(f.value) && f.value.includes(row[f.column]);
    case "or":
      return matchesOr(row, f.raw);
    default:
      return true;
  }
}

function applyFilters(rows: Row[], filters: MockOp["filters"]): Row[] {
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f)));
}

function applyOrder(rows: Row[], orders: MockOp["orders"]): Row[] {
  if (orders.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      const av = a[o.column] as string | number | null | undefined;
      const bv = b[o.column] as string | number | null | undefined;
      if (av == null && bv == null) continue;
      if (av == null) return o.nullsFirst ? -1 : 1;
      if (bv == null) return o.nullsFirst ? 1 : -1;
      if (av < bv) return o.ascending ? -1 : 1;
      if (av > bv) return o.ascending ? 1 : -1;
    }
    return 0;
  });
}

// ============================================================
// Ejecución de operaciones
// ============================================================

function finalize(rows: Row[], mode: MockOp["mode"]) {
  if (mode === "single") {
    if (rows.length === 0) return { data: null, error: { message: "No se encontraron filas (mock)" } };
    return { data: rows[0], error: null };
  }
  if (mode === "maybeSingle") {
    return { data: rows[0] ?? null, error: null };
  }
  return { data: rows, error: null };
}

function insertRow(tableName: keyof Store, data: Row): Row {
  const store = getStore();
  const row: Row = { id: (data.id as string) || uid(), created_at: (data.created_at as string) || nowIso(), ...data };
  (store[tableName] as Row[]).push(row);
  return { ...row };
}

export async function runQuery(op: MockOp): Promise<{ data: unknown; error: { message: string } | null }> {
  const store = getStore();
  const table = store[op.table as keyof Store] as Row[] | undefined;
  if (!table || !Array.isArray(table)) {
    return finalize([], op.mode);
  }

  if (op.action === "select") {
    let rows = applyFilters(table, op.filters);
    rows = applyOrder(rows, op.orders);
    if (op.limit != null) rows = rows.slice(0, op.limit);
    rows = attachRelations(op.table as keyof Store, rows, op.select);
    return finalize(rows, op.mode);
  }

  if (op.action === "insert") {
    const list = Array.isArray(op.payload) ? (op.payload as Row[]) : [op.payload as Row];
    const inserted = list.map((r) => insertRow(op.table as keyof Store, r));
    return finalize(inserted, op.mode);
  }

  if (op.action === "update") {
    const matched = applyFilters(table, op.filters);
    for (const row of matched) Object.assign(row, op.payload as Row);
    return finalize(matched.map((r) => ({ ...r })), op.mode);
  }

  if (op.action === "delete") {
    const matched = applyFilters(table, op.filters);
    const ids = new Set(matched.map((r) => r.id));
    (store[op.table as keyof Store] as Row[]) = table.filter((r) => !ids.has(r.id));
    return finalize(matched, op.mode);
  }

  if (op.action === "upsert") {
    const list = Array.isArray(op.payload) ? (op.payload as Row[]) : [op.payload as Row];
    const conflictCols = (op.onConflict || "id").split(",").map((s) => s.trim());
    const results = list.map((r) => {
      const existing = table.find((row) => conflictCols.every((c) => row[c] === r[c]));
      if (existing) {
        Object.assign(existing, r);
        return { ...existing };
      }
      return insertRow(op.table as keyof Store, r);
    });
    return finalize(results, op.mode);
  }

  return finalize([], op.mode);
}

// ============================================================
// Storage mock (fotos de progreso)
// ============================================================

export type MockStorageOp =
  | { action: "upload"; bucket: string; path: string; dataUrl: string }
  | { action: "remove"; bucket: string; paths: string[] }
  | { action: "createSignedUrl"; bucket: string; path: string }
  | { action: "list"; bucket: string; prefix?: string };

export async function runStorage(op: MockStorageOp): Promise<{ data: unknown; error: { message: string } | null }> {
  const store = getStore();
  const key = (bucket: string, path: string) => `${bucket}/${path}`;

  if (op.action === "upload") {
    store.storageFiles.set(key(op.bucket, op.path), { dataUrl: op.dataUrl });
    return { data: { path: op.path }, error: null };
  }
  if (op.action === "remove") {
    for (const p of op.paths || []) store.storageFiles.delete(key(op.bucket, p));
    return { data: null, error: null };
  }
  if (op.action === "createSignedUrl") {
    const f = store.storageFiles.get(key(op.bucket, op.path));
    if (!f) return { data: null, error: { message: "Archivo no encontrado (mock)" } };
    return { data: { signedUrl: f.dataUrl }, error: null };
  }
  if (op.action === "list") {
    const prefix = key(op.bucket, op.prefix || "");
    const names = [...store.storageFiles.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((k) => ({ name: k.slice(prefix.length) }));
    return { data: names, error: null };
  }
  return { data: null, error: { message: "Operación de storage no soportada (mock)" } };
}

export type Exercise = {
  id: string;
  user_id: string | null;
  name: string;
  category: "gym" | "cardio";
  muscle_group: string | null;
  description: string | null;
  primary_muscle: string | null;
  secondary_muscles: string | null;
  equipment: string | null;
  difficulty: "principiante" | "intermedio" | "avanzado" | null;
  video_query: string | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  measurement_frequency: "weekly" | "monthly";
};

export type DailyTip = {
  id: string;
  user_id: string;
  tip_date: string;
  tip_text: string;
  highlight_type: "pr" | "streak" | "consistency" | "general" | null;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  type: "gym" | "basketball" | "cardio";
  started_at: string;
  duration_min: number | null;
  notes: string | null;
};

export type ExerciseSet = {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  created_at: string;
};

export type BasketballDetail = {
  id: string;
  session_id: string;
  user_id: string;
  drill_type: string | null;
  shots_made: number | null;
  shots_attempted: number | null;
};

export type BodyMetric = {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
};

export type ProgressPhoto = {
  id: string;
  user_id: string;
  taken_at: string;
  storage_path: string;
  notes: string | null;
};

export type Routine = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
};

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  notes: string | null;
};

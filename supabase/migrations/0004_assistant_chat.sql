-- App Gym: chat persistente con el asistente IA (tu "mano derecha")
-- Ejecutar DESPUÉS de 0001, 0002 y 0003.

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.assistant_messages enable row level security;

create policy "assistant_messages: select own" on public.assistant_messages
  for select using (auth.uid() = user_id);
create policy "assistant_messages: insert own" on public.assistant_messages
  for insert with check (auth.uid() = user_id);
create policy "assistant_messages: delete own" on public.assistant_messages
  for delete using (auth.uid() = user_id);

create index if not exists idx_assistant_messages_user_created
  on public.assistant_messages(user_id, created_at asc);

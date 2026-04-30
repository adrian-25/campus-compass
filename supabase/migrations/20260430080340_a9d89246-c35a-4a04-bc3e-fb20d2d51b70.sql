create table public.questions (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_questions_college on public.questions(college_id, created_at desc);
create index idx_answers_question on public.answers(question_id, created_at);

alter table public.questions enable row level security;
create policy "Public read questions" on public.questions for select using (true);
create policy "Auth users insert questions" on public.questions for insert with check (auth.uid() = user_id);
create policy "Users delete own questions" on public.questions for delete using (auth.uid() = user_id);

alter table public.answers enable row level security;
create policy "Public read answers" on public.answers for select using (true);
create policy "Auth users insert answers" on public.answers for insert with check (auth.uid() = user_id);
create policy "Users delete own answers" on public.answers for delete using (auth.uid() = user_id);

-- Seed demo questions only if at least one auth user exists
do $$
declare
  demo_user uuid;
begin
  select id into demo_user from auth.users limit 1;
  if demo_user is not null then
    insert into public.questions (college_id, user_id, user_email, title, body)
    select c.id, demo_user, 'demo@campusiq.in',
      'What is the hostel life like at ' || c.name || '?',
      'Looking for honest reviews about hostel facilities, food quality and overall living experience.'
    from public.colleges c limit 5;

    insert into public.questions (college_id, user_id, user_email, title, body)
    select c.id, demo_user, 'demo@campusiq.in',
      'How are the placements at ' || c.name || ' for CSE branch?',
      'Specifically interested in product-based companies. What is the average and what companies visit?'
    from public.colleges c limit 5;
  end if;
end $$;
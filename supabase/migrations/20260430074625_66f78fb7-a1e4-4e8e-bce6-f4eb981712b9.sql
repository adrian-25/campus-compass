create extension if not exists "uuid-ossp";

create table public.colleges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null,
  state text not null,
  type text not null check (type in ('Government','Private')),
  affiliation text,
  established int,
  fees_per_year int not null,
  rating float not null,
  image_url text,
  top_course text,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  college_id uuid references public.colleges(id) on delete cascade not null,
  name text not null,
  duration text not null,
  fees int not null
);

create table public.placements (
  id uuid primary key default uuid_generate_v4(),
  college_id uuid references public.colleges(id) on delete cascade unique not null,
  avg_package int not null,
  highest_package int not null,
  placement_pct float not null,
  top_recruiters text[] not null
);

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  college_id uuid references public.colleges(id) on delete cascade not null,
  reviewer_name text not null,
  year int not null,
  rating float not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.saved_colleges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, college_id)
);

alter table public.colleges enable row level security;
alter table public.courses enable row level security;
alter table public.placements enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_colleges enable row level security;

create policy "Public read colleges" on public.colleges for select using (true);
create policy "Public read courses" on public.courses for select using (true);
create policy "Public read placements" on public.placements for select using (true);
create policy "Public read reviews" on public.reviews for select using (true);

create policy "Users view own saved" on public.saved_colleges for select using (auth.uid() = user_id);
create policy "Users insert own saved" on public.saved_colleges for insert with check (auth.uid() = user_id);
create policy "Users delete own saved" on public.saved_colleges for delete using (auth.uid() = user_id);
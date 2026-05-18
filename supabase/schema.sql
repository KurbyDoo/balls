-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  username text unique,
  current_level integer default 1,
  coins integer default 0,
  boosters jsonb default '{"undo": 3, "shuffle": 3, "extra_slot": 1}'::jsonb,
  saved_board_state jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for
select using (true);

create policy "Users can insert their own profile." on profiles for
insert
with
    check (auth.uid () = id);

create policy "Users can update own profile." on profiles for
update using (auth.uid () = id);

-- Create a trigger function to automatically create a profile for new users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

-- Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
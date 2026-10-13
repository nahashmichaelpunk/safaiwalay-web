alter table public.users
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.users.latitude is 'User-selected house pin latitude from map picker.';
comment on column public.users.longitude is 'User-selected house pin longitude from map picker.';
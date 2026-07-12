create schema if not exists panel;

create table if not exists panel.diego_casos (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  titulo text not null,
  tipo text not null default 'reclamo',
  tipo_label text not null default 'Reclamo',
  prioridad text not null default 'media',
  prioridad_label text not null default 'Media',
  estado text not null default 'abierto',
  estado_label text not null default 'Abierto',
  responsable text not null default 'Equipo',
  traza text not null default 'Sin traza',
  siguiente_paso text not null default 'Seguir',
  archivado boolean not null default false,
  owner_manual boolean not null default false,
  status_manual boolean not null default false,
  priority_manual boolean not null default false,
  step_manual boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint diego_casos_tipo_chk check (tipo in ('reclamo', 'oportunidad', 'bloqueo', 'tarea')),
  constraint diego_casos_prioridad_chk check (prioridad in ('alta', 'media', 'baja')),
  constraint diego_casos_estado_chk check (estado in ('abierto', 'en_curso', 'por_confirmar', 'resuelto'))
);

create index if not exists diego_casos_updated_idx on panel.diego_casos (updated_at desc);
create index if not exists diego_casos_estado_idx on panel.diego_casos (estado);
create index if not exists diego_casos_responsable_idx on panel.diego_casos (responsable);
create index if not exists diego_casos_archivado_idx on panel.diego_casos (archivado, updated_at desc);

create or replace function panel.trg_diego_casos_updated_at()
returns trigger
language plpgsql
set search_path = panel, pg_temp
as $$
begin
  new.updated_at = now();
  if new.last_seen_at is null then
    new.last_seen_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_diego_casos_updated_at on panel.diego_casos;
create trigger set_diego_casos_updated_at
before update on panel.diego_casos
for each row
execute function panel.trg_diego_casos_updated_at();

alter table panel.diego_casos enable row level security;

drop policy if exists diego_casos_select_authenticated on panel.diego_casos;
create policy diego_casos_select_authenticated
on panel.diego_casos
for select
using (auth.role() = 'authenticated');

drop policy if exists diego_casos_insert_authenticated on panel.diego_casos;
create policy diego_casos_insert_authenticated
on panel.diego_casos
for insert
with check (auth.role() = 'authenticated');

drop policy if exists diego_casos_update_authenticated on panel.diego_casos;
create policy diego_casos_update_authenticated
on panel.diego_casos
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists diego_casos_delete_authenticated on panel.diego_casos;
create policy diego_casos_delete_authenticated
on panel.diego_casos
for delete
using (auth.role() = 'authenticated');

grant usage on schema panel to authenticated;
grant select, insert, update, delete on panel.diego_casos to authenticated;

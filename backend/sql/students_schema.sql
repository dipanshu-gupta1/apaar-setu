-- Review with your team before running this migration.
-- This defines the contract columns. Existing tables may need a careful migration.
create extension if not exists pgcrypto;

create table if not exists public.students (
    student_id uuid primary key default gen_random_uuid(),
    first_name text not null check (length(trim(first_name)) > 0),
    last_name text not null check (length(trim(last_name)) > 0),
    date_of_birth date not null,
    gender text check (gender in ('male', 'female', 'other')),
    email text,
    phone text check (phone is null or phone ~ '^[0-9]{10}$'),
    apaar_id text,
    institution_id uuid not null,
    enrollment_number text,
    admission_year integer,
    program text,
    created_at timestamptz not null default now()
);

create index if not exists students_institution_id_idx
on public.students (institution_id);

alter table public.students enable row level security;

-- IMPORTANT: RLS policies depend on your project's authentication/authorization model.
-- Do not enable public access policies for production. Configure institution-scoped
-- policies with your team before exposing this table to client users.

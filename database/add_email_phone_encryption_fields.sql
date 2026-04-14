l-- Phase 1: prepare encrypted storage for email and phone in core.users.
-- This migration is additive and idempotent to avoid breaking current login flows.

begin;

alter table if exists core.users
  add column if not exists email_ciphertext text,
  add column if not exists email_search_exact text,
  add column if not exists email_search_partial text[],
  add column if not exists email_masked text,
  add column if not exists telefono_ciphertext text,
  add column if not exists telefono_search_exact text,
  add column if not exists telefono_search_partial text[],
  add column if not exists telefono_masked text;

comment on column core.users.email_ciphertext is
  'Client-side encrypted email payload (for example base64(iv:ciphertext:tag)).';
comment on column core.users.email_search_exact is
  'Deterministic token for exact email lookup (for example HMAC(normalized_email)).';
comment on column core.users.email_search_partial is
  'Token array for partial email search (for example normalized n-grams).';
comment on column core.users.email_masked is
  'Masked email for UI usage without full disclosure.';

comment on column core.users.telefono_ciphertext is
  'Client-side encrypted phone payload (for example base64(iv:ciphertext:tag)).';
comment on column core.users.telefono_search_exact is
  'Deterministic token for exact phone lookup (for example HMAC(normalized_phone)).';
comment on column core.users.telefono_search_partial is
  'Token array for partial phone search (for example normalized n-grams).';
comment on column core.users.telefono_masked is
  'Masked phone for UI usage without full disclosure.';

-- Keep email unique behavior for encrypted rollout using exact-token uniqueness.
create unique index if not exists ux_core_users_email_search_exact
  on core.users (email_search_exact)
  where email_search_exact is not null;

create index if not exists ix_core_users_email_search_partial
  on core.users using gin (email_search_partial);

create index if not exists ix_core_users_telefono_search_exact
  on core.users (telefono_search_exact)
  where telefono_search_exact is not null;

create index if not exists ix_core_users_telefono_search_partial
  on core.users using gin (telefono_search_partial);

commit;

-- Verification (manual)
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'core' and table_name = 'users'
--   and column_name like 'email_%' or column_name like 'telefono_%'
-- order by column_name;

-- Fase 7 - Habilitar auditoria de acciones cliente en audit.sql_executions / audit.sql_errors
-- Fecha: 2026-05-25
--
-- Objetivo:
-- 1) Permitir que sesiones anon/authenticated inserten logs de ejecucion/error.
-- 2) Mantener permisos acotados (solo INSERT) para no exponer lectura/modificacion.

begin;

grant usage on schema audit to anon, authenticated;

grant insert on table audit.sql_executions to anon, authenticated;
grant insert on table audit.sql_errors to anon, authenticated;

grant usage, select on sequence audit.sql_executions_id_seq to anon, authenticated;
grant usage, select on sequence audit.sql_errors_id_seq to anon, authenticated;

commit;


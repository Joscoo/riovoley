-- Script para eliminar columnas de altura y peso de la tabla students
-- Fecha: 2026-01-29
-- Razón: Estos datos ahora se registran exclusivamente en los tests físicos

-- Eliminar la columna altura
ALTER TABLE public.students
DROP COLUMN IF EXISTS altura;

-- Eliminar la columna peso
ALTER TABLE public.students
DROP COLUMN IF EXISTS peso;

-- Comentario: A partir de ahora, altura y peso se obtienen de la tabla physical_tests

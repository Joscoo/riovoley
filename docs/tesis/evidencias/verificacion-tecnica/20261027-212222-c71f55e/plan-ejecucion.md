# Plan de auditoría

1. Inventariar pruebas, herramientas y variables (solo nombres).
2. Ejecutar Jest completo con cobertura, contratos y pruebas Edge con mocks.
3. Compilar la web; servir localmente sin desplegar.
4. Playwright público y recuperación simulada: bloquear red externa mediante guardia.
5. Consultar únicamente catálogos SQL y asesores de seguridad; npm audit sin correcciones.
6. Verificar Android según requisitos; no instalar herramientas ni sincronizar si falta entorno.
7. Contrastar cifras de JSON, emitir documentos, revisar datos sensibles y hashes.

No se ejecutará database/tests/rls_access_matrix.sql: contiene escrituras y usa usuarios reales, aunque tenga rollback. Los E2E de roles, administración y filtros se bloquean por ausencia de entorno descartable.

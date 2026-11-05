# Corrección compatible de dependencias — Implementation Plan

> **For agentic workers:** Ejecutar con superpowers:executing-plans, sin delegación automática.

**Goal:** Reducir las alertas reparables y documentar las restantes con evidencia nueva.

**Architecture:** Conservar CRA, React, Capacitor y los gateways actuales. Aplicar únicamente parches compatibles respaldados por pruebas; mantener intactos los expedientes sellados.

**Tech Stack:** npm, Node, Jest, Playwright, CRA y Capacitor Android.

**Spec:** Solicitud de auditoría técnica y continuación del usuario en esta sesión; antecedentes en docs/tesis/README.md.

## Global Constraints

- No producción, proveedores externos, credenciales institucionales, despliegues ni cambios SQL/RLS.
- No npm audit fix --force, supresión de avisos ni cambio de framework.
- Registrar salidas reales y preservar los intentos fallidos.

## Review Focus

- Distinguir avisos heredados de herramientas frente a código servido al usuario.
- Resolver paquetes desde el consumidor real, no solo desde node_modules raíz.
- Comprobar semántica de APIs afectadas por overrides.
- No extrapolar una compilación satisfactoria a todos los flujos de negocio.
- Mantener denominadores y resultados de cada ejecución separados.

## Pasos

- [x] Abrir expediente nuevo y ejecutar npm audit en los tres árboles.
- [x] Identificar causas, rutas, rangos corregidos y avisos sin parche compatible.
- [x] Reproducir regresiones relevantes, aplicar correcciones compatibles y volver a probar.
- [x] Ejecutar Jest y compilación local; ampliar validación según cambios efectivos.
- [x] Generar informe, matriz y texto académico, revisar privacidad e integridad y publicar los avances autorizados.

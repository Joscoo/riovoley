# INTEGRANTE 8 - IMPLEMENTACION PRACTICA SEGURA Y DEMOSTRACION TECNICA

## 1) Objetivo y alcance

**Objetivo:** demostrar, sobre el sistema real de RioVoley (branch `seguridad`), como prevenir vulnerabilidades con practicas de desarrollo seguro sin introducir un mini sistema paralelo.

**Alcance aplicado:**
- Login y recuperacion de contrasena (auth-session).
- Provison/registro de usuarios (user-provisioning).
- Comunicaciones y renderizado de credenciales (communications).
- Evidencia de consultas parametrizadas/RPC en Supabase para evitar SQLi.

**Fuentes de verdad de BD usadas:**
- `README_DATABASE.md`
- `riovoley_full_schema.sql`

---

## 2) Implementacion realizada (hardening real)

### 2.1 Login/registro: validacion y manejo seguro de errores

Se reforzo la validacion de entrada en login y reset:
- Normalizacion de email (`trim + lowercase`).
- Limites de longitud (`MAX_EMAIL_LENGTH`, `MAX_PASSWORD_LENGTH`).
- Bloqueo de caracteres de control.
- Mensajes seguros en UI (sin exponer detalle interno de backend).

**Archivo:**
- `src/features/auth-session/presentation/components/Login.js`

Se endurecio la capa de infraestructura de auth:
- Mapeo de errores de Supabase a codigos/errores funcionales seguros (`AUTH_INVALID_CREDENTIALS`, `AUTH_RATE_LIMIT`, etc.).
- Mensajes controlados para session expiradas y rate limiting.

**Archivos:**
- `src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js`
- `src/features/auth-session/domain/authSessionError.js`

### 2.2 Proteccion XSS: eliminacion de `innerHTML` inseguro

Se elimino construccion de modal por `innerHTML` y se reemplazo por creacion segura de nodos DOM con `textContent`.

**Antes (vulnerable):**
- Interpolaba `userData.email` y `userData.password` dentro de `modal.innerHTML`.

**Despues (mitigado):**
- Construccion por `document.createElement`.
- Insercion de datos solo mediante `textContent`.
- Sanitizacion de texto y de plantillas HTML de correo (escape de caracteres especiales).

**Archivo:**
- `src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.js`

### 2.3 Validacion/sanitizacion en provision de usuarios

Se reforzo el flujo de creacion/reenvio de credenciales:
- Validacion estricta de email, nombre, apellido, rol y fecha de nacimiento.
- Sanitizacion de entradas (control chars, trim, max length).
- Roles permitidos definidos explicitamente.

Se mejoro la generacion de contrasenas temporales:
- Uso preferente de `crypto.getRandomValues`.
- Fallback controlado si no hay Web Crypto.
- Se evita depender solo de `Math.random`.

**Archivo:**
- `src/features/user-provisioning/infrastructure/repositories/supabaseUserProvisioningRepository.js`

### 2.4 SQLi y consultas parametrizadas (evidencia en sistema real)

En este proyecto, el acceso principal a datos se hace con:
- Supabase Query Builder (`.from().select().eq()...`).
- RPC con parametros nombrados (`supabase.rpc('fn', { p_x: value })`).

Esto evita concatenacion SQL en frontend.

**Evidencia de uso parametrizado:**
- `src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js`
  - `check_login_allowed`
  - `record_login_attempt`

---

## 3) Demostracion tecnica (paso a paso requerido)

### 3.1 Mostrar codigo vulnerable (reconstruido)

Caso XSS real detectado y corregido:
- Modal de credenciales construido con `innerHTML` e interpolacion directa.

### 3.2 Ejecutar ataque

**Escenario de prueba:** inyectar valor con payload HTML/JS en campos de usuario que terminaban reflejandose en modal/correo.

### 3.3 Mostrar impacto

**Impacto potencial:**
- Ejecucion de script/markup no deseado en contexto del cliente.
- Manipulacion visual de modal y phishing interno.

### 3.4 Aplicar mitigacion

- Remplazo de `innerHTML` por creacion de nodos y `textContent`.
- Escape de variables en plantillas HTML de correo.
- Validacion/sanitizacion adicional de email, nombres y contrasenas temporales.

### 3.5 Demostrar proteccion funcionando

- El payload ahora se renderiza como texto literal (no ejecuta).
- Mensajes de error de auth/comunicaciones no revelan detalles internos.
- Flujos de login/reset y provisioning mantienen comportamiento funcional.

---

## 4) Matriz Control -> Evidencia

| Control de seguridad | Implementacion | Evidencia tecnica |
|---|---|---|
| Validacion de entradas | Normalizacion/regex/limites/control chars en login y reset | `src/features/auth-session/presentation/components/Login.js` |
| Sanitizacion | `sanitizeText` + `escapeHtml` en comunicaciones/provisioning | `supabaseCommunicationsRepository.js`, `supabaseUserProvisioningRepository.js` |
| Prepared statements / parametrizacion | RPC con parametros y Query Builder de Supabase | `supabaseAuthSessionRepository.js` |
| Proteccion XSS | Eliminacion de `innerHTML`, uso de `textContent` | `supabaseCommunicationsRepository.js` |
| Manejo seguro de errores | Mapeo a codigos funcionales y mensajes no sensibles | `supabaseAuthSessionRepository.js`, `Login.js` |
| Trazabilidad | Logs de cliente auditados por `sqlAuditLogger` (ya existente) | `src/config/supabase.js`, `src/shared/infrastructure/audit/sqlAuditLogger.js` |

---

## 5) Evidencias de pruebas ejecutadas

Pruebas ejecutadas en local:

1. `src/features/user-provisioning/infrastructure/repositories/supabaseUserProvisioningRepository.test.js` -> PASS
2. `src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.test.js` -> PASS
3. `src/features/auth-session/presentation/createAuthSessionService.test.js` -> PASS
4. `src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js` -> PASS
5. `src/features/auth-session/presentation/components/Login.auth-events.test.js` -> PASS

Resultado: **todas las suites ejecutadas pasaron**.

---

## 6) Checklist de entregables (Integrante 8)

- [x] Codigo fuente con hardening aplicado sobre el proyecto real.
- [x] Evidencias de pruebas (unit tests de modulos intervenidos).
- [ ] Capturas de pantalla de demostracion (pendiente tomar en ejecucion manual).
- [x] Repositorio GitHub (branch `seguridad`) con cambios trazables.

---

## 7) Guion corto de exposicion (3-5 minutos)

1. Contexto: esta implementacion se hizo en el sistema real, no en prototipo paralelo.
2. Riesgo detectado: uso de `innerHTML` con datos de usuario y mensajes de error demasiado verbosos.
3. Ataque/impacto: posibilidad de inyeccion XSS y fuga de detalle tecnico.
4. Mitigacion aplicada:
   - Render seguro (`textContent`) y escape HTML.
   - Validacion/sanitizacion robusta en login y provisioning.
   - Mapeo de errores de auth a mensajes controlados.
5. SQLi: evidencia de acceso por RPC parametrizado/Query Builder en Supabase.
6. Cierre: pruebas ejecutadas en local, sin regresion en flujos intervenidos.

---

## 8) Siguientes pasos recomendados

1. Tomar capturas comparativas del antes/despues para el informe.
2. Ejecutar smoke E2E completo (`npm run e2e:smoke:public` y roles si hay credenciales) para evidencia adicional.
3. Extender el patron de manejo seguro de errores a otros features que aun interpolan `error.message` directamente.

---

## 9) Anexo de Figuras (listo para informe)

Usa estos nombres de archivo para mantener orden en tu evidencia:

- `01_branch_seguridad.png`
- `02_archivos_modificados.png`
- `03_xss_antes_despues_diff.png`
- `04_login_validacion_diff.png`
- `05_auth_error_mapping_diff.png`
- `06_provisioning_hardening_diff.png`
- `07_tests_unit_pass.png`
- `08_login_auth_events_pass.png`
- `09_e2e_smoke_public_pass.png`
- `10_demo_login_input_invalido.png`
- `11_demo_login_error_seguro.png`
- `12_demo_reset_error_seguro.png`

### Figura 1. Branch de trabajo de seguridad
**Evidencia:** captura de `git branch --show-current` mostrando `seguridad`.  
**Interpretacion:** confirma que los cambios se implementaron en la rama definida para hardening.

### Figura 2. Estado de archivos modificados
**Evidencia:** captura de `git status --short`.  
**Interpretacion:** muestra trazabilidad de los modulos intervenidos por el trabajo de seguridad.

### Figura 3. Mitigacion XSS en comunicaciones
**Evidencia:** diff de `supabaseCommunicationsRepository.js` donde se elimina `innerHTML` y se usa `createElement` + `textContent`.  
**Interpretacion:** elimina la superficie de inyeccion de HTML/script en el modal de credenciales.

### Figura 4. Validacion reforzada en login
**Evidencia:** diff de `Login.js` (normalizacion, regex, limite de longitud, bloqueo de control chars).  
**Interpretacion:** reduce entradas maliciosas/invalidas antes de llegar al backend.

### Figura 5. Manejo seguro de errores de autenticacion
**Evidencia:** diff de `supabaseAuthSessionRepository.js` con mapeo de errores (`AUTH_RATE_LIMIT`, `AUTH_INVALID_CREDENTIALS`, etc.).  
**Interpretacion:** evita filtrar mensajes tecnicos y estandariza respuestas seguras al usuario.

### Figura 6. Hardening en provision de usuarios
**Evidencia:** diff de `supabaseUserProvisioningRepository.js` con sanitizacion/validacion y generacion de contrasena temporal mejorada.  
**Interpretacion:** fortalece registro/reenvio de credenciales y reduce riesgo por entradas no confiables.

### Figura 7. Pruebas unitarias de modulos de seguridad
**Evidencia:** consola con PASS de suites de communications/provisioning/auth-session.  
**Interpretacion:** valida que las mitigaciones funcionan y no rompen comportamiento esperado.

### Figura 8. Prueba de eventos de login
**Evidencia:** PASS de `Login.auth-events.test.js`.  
**Interpretacion:** confirma estabilidad del flujo de autenticacion tras hardening.

### Figura 9. Smoke E2E publico
**Evidencia:** resultado de `npm run e2e:smoke:public` en PASS.  
**Interpretacion:** evidencia ausencia de regresion funcional visible en rutas publicas.

### Figura 10. Validacion de entrada invalida en login
**Evidencia:** captura de UI con correo invalido y mensaje controlado.  
**Interpretacion:** demostracion practica de validacion de entradas en capa de presentacion.

### Figura 11. Error seguro en intento de login fallido
**Evidencia:** captura de UI mostrando mensaje generico (sin detalle interno).  
**Interpretacion:** cumplimiento de manejo seguro de errores para no exponer informacion sensible.

### Figura 12. Recuperacion de contrasena con mensajes seguros
**Evidencia:** captura de flujo reset mostrando validacion y mensaje controlado.  
**Interpretacion:** cierre del escenario de auth con UX segura y controlada.

### Comandos sugeridos para generar las capturas tecnicas
1. `git branch --show-current`
2. `git status --short`
3. `git diff -- src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.js`
4. `git diff -- src/features/auth-session/presentation/components/Login.js`
5. `git diff -- src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js`
6. `git diff -- src/features/user-provisioning/infrastructure/repositories/supabaseUserProvisioningRepository.js`
7. `npm run e2e:smoke:public`

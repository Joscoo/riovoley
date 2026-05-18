# Documentacion de Encriptacion de PII (Email y Telefono)

Este documento explica toda la implementacion actual de proteccion de datos sensibles (email y telefono), donde se cifra, donde se generan tokens de busqueda, y donde se persisten esos campos.

## 1. Alcance actual

Campos protegidos:
- email
- telefono

Modo actual:
- Hibrido
- Se generan y guardan campos cifrados y de busqueda
- Se mantienen campos en claro por compatibilidad operativa

## 2. Donde ocurre el cifrado

Archivo principal:
- [src/utils/piiCrypto.js](src/utils/piiCrypto.js)

En este archivo vive toda la logica criptografica:

1. Fuente de clave
- Se usa `REACT_APP_PII_ENCRYPTION_KEY` desde variables de entorno.
- Si falta, se lanza error para evitar escrituras sin proteccion.

2. Cifrado de contenido
- Algoritmo: AES-GCM (Web Crypto API).
- Se deriva una clave a partir de la variable de entorno con SHA-256.
- Se genera IV aleatorio por registro.
- Salida de ciphertext con formato: `v1.<iv_base64>.<cipher_base64>`.

3. Tokens de busqueda
- Algoritmo: HMAC-SHA256.
- Token exacto: para igualdad (`*_search_exact`).
- Tokens parciales: para busqueda parcial via n-gramas (`*_search_partial`).

4. Campos enmascarados
- `email_masked`
- `telefono_masked`

5. Funcion integradora
- `withEncryptedUserContactFields(userPayload)`
- Toma payloads de usuario y agrega:
  - email_ciphertext
  - email_search_exact
  - email_search_partial
  - email_masked
  - telefono_ciphertext
  - telefono_search_exact
  - telefono_search_partial
  - telefono_masked

## 3. Donde se aplica antes de guardar

### 3.1 Alta de usuarios/estudiantes
- [src/features/user-provisioning/infrastructure/repositories/supabaseUserProvisioningRepository.js](src/features/user-provisioning/infrastructure/repositories/supabaseUserProvisioningRepository.js)

Flujo:
1. Se crea usuario en Supabase Auth (email/password).
2. Antes de insertar en `users`, se ejecuta `withEncryptedUserContactFields(...)`.
3. Se inserta el payload enriquecido en `users`.

Importante:
- Auth y perfil de login siguen su propio flujo.
- El cifrado actual cubre la tabla de negocio `users`.

### 3.2 Edicion de atletas
- [src/features/athletes/presentation/components/AtletasManager.js](src/features/athletes/presentation/components/AtletasManager.js)

Flujo:
1. En `updateAtleta`, se arma `userUpdatePayload` con `withEncryptedUserContactFields(...)`.
2. Se hace `update` en `users` con ese payload.

### 3.3 Edicion de entrenadores
- [src/features/trainer-management/presentation/components/EntrenadoresManager.js](src/features/trainer-management/presentation/components/EntrenadoresManager.js)

Flujo:
1. En `handleSubmit` (edicion), `updateData` pasa por `withEncryptedUserContactFields(...)`.
2. Se hace `update` en `users` con datos protegidos.

### 3.4 Capa de repositorios por feature
- [src/features/user-management/infrastructure/repositories/supabaseUserManagementRepository.js](src/features/user-management/infrastructure/repositories/supabaseUserManagementRepository.js)

Flujo:
- Los repositorios por feature aplican `withEncryptedUserContactFields(...)` antes de insertar/actualizar cuando corresponde.

## 4. Soporte en base de datos

### 4.1 Columnas de cifrado y busqueda
- [database/add_email_phone_encryption_fields.sql](database/add_email_phone_encryption_fields.sql)

Este script agrega en `core.users`:
- email_ciphertext
- email_search_exact
- email_search_partial
- email_masked
- telefono_ciphertext
- telefono_search_exact
- telefono_search_partial
- telefono_masked

Ademas crea indices para busqueda exacta y parcial.

### 4.2 Vista de compatibilidad publica
- [database/create_public_compatibility_views.sql](database/create_public_compatibility_views.sql)

Esta vista publica incluye los campos cifrados/derivados para que PostgREST acepte payloads con esas columnas.

## 5. Variables de entorno necesarias

Archivo ejemplo:
- [.env.example](.env.example)

Variable requerida:
- `REACT_APP_PII_ENCRYPTION_KEY`

Archivo local esperado:
- [.env.local](.env.local)

## 6. Como explicarlo de forma simple

Resumen ejecutivo:
1. El frontend toma email/telefono.
2. Antes de guardar, genera:
- ciphertext (dato protegido)
- hash exacto (busqueda exacta)
- hashes parciales (busqueda parcial)
- version enmascarada (UI)
3. Ese conjunto se guarda en `users`.
4. Hoy tambien se mantiene email/telefono en claro por compatibilidad.

## 7. Limitaciones actuales

1. Modo hibrido
- Aun existen columnas en claro (`email`, `telefono`) en lecturas/escrituras de compatibilidad.

2. Clave en frontend
- La clave de cifrado reside en entorno cliente.
- Protege en reposo en BD, pero no es equivalente a un modelo de cifrado con clave exclusivamente backend/HSM.

3. Login no cambia
- Supabase Auth requiere email en su flujo propio de autenticacion.

## 8. Checklist de verificacion tecnica

1. Crear usuario nuevo desde admin.
2. Consultar `core.users` y validar que existen valores en:
- email_ciphertext
- email_search_exact
- email_search_partial
- email_masked
- telefono_ciphertext
- telefono_search_exact
- telefono_search_partial
- telefono_masked
3. Confirmar formato `v1...` en ciphertext.
4. Confirmar arrays de hashes en campos parciales.
5. Confirmar que la aplicacion sigue funcionando en pantallas actuales.

## 9. Proximo paso recomendado

Para pasar a modo estricto:
1. Dejar de persistir email/telefono en claro en `users`.
2. Mantener compatibilidad de autenticacion por separado en Auth.
3. Hacer backfill de historicos y luego retirar columnas planas cuando todo el consumo este migrado.

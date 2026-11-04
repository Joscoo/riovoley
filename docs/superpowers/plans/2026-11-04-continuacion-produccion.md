# Continuación de preparación de producción

**Objetivo:** comprobar el candidato Android existente y la vigencia del paquete SQL/Edge, sin solicitar ni cambiar credenciales.

**Arquitectura y herramientas:** mantener React/CRA, Capacitor y Supabase. Utilizar el APK debug privado ya construido, un AVD nuevo y solo el backend local descartable. Leer metadatos institucionales con MCP y CLI autenticadas. Conservar los expedientes anteriores intactos.

**Especificación:** auditoría técnica inicial y continuación solicitada el 4 de noviembre; límites y artefactos en [RUNBOOK](../../produccion/RUNBOOK.md).

- [x] Registrar contexto, herramientas, recursos y disponibilidad del laboratorio. Docker detenido y memoria insuficiente: bloqueo conservado, sin iniciar emulador.
- [x] Leer catálogo, precondiciones y asesores institucionales; huella coincidente y cuatro hashes SQL intactos. No se sustituyeron huellas.
- [x] Comprobar Vercel y Edge: producción frontend anterior; nueve revisiones distintas con nueve hashes de bundle idénticos. Tres análisis npm sin avisos y cuatro respuestas públicas HTTP 200.
- [x] Con el laboratorio existente y más recursos: AVD nuevo, APK debug verificado y 13/13 verificaciones WebView locales aprobadas; emuladores propios detenidos. El release abrió portada y enlace nativo tras conservar los intentos fallidos. Las consultas ampliadas de tablas policy no acreditan aislamiento universal: límites explícitos en el nuevo expediente Android.
- [x] Documentar resultados y paquete concreto para revisión, con permisos pendientes y límites. No se despliega ni se aplican SQL/permisos.
- [ ] Verificar privacidad e integridad, sellar y subir los avances a la rama existente.

**Revisión:** evitar atribuir resultados de un APK anterior al actual, confundir metadatos con pruebas funcionales, publicar PII, reutilizar un AVD de usuario o ejecutar escrituras contra un destino institucional. No se amplían pruebas sin necesidad ni se modifican expectativas para obtener una aprobación.

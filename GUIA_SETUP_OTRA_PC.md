# Guia de setup en otra computadora (Riovoley)

Esta guia explica como clonar, configurar y ejecutar el proyecto en una nueva PC.

## 1) Requisitos previos

- Git instalado
- Node.js LTS (recomendado: 18 o superior)
- npm (viene con Node)
- Acceso a las credenciales de entorno del proyecto

## 2) Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd riovoley
```

## 3) Instalar dependencias

```bash
npm install
```

## 4) Configurar variables de entorno

Este proyecto usa variables de entorno. No se debe compartir el archivo real con secretos.

1. Crear archivo local desde la plantilla:

```bash
# PowerShell
Set-Location .\riovoley   # solo si estas en C:\Riovoley
Copy-Item .env.example .env.local
```

Alternativa (si prefieres la plantilla local):

```bash
# PowerShell
Set-Location .\riovoley   # solo si estas en C:\Riovoley
Copy-Item .env.local.example .env.local
```

2. Abrir `.env.local` y completar valores reales.

### Variables obligatorias para iniciar la app

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

### Variables opcionales (funcionalidades WhatsApp)

- REACT_APP_WHATSAPP_ACCESS_TOKEN
- REACT_APP_WHATSAPP_PHONE_NUMBER_ID
- REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID
- REACT_APP_CLUB_ADMIN_PHONE
- REACT_APP_CLUB_COACH_PHONE
- REACT_APP_CLUB_EMERGENCY_PHONE

## 5) Levantar el proyecto

```bash
npm start
```

La app abre en:

- http://localhost:3000

## 6) Comandos utiles

```bash
npm test
npm run build
npm run e2e
```

## 7) Problemas comunes

### Error por Supabase faltante

Si faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY, la app falla al iniciar.

Solucion:

1. Revisar `.env.local`
2. Confirmar que no haya espacios o comillas extras
3. Reiniciar el servidor con `npm start`

### Cambie variables y no impacta

Siempre reinicia el servidor de desarrollo cuando cambias variables de entorno.

### Error `Copy-Item` no encuentra `.env.local.example`

Si aparece una ruta como `C:\Riovoley\.env.local.example`, estas parado en la carpeta padre.

Solucion:

1. Ir a la carpeta del proyecto: `Set-Location C:\Riovoley\riovoley`
2. Verificar archivo: `Test-Path .env.local.example` (debe devolver `True`)
3. Ejecutar copia: `Copy-Item .env.local.example .env.local`

## 8) Reglas de seguridad para el equipo

- No subir secretos al repositorio
- No compartir `.env.local` por chat publico
- Compartir credenciales por un canal seguro (gestor de secretos)
- Mantener `.env.example` solo con placeholders o valores no sensibles

## 9) Flujo recomendado para colaborar

1. Crear rama nueva
2. Hacer cambios
3. Probar con `npm start` y, si aplica, `npm test`
4. Abrir Pull Request

---

Si necesitas, se puede crear una version corta de esta guia para onboarding rapido de 5 minutos.

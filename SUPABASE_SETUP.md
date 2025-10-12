# Configuración de Supabase con Vercel

## 🔧 Configuración Local

### 1. Variables de Entorno Locales

Ya tienes el archivo `.env.local` creado. Necesitas completarlo con los datos de tu proyecto Supabase:

1. Ve a tu dashboard de Supabase: https://app.supabase.com/
2. Selecciona tu proyecto
3. Ve a Settings > API
4. Copia los siguientes valores:

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-publica-anonima
```

### 2. Probar Localmente

Ejecuta tu proyecto localmente para probar la conexión:

```bash
npm start
```

## 🚀 Configuración en Vercel

### Opción 1: A través del Dashboard de Vercel (Recomendado)

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "riovoley"
3. Ve a la pestaña "Settings"
4. En el menú lateral, selecciona "Environment Variables"
5. Añade las siguientes variables:

| Name | Value | Environment |
|------|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://tu-proyecto-id.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `tu-clave-publica-anonima` | Production, Preview, Development |

6. Guarda los cambios
7. Ve a la pestaña "Deployments"
8. Haz clic en "Redeploy" en el último deployment

### Opción 2: A través de Vercel CLI

Si tienes Vercel CLI instalado:

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Configurar variables de entorno
vercel env add REACT_APP_SUPABASE_URL
# Cuando te pregunte, ingresa: https://tu-proyecto-id.supabase.co
# Selecciona: Production, Preview, Development

vercel env add REACT_APP_SUPABASE_ANON_KEY  
# Cuando te pregunte, ingresa tu clave pública anónima
# Selecciona: Production, Preview, Development

# Redesplegar
vercel --prod
```

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Proyecto funciona localmente (`npm start`)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Proyecto redesplegado en Vercel
- [ ] Prueba de login/signup funciona en producción

## 🔍 Verificar la Conexión

### En Local:
Abre http://localhost:3000 y verifica que no hay errores en la consola del navegador.

### En Producción:
1. Ve a tu URL de Vercel
2. Abre las herramientas de desarrollador (F12)
3. Ve a la consola
4. Verifica que no hay errores relacionados con Supabase

## 🆘 Solución de Problemas

### Error: "Faltan las variables de entorno de Supabase"
- Verifica que las variables estén configuradas correctamente
- Asegúrate de que los nombres sean exactamente: `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY`
- En Vercel, verifica que las variables estén asignadas a todos los entornos (Production, Preview, Development)

### Error de CORS o conexión
- Verifica que la URL de Supabase sea correcta
- En Supabase, ve a Settings > API y verifica que la URL del proyecto esté activa

### El login no funciona
- Verifica que tengas autenticación habilitada en Supabase
- Ve a Authentication > Settings en tu dashboard de Supabase
- Asegúrate de que "Enable email confirmations" esté configurado según tus necesidades

## 🔐 Seguridad

### Variables que SÍ puedes exponer (Frontend):
- `REACT_APP_SUPABASE_URL`: URL pública de tu proyecto
- `REACT_APP_SUPABASE_ANON_KEY`: Clave pública anónima (segura para frontend)

### Variables que NO debes exponer:
- `SUPABASE_SERVICE_ROLE_KEY`: Solo para backend/servidor
- `SUPABASE_JWT_SECRET`: Solo para backend/servidor

## 🧪 Archivo de Pruebas

Puedes usar el componente `LoginSupabase.js` que se creó para probar la conexión:

```javascript
import LoginSupabase from './LoginSupabase';

// En tu App.js o componente principal
function App() {
  return (
    <div>
      <LoginSupabase />
    </div>
  );
}
```

## 📚 Próximos Pasos

1. Configurar Row Level Security (RLS) en Supabase
2. Crear las tablas necesarias para tu aplicación
3. Configurar políticas de seguridad
4. Migrar datos desde Firebase (si aplica)
5. Actualizar componentes existentes para usar Supabase

## 🔗 Enlaces Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
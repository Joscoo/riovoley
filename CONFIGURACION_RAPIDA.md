# Script de Configuración Rápida

## Configurar Supabase Dashboard

### URLs de Redirección a Agregar:

**Local:**
```
http://localhost:3000/reset-password
```

**Producción (actualiza con tu dominio):**
```
https://tu-app.vercel.app/reset-password
```

## Comandos Git para Deploy

```bash
# Ver el estado de los archivos
git status

# Agregar todos los cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat: sistema completo de recuperación de contraseña, panel de entrenador y configuración de perfil"

# Subir a GitHub (esto activará el deploy automático en Vercel)
git push origin main
```

## Verificar Variables de Entorno en Vercel

Asegúrate de tener estas variables:

```
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

## Probar Localmente Antes de Deploy

```bash
# Instalar dependencias (si es necesario)
npm install

# Iniciar en modo desarrollo
npm start
```

## URLs Importantes

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Tu App Local:** http://localhost:3000
- **Tu App en Producción:** https://tu-app.vercel.app

## Orden de Configuración

1. ✅ Código ya está listo (componentes creados)
2. 🔧 Configurar Supabase (agregar redirect URLs)
3. 📤 Subir a GitHub (git add, commit, push)
4. ⏳ Esperar deploy automático en Vercel
5. 🧪 Probar en producción

## Prueba Rápida

1. Ve a tu sitio → Login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu bandeja de entrada
5. Haz clic en el enlace del email
6. Ingresa nueva contraseña
7. ¡Listo! Redirige al login

---

**Tiempo estimado total:** 10-15 minutos

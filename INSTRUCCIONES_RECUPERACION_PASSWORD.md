# 📧 Configuración de Recuperación de Contraseña

## ✅ Componentes Creados

1. **ResetPassword.js** - Página para restablecer contraseña ✅
2. **Ruta agregada en App.js** - `/reset-password` ✅
3. **Modal y función en Login.js** - "¿Olvidaste tu contraseña?" ✅

---

## 🔧 Configuración en Supabase (IMPORTANTE)

### Paso 1: Configurar la URL de Redirección en Supabase

1. Ve a tu proyecto en **Supabase Dashboard**: https://app.supabase.com
2. En el menú lateral, selecciona **Authentication** → **URL Configuration**
3. En la sección **Redirect URLs**, agrega las siguientes URLs:

   **Para desarrollo local:**
   ```
   http://localhost:3000/reset-password
   ```

   **Para producción (Vercel):**
   ```
   https://tu-dominio.vercel.app/reset-password
   ```
   
   ⚠️ **IMPORTANTE**: Reemplaza `tu-dominio` con tu dominio real de Vercel

4. Haz clic en **Save** para guardar los cambios

### Paso 2: Configurar Email Templates (Opcional pero Recomendado)

1. En Supabase Dashboard, ve a **Authentication** → **Email Templates**
2. Selecciona **Reset Password**
3. Personaliza el email si lo deseas (el template por defecto funciona bien)
4. Asegúrate de que el enlace use: `{{ .SiteURL }}/reset-password`

---

## 📤 Subir Cambios a Vercel

### Opción A: Deploy Automático (Recomendado)

Si tienes integración con GitHub:

```bash
# 1. Agregar todos los archivos nuevos
git add .

# 2. Hacer commit
git commit -m "feat: agregar recuperación de contraseña y panel de entrenador"

# 3. Subir a GitHub
git push origin main
```

Vercel detectará automáticamente los cambios y hará deploy.

### Opción B: Deploy Manual desde Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto
3. Haz clic en **Deployments**
4. Haz clic en **Deploy** → **Deploy from GitHub**

---

## 🧪 Probar la Funcionalidad

### En Desarrollo Local:

1. **Iniciar la aplicación:**
   ```bash
   npm start
   ```

2. **Probar recuperación de contraseña:**
   - Ve a http://localhost:3000/login
   - Haz clic en "¿Olvidaste tu contraseña?"
   - Ingresa un email registrado
   - Haz clic en "Enviar Enlace"
   - Revisa tu bandeja de entrada

3. **Restablecer contraseña:**
   - Abre el email recibido
   - Haz clic en el enlace
   - Ingresa tu nueva contraseña
   - Confirma la nueva contraseña
   - Haz clic en "Actualizar Contraseña"

### En Producción (Vercel):

Mismo proceso pero usando tu URL de Vercel.

---

## 🔐 Variables de Entorno en Vercel

Verifica que estas variables estén configuradas en Vercel:

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

2. Asegúrate de tener:
   ```
   REACT_APP_SUPABASE_URL=tu-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=tu-supabase-anon-key
   ```

3. Si no están, agrégalas:
   - Haz clic en **Add New**
   - Agrega cada variable
   - Selecciona todos los entornos (Production, Preview, Development)
   - Haz clic en **Save**

4. **Redeploy** el proyecto después de agregar variables:
   - Ve a **Deployments**
   - Selecciona el último deployment
   - Haz clic en los 3 puntos → **Redeploy**

---

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: "Enlace inválido o expirado"
**Solución:** Verifica que la URL de redirección en Supabase coincida exactamente con tu dominio.

### Problema 2: No llega el email
**Soluciones:**
- Revisa la carpeta de SPAM
- Verifica que el email esté registrado en Supabase
- En Supabase → Authentication → Users, verifica que el usuario existe
- Revisa los logs en Supabase → Logs

### Problema 3: Error al actualizar contraseña
**Solución:** Asegúrate de que la contraseña tenga al menos 6 caracteres.

### Problema 4: Redirección no funciona en producción
**Solución:** 
1. Verifica la URL en `Login.js` línea 306:
   ```javascript
   redirectTo: `${window.location.origin}/reset-password`
   ```
2. Asegúrate de que esta URL esté en las Redirect URLs de Supabase

---

## 🎯 Checklist Final

Antes de dar por terminado, verifica:

- [ ] URLs de redirección agregadas en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Cambios subidos a GitHub
- [ ] Deploy completado en Vercel
- [ ] Prueba de recuperación de contraseña funciona en local
- [ ] Prueba de recuperación de contraseña funciona en producción
- [ ] Email de recuperación se recibe correctamente
- [ ] Página de reset funciona y actualiza la contraseña
- [ ] Redirección al login después de actualizar funciona

---

## 📝 Archivos Modificados/Creados

1. ✅ `src/components/ResetPassword.js` - Nuevo componente
2. ✅ `src/components/Login.js` - Agregado modal y función de recuperación
3. ✅ `src/App.js` - Agregada ruta `/reset-password`

---

## 🚀 Comando Rápido para Deploy

```bash
# Todo en uno
git add . && git commit -m "feat: recuperación de contraseña completa" && git push origin main
```

---

## 💡 Notas Adicionales

- El enlace de recuperación expira en **1 hora** (configuración por defecto de Supabase)
- Los usuarios pueden solicitar un nuevo enlace si el anterior expiró
- La contraseña debe tener **mínimo 6 caracteres**
- Después de actualizar la contraseña, el usuario es redirigido automáticamente al login
- El sistema usa la funcionalidad nativa de Supabase para seguridad máxima

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema:
1. Revisa los logs del navegador (F12 → Console)
2. Revisa los logs de Supabase (Dashboard → Logs)
3. Verifica que las URLs coincidan exactamente
4. Asegúrate de que el email del usuario esté confirmado en Supabase

---

**¡Listo!** 🎉 Una vez completados estos pasos, tu sistema de recuperación de contraseña estará funcionando perfectamente.

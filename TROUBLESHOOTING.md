# 🔧 Solución de Problemas - Variables de Entorno

## ❌ Error Actual
```
Faltan las variables de entorno de Supabase. Verifica que REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY estén definidas.
```

## 🚀 Soluciones (Probar en orden)

### 1. 📁 Verificar Ubicación del Archivo
El archivo `.env.local` DEBE estar en la **raíz del proyecto**, al mismo nivel que `package.json`:

```
d:\Riovoley\riovoley\
├── .env.local          ← AQUÍ
├── package.json
├── src/
└── public/
```

### 2. 🔍 Verificar Contenido del Archivo
El archivo `.env.local` debe contener EXACTAMENTE:

```env
REACT_APP_SUPABASE_URL=https://mayvvlkvheagkojunzzb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heXZ2bGt2aGVhZ2tvanVuenpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTQ4MDksImV4cCI6MjA2OTMzMDgwOX0.Bd_Oz9SI1bXNtXukK7wOv8jEE-jlxsl1EfeHepFRoXU
```

**IMPORTANTE:** 
- ❌ Sin espacios antes o después del `=`
- ❌ Sin comillas alrededor de los valores
- ❌ Sin líneas vacías entre las variables

### 3. 🔄 Reiniciar el Servidor de Desarrollo

**OBLIGATORIO después de cambiar .env.local:**

1. Para el servidor actual: `Ctrl + C` en la terminal
2. Reinicia: `npm start`

### 4. 💻 Pasos Manual de Verificación

1. **Abrir PowerShell en la carpeta del proyecto:**
   ```powershell
   cd "d:\Riovoley\riovoley"
   ```

2. **Verificar que el archivo existe:**
   ```powershell
   Get-Content .env.local
   ```

3. **Reiniciar completamente:**
   ```powershell
   # Detener procesos Node
   taskkill /f /im node.exe
   
   # Limpiar caché
   npm start
   ```

### 5. 🔧 Recrear el Archivo Manualmente

Si nada funciona, borra el `.env.local` y créalo de nuevo:

1. **Eliminar archivo actual:**
   ```powershell
   del .env.local
   ```

2. **Crear nuevo archivo:**
   ```powershell
   echo REACT_APP_SUPABASE_URL=https://mayvvlkvheagkojunzzb.supabase.co > .env.local
   echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heXZ2bGt2aGVhZ2tvanVuenpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTQ4MDksImV4cCI6MjA2OTMzMDgwOX0.Bd_Oz9SI1bXNtXukK7wOv8jEE-jlxsl1EfeHepFRoXU >> .env.local
   ```

3. **Verificar contenido:**
   ```powershell
   Get-Content .env.local
   ```

4. **Reiniciar servidor:**
   ```powershell
   npm start
   ```

### 6. 🌐 Verificar en el Navegador

Una vez que arranque sin errores:

1. Abre `http://localhost:3000`
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña "Console"
4. Deberías ver: `🔍 Supabase Config Debug: URL: ✅ OK, Key: ✅ OK`

### 7. 📝 Alternativa: Usar Variables Hardcodeadas (Solo para Testing)

Si las variables de entorno no funcionan, puedes temporalmente hardcodear los valores en `src/config/supabase.js`:

```javascript
// TEMPORAL - Solo para testing
const supabaseUrl = 'https://mayvvlkvheagkojunzzb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heXZ2bGt2aGVhZ2tvanVuenpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTQ4MDksImV4cCI6MjA2OTMzMDgwOX0.Bd_Oz9SI1bXNtXukK7wOv8jEE-jlxsl1EfeHepFRoXU'

// Comentar estas líneas:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
```

### 8. 🆘 Si Nada Funciona

Contacta con el error exacto y:
1. Contenido de `.env.local`
2. Ubicación del archivo
3. Mensaje de error completo en la consola
4. Sistema operativo y versión de Node

## ✅ Resultado Esperado

Cuando funcione correctamente verás:
- ✅ La app arranca sin errores
- ✅ En consola: "🔍 Supabase Config Debug: URL: ✅ OK, Key: ✅ OK"
- ✅ Puedes navegar a `/login` sin problemas
# 🧪 Guía de Pruebas - Level Audio

## ✅ Cambios Implementados

### 1. Acceso Premium Permanente para Admins
- ✅ Los emails `davidv111111@gmail.com` y `santiagov.t068@gmail.com` tienen acceso premium permanente
- ✅ Verificación de email de admin en múltiples puntos del código
- ✅ Los admins pasan automáticamente la verificación de beta

### 2. Funciones Premium Desbloqueadas
- ✅ AI Mastering completamente accesible para admins
- ✅ Botones de subida de géneros de referencia (solo admins)
- ✅ Todas las funciones premium desbloqueadas automáticamente

### 3. Mejoras de Seguridad
- ✅ Google Sign In mejorado con mejor manejo de errores
- ✅ Sistema de "Olvidé mi contraseña" completamente funcional
- ✅ Verificación de beta bypass para admins

### 4. Guía Completa
- ✅ La guía ahora se muestra completa al presionar el botón

## 🚀 Cómo Probar en Localhost:8080

### Paso 1: Iniciar el Backend

```powershell
cd backend
.\start_with_credentials.ps1
```

**Espera a ver:**
```
✅ Cliente de GCS inicializado para bucket: spectrum-mastering-files-857351913435
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Paso 2: Iniciar el Frontend

```powershell
# En otra terminal
cd sonic-refine-suite
npm run dev
```

**Espera a ver:**
```
➜  Local:   http://localhost:8080/
```

### Paso 3: Abrir en el Navegador

1. Abre: **http://localhost:8080**
2. Deberías ver la aplicación Level Audio

### Paso 4: Probar Acceso Premium como Admin

1. **Inicia sesión con un email de admin:**
   - Email: `davidv111111@gmail.com` o `santiagov.t068@gmail.com`
   - Contraseña: tu contraseña
   - O haz clic en "Google" para iniciar sesión con Google

2. **Verifica acceso premium:**
   - Deberías ver la pestaña "AI Mastering" disponible
   - No deberías ver mensajes de "Premium Feature Locked"
   - Deberías ver el badge "✨ Premium" en AI Mastering

3. **Probar botones de admin en AI Mastering:**
   - Ve a la pestaña "AI Mastering"
   - Deberías ver un badge "Admin Mode" en la sección de presets
   - Deberías ver botones "+" pequeños en cada preset de género
   - Haz clic en un "+" para subir un archivo de referencia para ese género

4. **Probar funciones premium:**
   - Sube un archivo de audio
   - Selecciona un preset o sube tu propia referencia
   - Haz clic en "✨ Master My Track"
   - El procesamiento debería comenzar sin restricciones

### Paso 5: Verificar que Otros Usuarios Solo Tienen Acceso Básico

1. **Cierra sesión** (si estás como admin)
2. **Crea una cuenta nueva** o inicia sesión con un email que NO sea admin
3. **Verifica restricciones:**
   - La pestaña "AI Mastering" debería mostrar un mensaje de "Premium Feature"
   - No deberías ver los botones "+" de admin
   - Las funciones básicas (Upload, Enhancement, Tracks) deberían estar disponibles

## 🔍 Verificación de Funciones Específicas

### Google Sign In
1. Ve a la pantalla de inicio
2. Haz clic en "Sign In"
3. Haz clic en el botón "Google"
4. Deberías ser redirigido a Google para autenticación
5. Después de autenticarte, deberías ser redirigido de vuelta a la app

### Olvidé mi Contraseña
1. En la pantalla de Sign In, haz clic en "Forgot password?"
2. Ingresa tu email
3. Haz clic en "Send Reset Link"
4. Revisa tu email para el enlace de reset
5. Haz clic en el enlace del email
6. Deberías ver un formulario para ingresar tu nueva contraseña
7. Ingresa y confirma tu nueva contraseña
8. Deberías ser redirigido a la app y poder iniciar sesión

### Guía Completa
1. En cualquier pantalla, haz clic en el botón "Guide"
2. Deberías ver una ventana modal con toda la guía
3. Deberías poder hacer scroll y ver todo el contenido
4. La guía debería incluir:
   - Quick Start Guide
   - Minimum Technical Requirements
   - Backend-Free Technologies
   - Keyboard Shortcuts
   - Performance Tips & Troubleshooting

## 🐛 Troubleshooting

### Si no ves los cambios en localhost:8080

1. **Verifica que el frontend esté corriendo:**
   ```powershell
   # Deberías ver en la terminal:
   ➜  Local:   http://localhost:8080/
   ```

2. **Limpia la caché del navegador:**
   - Presiona `Ctrl+Shift+Delete`
   - Selecciona "Cached images and files"
   - Haz clic en "Clear data"
   - Recarga la página (F5 o Ctrl+R)

3. **Recarga forzada:**
   - Presiona `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac)
   - Esto fuerza una recarga sin caché

4. **Verifica la consola del navegador:**
   - Presiona F12 para abrir DevTools
   - Ve a la pestaña "Console"
   - Busca errores en rojo
   - Si hay errores, compártelos para diagnosticar

### Si el acceso premium no funciona para admins

1. **Verifica que estés usando el email correcto:**
   - `davidv111111@gmail.com` o `santiagov.t068@gmail.com`
   - El email debe estar en minúsculas

2. **Verifica la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a Console
   - Busca mensajes relacionados con `useUserSubscription`
   - Deberías ver logs indicando que el email es admin

3. **Verifica en la base de datos:**
   - El hook verifica el email directamente, no depende de la base de datos
   - Pero si hay un rol 'admin' en la tabla `user_roles`, también funcionará

## 📊 Checklist de Verificación

- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:8080
- [ ] Puedo iniciar sesión como admin
- [ ] Veo la pestaña "AI Mastering" sin restricciones
- [ ] Veo el badge "Admin Mode" en AI Mastering
- [ ] Veo los botones "+" en los presets de género
- [ ] Puedo subir géneros de referencia como admin
- [ ] Puedo masterizar audio sin restricciones
- [ ] Google Sign In funciona
- [ ] Olvidé mi contraseña funciona
- [ ] La guía se muestra completa
- [ ] Otros usuarios solo tienen acceso básico

## 🎯 Próximos Pasos

1. **Completar configuración MCP:**
   - Obtener SERVICE_KEY de Supabase
   - Reemplazar en settings.json
   - Reiniciar Cursor

2. **Probar todas las funciones:**
   - Probar cada función premium como admin
   - Verificar que los usuarios normales no tengan acceso

3. **Verificar en producción:**
   - Una vez que todo funcione en localhost, verificar en Lovable

---

**Nota:** Si encuentras algún problema, revisa la consola del navegador (F12) y los logs del backend para más información.








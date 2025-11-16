# 🌐 URLs y Acceso Remoto - Level Audio

## 📋 Tabla de URLs Disponibles

| URL | Descripción | Estado | Uso | Acceso Premium |
|-----|-------------|--------|-----|----------------|
| **https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com** | **URL de Producción (Lovable)** | ✅ Funcionando | **RECOMENDADO para acceso remoto** | ✅ Sí (para admins) |
| **http://localhost:8080** | URL Local (Desarrollo) | ⚠️ Necesita rebuild | Solo en tu máquina local | ✅ Sí (para admins) |
| **https://mastering-backend-azkp62xtaq-uc.a.run.app** | Backend Python (Cloud Run) | ✅ Funcionando | API backend para mastering | N/A |

---

## 🚀 Solución: Acceso Remoto para el Otro Admin

### **Opción 1: Usar URL de Lovable (RECOMENDADO) ⭐**

Esta es la forma más fácil y confiable:

1. **Comparte esta URL con tu colaborador:**
   ```
   https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com
   ```

2. **El colaborador debe:**
   - Abrir la URL en su navegador
   - Iniciar sesión con su email de admin: `santiagov.t068@gmail.com`
   - Tendrá acceso premium automáticamente

3. **Ventajas:**
   - ✅ No requiere configuración adicional
   - ✅ Siempre actualizado (se sincroniza con Lovable)
   - ✅ Funciona desde cualquier lugar
   - ✅ No necesita que tu computadora esté encendida

---

### **Opción 2: Arreglar URL Local y Configurar Acceso Remoto**

Si prefieres usar la URL local, sigue estos pasos:

#### **Paso 1: Reconstruir el Frontend Local**

```powershell
# En la terminal, desde la raíz del proyecto
cd sonic-refine-suite

# Limpiar caché y reconstruir
npm run build

# O si prefieres modo desarrollo
npm run dev
```

#### **Paso 2: Verificar Variables de Entorno**

Crea un archivo `.env.local` en `sonic-refine-suite/` con:

```env
# Supabase (obtén estos valores de Lovable Cloud > Settings > Environment Variables)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key

# Backend Python
VITE_PYTHON_BACKEND_URL=https://mastering-backend-azkp62xtaq-uc.a.run.app
```

**Para obtener las variables de Supabase:**
1. Ve a Lovable Cloud
2. Settings > Environment Variables
3. Copia `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`

#### **Paso 3: Configurar Acceso Remoto con ngrok (Opcional)**

Si quieres que el otro admin acceda a tu localhost:

```powershell
# Instalar ngrok (si no lo tienes)
# Descarga desde: https://ngrok.com/download

# Ejecutar ngrok para exponer el puerto 8080
ngrok http 8080
```

Esto te dará una URL temporal como: `https://abc123.ngrok.io`

**⚠️ Limitaciones:**
- La URL cambia cada vez que reinicias ngrok (versión gratuita)
- Tu computadora debe estar encendida
- Requiere conexión a internet estable

---

## 🔧 Pasos para Arreglar el Acceso Local

### **Problema: UI Viejo y Acceso Premium Bloqueado**

**Solución:**

1. **Detener el servidor actual:**
   ```powershell
   # Presiona CTRL+C en la terminal donde corre npm run dev
   ```

2. **Limpiar caché:**
   ```powershell
   cd sonic-refine-suite
   rm -rf node_modules/.vite
   rm -rf dist
   ```

3. **Reinstalar dependencias (si es necesario):**
   ```powershell
   npm install
   ```

4. **Verificar variables de entorno:**
   - Asegúrate de tener `.env.local` con las variables correctas
   - O verifica que Lovable tenga las variables configuradas

5. **Reiniciar el servidor:**
   ```powershell
   npm run dev
   ```

6. **Verificar acceso admin:**
   - Inicia sesión con `davidv111111@gmail.com` o `santiagov.t068@gmail.com`
   - Deberías ver acceso premium automáticamente

---

## 📝 Checklist para el Otro Admin

### **Para Acceder desde su Casa:**

- [ ] **Opción A (Recomendada):** Usar URL de Lovable
  - [ ] Abrir: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
  - [ ] Iniciar sesión con: `santiagov.t068@gmail.com`
  - [ ] Verificar que ve el badge "✨ Premium" en AI Mastering

- [ ] **Opción B:** Acceso remoto a localhost (si configuraste ngrok)
  - [ ] Obtener URL de ngrok de ti
  - [ ] Abrir la URL en su navegador
  - [ ] Iniciar sesión con su email de admin

### **Para Masterizar Audio:**

1. **Verificar que tiene acceso premium:**
   - Debe ver la pestaña "AI Mastering" disponible
   - Debe ver el badge "✨ Premium" en AI Mastering

2. **Subir archivo de referencia (solo admins):**
   - En AI Mastering, verá botones "+" junto a cada preset
   - Puede subir canciones de referencia para cada género

3. **Masterizar audio:**
   - Subir archivo target (canción a masterizar)
   - Seleccionar preset o subir referencia custom
   - Click en "Master My Track"
   - Esperar procesamiento
   - Descargar resultado

---

## 🔍 Verificación de Acceso Premium

### **Cómo Verificar que el Admin tiene Acceso:**

1. **En la interfaz:**
   - Debe ver la pestaña "AI Mastering" sin bloqueos
   - Debe ver badge "✨ Premium" en AI Mastering
   - Debe ver botones "+" para subir referencias (solo admins)

2. **En la consola del navegador (F12):**
   ```javascript
   // Verificar estado de suscripción
   // Debería mostrar: isPremium: true, isAdmin: true
   ```

3. **Emails con acceso premium:**
   - ✅ `davidv111111@gmail.com`
   - ✅ `santiagov.t068@gmail.com`

---

## 🆘 Solución de Problemas

### **Problema: "UI viejo" en localhost**

**Solución:**
```powershell
cd sonic-refine-suite
npm run build
npm run dev
```

### **Problema: "Acceso premium bloqueado"**

**Solución:**
1. Verificar que estás usando el email correcto
2. Cerrar sesión y volver a iniciar
3. Limpiar caché del navegador (Ctrl+Shift+Delete)
4. Verificar que las variables de entorno están configuradas

### **Problema: "Error de URL" en la otra URL**

**Solución:**
1. Verificar que la URL es correcta
2. Verificar que el backend está corriendo (si es localhost)
3. Verificar variables de entorno de Supabase
4. Usar la URL de Lovable en su lugar

### **Problema: "No puedo masterizar"**

**Solución:**
1. Verificar que el backend está funcionando:
   ```
   https://mastering-backend-azkp62xtaq-uc.a.run.app/health
   ```
2. Verificar que tiene acceso premium
3. Verificar conexión a internet
4. Revisar consola del navegador para errores

---

## 📞 Contacto y Soporte

Si el otro admin tiene problemas:

1. **Verificar URL:** Asegúrate de que está usando la URL correcta
2. **Verificar email:** Debe usar `santiagov.t068@gmail.com`
3. **Verificar backend:** El backend debe estar funcionando
4. **Revisar logs:** Consola del navegador (F12) para ver errores

---

## ✅ Resumen Rápido

**Para el otro admin (santiagov.t068@gmail.com):**

1. **Abrir:** `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
2. **Iniciar sesión** con su email
3. **Verificar** que ve acceso premium
4. **Masterizar** audio desde la pestaña "AI Mastering"

**No necesita:**
- ❌ Instalar nada
- ❌ Configurar variables de entorno
- ❌ Tener acceso a tu computadora
- ❌ Esperar a que tu computadora esté encendida

**Solo necesita:**
- ✅ Conexión a internet
- ✅ Navegador moderno (Chrome, Edge, Firefox)
- ✅ Su email de admin: `santiagov.t068@gmail.com`





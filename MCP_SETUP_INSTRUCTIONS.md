# 🔧 Instrucciones de Configuración MCP para Cursor

## ✅ Pasos Completados

1. ✅ **Configuración MCP agregada** en `C:\Users\david\AppData\Roaming\Cursor\User\settings.json`
2. ✅ **Servidores MCP configurados:**
   - `filesystem`: Acceso a archivos del proyecto
   - `google-cloud`: Acceso a Google Cloud Platform
   - `supabase`: Acceso a base de datos Supabase

## 📝 Pasos Pendientes

### 1. Obtener SERVICE_KEY de Supabase

La configuración de MCP tiene un placeholder `REPLACE_WITH_YOUR_SERVICE_KEY` que necesitas reemplazar:

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `lyymcpiujrnlwsbyrseh`
3. Ve a **Settings** → **API**
4. Busca la sección **Project API keys**
5. Copia la **`service_role` key** (⚠️ NO uses la `anon` key, usa la `service_role`)
6. Abre el archivo: `C:\Users\david\AppData\Roaming\Cursor\User\settings.json`
7. Reemplaza `REPLACE_WITH_YOUR_SERVICE_KEY` con tu service_role key

**Ejemplo:**
```json
"SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Reiniciar Cursor

1. **Cierra completamente Cursor:**
   - Cierra todas las ventanas
   - Verifica en el Administrador de Tareas que no haya procesos de Cursor corriendo

2. **Vuelve a abrir Cursor**

3. **Verifica que MCP esté funcionando:**
   - Deberías ver iconos de MCP en la barra lateral
   - Si hay errores, revisa la consola de Cursor (View → Output → MCP)

## 🔍 Verificación de MCP

### Verificar que los servidores MCP estén corriendo:

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Busca "MCP" o "Model Context Protocol"
3. Deberías ver opciones relacionadas con MCP

### Si hay errores:

1. **Error de npx:** Asegúrate de tener Node.js instalado
   ```powershell
   node --version
   npm --version
   ```

2. **Error de credenciales de Google Cloud:**
   - Verifica que el archivo existe: `C:\Users\david\Proyecto\credenciales\total-acumen-473702-j1-c638565cae0d.json`
   - Verifica que el archivo tenga el formato JSON correcto

3. **Error de Supabase:**
   - Verifica que hayas reemplazado `REPLACE_WITH_YOUR_SERVICE_KEY` con tu service_role key real
   - Verifica que la URL sea correcta: `https://lyymcpiujrnlwsbyrseh.supabase.co`

## 📋 Configuración Actual

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\david\\Proyecto"],
      "description": "Access to Level project files"
    },
    "google-cloud": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-cloud"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\david\\Proyecto\\credenciales\\total-acumen-473702-j1-c638565cae0d.json",
        "GOOGLE_CLOUD_PROJECT": "total-acumen-473702-j1"
      },
      "description": "Google Cloud Platform access"
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://lyymcpiujrnlwsbyrseh.supabase.co",
        "SUPABASE_SERVICE_KEY": "REPLACE_WITH_YOUR_SERVICE_KEY"
      },
      "description": "Supabase database access"
    }
  }
}
```

## 🚀 Próximos Pasos

Una vez que hayas:
1. ✅ Reemplazado la SERVICE_KEY de Supabase
2. ✅ Reiniciado Cursor
3. ✅ Verificado que MCP esté funcionando

Podrás usar MCP para:
- Acceder a archivos del proyecto desde Cursor
- Interactuar con Google Cloud Platform
- Consultar y modificar la base de datos de Supabase

---

**Nota:** Los servidores MCP se instalan automáticamente con `npx` cuando Cursor los necesita por primera vez. No necesitas instalarlos manualmente.








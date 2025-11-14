# 🔧 Eliminar Credencial de GitHub Manualmente

## ⚠️ IMPORTANTE: Acción Requerida

Git está usando una credencial cacheada de "MarlonRepos" que está bloqueando el push. Necesitas eliminarla manualmente.

## 📋 Pasos para Eliminar la Credencial

### Opción 1: Panel de Control de Credenciales (Recomendado)

1. **Presiona `Win + R`** (tecla Windows + R)

2. **Escribe exactamente esto:**
   ```
   control /name Microsoft.CredentialManager
   ```

3. **Presiona Enter**

4. **Haz clic en "Credenciales de Windows"** (si no está seleccionado)

5. **Busca esta credencial:**
   - Nombre: `GitHub - https://api.github.com/MarlonRepos`
   - Usuario: `MarlonRepos`

6. **Haz clic en la flecha hacia abajo** para expandir

7. **Haz clic en "Eliminar"**

8. **Confirma la eliminación**

### Opción 2: Administrador de Credenciales (Alternativa)

1. **Presiona `Win + R`**

2. **Escribe:**
   ```
   rundll32.exe keymgr.dll,KRShowKeyMgr
   ```

3. **Presiona Enter**

4. **Busca y elimina la credencial de MarlonRepos**

## ✅ Después de Eliminar

Una vez eliminada la credencial, ejecuta:

```powershell
cd C:\Users\david\sonic-refine-suite-project\sonic-refine-suite
git push origin main
```

O ejecuta el script:

```powershell
.\force-push.ps1
```

## 🔍 Verificar que se Eliminó

Para verificar que la credencial fue eliminada:

```powershell
cmdkey /list | Select-String -Pattern "MarlonRepos"
```

Si no aparece nada, la credencial fue eliminada correctamente.

---

**Nota:** El Panel de Control debería haberse abierto automáticamente. Si no se abrió, usa la Opción 1 manualmente.


# Scripts utilitarios

## generar-prompt-sesion.ps1

Genera un prompt de handoff de sesión leyendo el git log reciente. Usar al cerrar
una sesión de Claude Code para poder continuar en otra máquina o después.

### Uso básico

Desde la raíz del repo, en PowerShell:

```powershell
.\scripts\generar-prompt-sesion.ps1 -Tema "diego-web"
```

Genera `C:\...\7_backup-prompts\sesiones\2026-04-20_diego-web.md` con todo el
contexto git del último día.

### Parámetros

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `-Tema`   | Nombre corto de la sesión (obligatorio) | — |
| `-Desde`  | Rango temporal | `"1 day ago"` |
| `-Salida` | Carpeta destino | `7_backup-prompts\sesiones\` |
| `-Notas`  | Notas libres en sección "Contexto manual" | vacío |

### Ejemplos

```powershell
# Sesión de hoy (default 1 day ago)
.\scripts\generar-prompt-sesion.ps1 -Tema "diego-web"

# Última semana con notas
.\scripts\generar-prompt-sesion.ps1 -Tema "panel-v95" -Desde "1 week ago" -Notas "Pendiente: revisar margenes Talca"

# Desde una fecha específica
.\scripts\generar-prompt-sesion.ps1 -Tema "refactor-asistente" -Desde "2026-04-15"
```

### Si PowerShell bloquea el script

La primera vez, habilitar ejecución solo para el usuario:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Qué incluye el archivo generado

- Identidad y contexto fijos (Dusan/CLAU, Reciclean-Farex)
- Rama, commit actual, rango analizado
- Lista de commits en el rango
- Lista de archivos modificados (únicos)
- Working tree (`git status --short`)
- Sección "Contexto manual" para agregar narrativa que git no captura
- Preferencias de respuesta
- Instrucciones para continuar en nueva sesión

### Qué NO incluye (agregar a mano)

- Decisiones tomadas en conversación (no están en commits)
- Opciones rechazadas y por qué
- Próximos pasos planeados pero no ejecutados
- Contexto del negocio específico de la sesión

Por eso la sección "Contexto manual" existe: revísala antes de usar el prompt.

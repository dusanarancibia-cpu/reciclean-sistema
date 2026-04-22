#Requires -Version 5.0
<#
.SYNOPSIS
  Genera prompt de handoff de sesion a partir del git log reciente.

.DESCRIPTION
  Lee los commits recientes, archivos modificados y estado git, y los inyecta
  en un template de handoff para continuar sesiones de Claude Code entre
  equipos/maquinas. Salida: archivo .md listo para copiar como primer mensaje
  en nueva sesion de Claude Code.

.PARAMETER Tema
  Nombre corto de la sesion (ej: diego-web, panel-v94, fix-login). Se usa en
  el nombre del archivo.

.PARAMETER Desde
  Rango temporal de commits a incluir. Default: "1 day ago".
  Ejemplos: "2 days ago", "1 week ago", "2026-04-20", "HEAD~5"

.PARAMETER Salida
  Carpeta de salida. Default: C:\...\7_backup-prompts\sesiones\

.PARAMETER Notas
  Notas libres extra a incluir en la seccion "Contexto manual".

.EXAMPLE
  .\generar-prompt-sesion.ps1 -Tema "diego-web"

.EXAMPLE
  .\generar-prompt-sesion.ps1 -Tema "panel-v95" -Desde "3 days ago" -Notas "Fix bug margen Cerrillos"
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Tema,

  [string]$Desde = "1 day ago",

  [string]$Salida = "$env:USERPROFILE\Documents\OneDrive - RECICLADORA RECICLEAN SPA\AA EMPRESAS\Reciclean-Farex Sistema\7_backup-prompts\sesiones",

  [string]$Notas = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path .git)) {
  Write-Error "Este script debe ejecutarse desde la raiz del repo git."
  exit 1
}

if (-not (Test-Path $Salida)) {
  New-Item -ItemType Directory -Path $Salida -Force | Out-Null
}

$fecha = Get-Date -Format "yyyy-MM-dd"
$hora = Get-Date -Format "HH:mm"
$nombreArchivo = "${fecha}_${Tema}.md"
$rutaCompleta = Join-Path $Salida $nombreArchivo

$rama = (git branch --show-current).Trim()
$commitActual = (git rev-parse --short HEAD).Trim()
$commits = git log --since="$Desde" --pretty=format:"  * %h  %s" --no-merges
if (-not $commits) { $commits = "  (sin commits en el rango)" }

$archivosModificados = git log --since="$Desde" --name-only --pretty=format:"" --no-merges |
  Where-Object { $_ -and $_.Trim() } |
  Sort-Object -Unique |
  ForEach-Object { "  * $_" }
if (-not $archivosModificados) { $archivosModificados = "  (ningun archivo modificado)" }

$workingTree = git status --short
if (-not $workingTree) { $workingTree = "  (limpio)" } else { $workingTree = $workingTree | ForEach-Object { "  $_" } }

$remoto = (git remote get-url origin 2>$null).Trim()
if (-not $remoto) { $remoto = "(sin remoto)" }

$template = @"
================================================================================
PROMPT PARA CLAUDE CODE - PROYECTO RECICLEAN-FAREX
Sesion: $fecha $hora - $Tema
Generado automaticamente con scripts/generar-prompt-sesion.ps1
================================================================================

IDENTIDAD Y CONTEXTO
--------------------------------------------------------------------------------

Tu eres CLAU. Yo soy DUSAN (Gerente General, Grupo Reciclean-Farex).
Idioma: ESPANOL unicamente.
Tono: Directo, ejecutivo, sin preambulos. Respuestas cortas con codigos A/B/C/Z.

GRUPO RECICLEAN-FAREX
- 4 sucursales: Cerrillos, Maipu, Talca, Puerto Montt (PM no operativa)
- Dos razones sociales: RECICLEAN (VAT-exempt) + FAREX (19% IVA)
- Repo: $remoto (publico)
- Deploy: Vercel auto desde main -> reciclean-sistema.vercel.app

ESTADO GIT AL MOMENTO DEL HANDOFF
--------------------------------------------------------------------------------

Rama actual:     $rama
Commit actual:   $commitActual
Rango analizado: $Desde hasta ahora

COMMITS EN EL RANGO
$commits

ARCHIVOS MODIFICADOS EN EL RANGO
$($archivosModificados -join "`n")

WORKING TREE (git status)
$($workingTree -join "`n")

CONTEXTO MANUAL (NOTAS DE DUSAN)
--------------------------------------------------------------------------------

$(if ($Notas) { $Notas } else { "(sin notas manuales - agregar aqui si se necesita)" })

PREFERENCIAS DE RESPUESTA
--------------------------------------------------------------------------------

OK Respuestas CORTAS y directas
OK Codigos/opciones (A, B, C, Z) para elecciones
OK Slot Z - Abierto al final para ideas nuevas
OK Trade-offs y costo-beneficio explicitos
OK Proximos pasos concretos
OK Una mejora operacional sugerida por conversacion
NO Largas explicaciones, preambulos, repeticiones

COMO CONTINUAR
--------------------------------------------------------------------------------

1. Este prompt resume automaticamente el git log. Si falta contexto narrativo
   (decisiones tomadas, conversaciones previas), agregalo a mano en la seccion
   "CONTEXTO MANUAL" antes de usar.

2. En Claude Code, pega este archivo completo como primer mensaje.

3. Al final agregar la tarea concreta:
   "Continua. Siguiente tarea: [X]"

================================================================================
FIN DEL PROMPT GENERADO - $fecha $hora
================================================================================
"@

$template | Out-File -FilePath $rutaCompleta -Encoding UTF8

Write-Host ""
Write-Host "Archivo generado:" -ForegroundColor Green
Write-Host "  $rutaCompleta"
Write-Host ""
Write-Host "Estadisticas:" -ForegroundColor Cyan
Write-Host "  Rama:    $rama"
Write-Host "  Desde:   $Desde"
Write-Host "  Commits: $((git log --since=$Desde --oneline --no-merges | Measure-Object -Line).Lines)"
Write-Host ""
Write-Host "Abre el archivo, revisa la seccion 'CONTEXTO MANUAL', y copia todo el" -ForegroundColor Yellow
Write-Host "contenido como primer mensaje en la nueva sesion de Claude Code." -ForegroundColor Yellow
Write-Host ""

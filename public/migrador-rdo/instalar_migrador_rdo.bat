@echo off
REM ============================================================
REM  INSTALADOR MIGRADOR-RDO - Grupo Reciclean-Farex
REM  Para Pablo Arancibia - ejecutar con DOBLE CLICK
REM  Version 1.0 - 09-may-2026
REM ============================================================

setlocal
cd /d "%~dp0"
title MIGRADOR-RDO Instalador

echo.
echo ============================================================
echo   MIGRADOR-RDO - Instalador Automatico
echo   Grupo Reciclean-Farex
echo ============================================================
echo.
echo Este instalador hara lo siguiente:
echo   1. Verificar Python y librerias necesarias
echo   2. Pedirte 3 claves privadas (una sola vez)
echo   3. Crear carpeta de trabajo
echo   4. Probar conexion a Supabase y GitHub
echo.
pause

REM --- Paso 1: Verificar Python ---
echo.
echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Python no esta instalado.
    echo Te abro la pagina de descarga. Instala Python 3.11 o superior.
    echo IMPORTANTE: marca la casilla "Add Python to PATH" al instalar.
    start https://www.python.org/downloads/
    pause
    exit /b 1
)
echo Python OK.

REM --- Paso 2: Instalar librerias ---
echo.
echo [2/4] Instalando librerias necesarias...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet openpyxl supabase python-dotenv requests
if errorlevel 1 (
    echo.
    echo Error instalando librerias. Revisa tu conexion a internet.
    pause
    exit /b 1
)
echo Librerias OK.

REM --- Paso 3: Pedir las 3 claves ---
echo.
echo [3/4] Configurando claves privadas (solo una vez)
echo.
echo Estas claves quedan SOLO en tu computador, nadie mas las ve.
echo.

set /p SUPABASE_URL="Pega aqui SUPABASE_URL (ej: https://xxxxx.supabase.co): "
set /p SUPABASE_KEY="Pega aqui SUPABASE_SERVICE_ROLE_KEY (la larga): "
set /p GITHUB_TOKEN="Pega aqui GITHUB_PERSONAL_ACCESS_TOKEN: "

REM --- Crear carpeta de trabajo ---
if not exist "%USERPROFILE%\migrador-rdo" mkdir "%USERPROFILE%\migrador-rdo"
cd /d "%USERPROFILE%\migrador-rdo"

REM --- Guardar .env ---
(
    echo SUPABASE_URL=%SUPABASE_URL%
    echo SUPABASE_KEY=%SUPABASE_KEY%
    echo GITHUB_TOKEN=%GITHUB_TOKEN%
    echo PROJECT_ID=eknmtsrtfkzroxnovfqn
    echo REPO_PRIVADO=dusanarancibia-cpu/reciclean-manifiesto-diego
    echo REPO_SISTEMA=dusanarancibia-cpu/reciclean-sistema
) > .env
echo Configuracion guardada en %USERPROFILE%\migrador-rdo\.env

REM --- Paso 4: Probar conexiones ---
echo.
echo [4/4] Probando conexiones...

python -c "import os; from dotenv import load_dotenv; from supabase import create_client; load_dotenv(); c = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY')); r = c.table('panel_usuarios_autorizados').select('*').limit(1).execute(); print('Supabase OK' if r else 'Supabase FAIL')" 2>nul
if errorlevel 1 echo Aviso: Supabase no respondio. Revisa la URL y la KEY.

python -c "import os; import requests; from dotenv import load_dotenv; load_dotenv(); r = requests.get('https://api.github.com/user', headers={'Authorization': 'Bearer ' + os.getenv('GITHUB_TOKEN')}); print('GitHub OK' if r.status_code == 200 else 'GitHub FAIL: ' + str(r.status_code))" 2>nul

REM --- Crear shortcut en escritorio ---
echo.
echo Creando acceso directo en el escritorio...

set "DESKTOP=%USERPROFILE%\Desktop"
(
    echo @echo off
    echo cd /d "%USERPROFILE%\migrador-rdo"
    echo title MIGRADOR-RDO
    echo echo MIGRADOR-RDO listo. Carpeta: %USERPROFILE%\migrador-rdo
    echo echo.
    echo echo Comandos disponibles:
    echo echo   python migrar.py [caja-N]   - migra una caja
    echo echo   python estado.py            - ve estado actual
    echo echo   python reporte.py           - genera reporte
    echo echo.
    echo cmd /k
) > "%DESKTOP%\MIGRADOR-RDO.bat"

echo.
echo ============================================================
echo  INSTALACION COMPLETADA
echo ============================================================
echo.
echo Carpeta de trabajo: %USERPROFILE%\migrador-rdo
echo Acceso directo: Escritorio\MIGRADOR-RDO.bat
echo.
echo PROXIMO PASO:
echo  1. Avisa a Dusan que terminaste la instalacion
echo  2. Espera el agente MIGRADOR-RDO en platform.claude.com
echo  3. Ese agente te ira diciendo que ejecutar
echo.
pause
endlocal

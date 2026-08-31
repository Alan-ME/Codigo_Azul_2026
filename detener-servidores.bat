@echo off
title Sistema Codigo Azul - Detener Servidores
cd /d "%~dp0"
echo ============================================================
echo   DETENIENDO SERVICIOS DE CODIGO AZUL
echo ============================================================

REM 1. Ejecutar script Node.js de liberación
call node scripts/stop-all.js 2>nul

REM 2. Respaldo directo en Windows: liberar puertos 3000, 5173 y 4173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4173" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>&1
)

echo.
echo ============================================================
echo   SERVIDORES Y PUERTOS LIBERADOS CON EXITO
echo ============================================================
echo.
timeout /t 2 >nul

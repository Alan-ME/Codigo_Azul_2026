@echo off
title Sistema Codigo Azul - Detener Servidores
cd /d "%~dp0"
echo ============================================================
echo   DETENIENDO SERVICIOS DE CODIGO AZUL
echo ============================================================
node scripts/stop-all.js
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul

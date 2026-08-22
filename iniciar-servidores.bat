@echo off
title Sistema Codigo Azul - Servidor Principal
cd /d "%~dp0"
echo ============================================================
echo   INICIANDO CODIGO AZUL (POSTGRESQL + BACKEND + FRONTEND)
echo ============================================================
node scripts/start-all.js
pause

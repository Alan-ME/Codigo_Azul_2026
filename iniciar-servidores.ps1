# Iniciar Sistema Código Azul
Set-Location -Path $PSScriptRoot
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO SISTEMA CODIGO AZUL (POSTGRES + NODE + WEB)    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
node scripts/start-all.js

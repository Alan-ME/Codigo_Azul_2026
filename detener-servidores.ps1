# Detener Sistema Código Azul
Set-Location -Path $PSScriptRoot
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  DETENIENDO SERVICIOS DE CODIGO AZUL                      " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
node scripts/stop-all.js

# Detener Sistema Código Azul
Set-Location -Path $PSScriptRoot
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  DETENIENDO SERVICIOS DE CODIGO AZUL                      " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

# 1. Ejecutar script stop-all.js
try {
    node scripts/stop-all.js
} catch {
    Write-Host "Ejecutando limpieza directa por puertos..." -ForegroundColor Gray
}

# 2. Respaldo PowerShell para puertos 3000, 5173, 4173
$puertos = @(3000, 5173, 4173)
foreach ($p in $puertos) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                $pidProc = $c.OwningProcess
                if ($pidProc -and $pidProc -ne 0 -and $pidProc -ne $PID) {
                    Write-Host "Deteniendo proceso en puerto $p (PID $pidProc)..." -ForegroundColor Cyan
                    Stop-Process -Id $pidProc -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SERVIDORES DETENIDOS SATISFACTORIAMENTE                   " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

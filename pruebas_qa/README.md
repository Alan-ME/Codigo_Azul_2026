# Suite de auditoría QA — Plan de Pruebas y Calidad

Scripts en **Python 3.10+** que auditan cada afirmación del PDF
`Plan_de_Pruebas_y_Calidad_Test_Plan_APA.pdf` contra el backend real,
la base PostgreSQL y el gateway Socket.IO.

Elegí Python (no JavaScript) porque:
- Es agnóstico del stack del proyecto — un fallo del backend no puede enmascarar un fallo del harness.
- Tiene clientes robustos out-of-the-box para HTTP (`requests`), Socket.IO (`python-socketio`) y PostgreSQL (`psycopg2`).
- Corre nativo en Windows sin depender de bash/POSIX.

## Estructura

| Archivo | Cubre |
|---|---|
| [common.py](common.py) | Config, helpers (`Suite`, `Resultado`, `login`, `bearer`, `cronometrar`). |
| [test_funcionales.py](test_funcionales.py) | Tabla 1 — TC-FUN-001 a TC-FUN-008. |
| [test_latencia.py](test_latencia.py) | Tabla 2 — TC-PERF-001 a TC-PERF-004. |
| [test_defectos.py](test_defectos.py) | Tabla 3 — BUG-001 a BUG-004 (regresión). |
| [run_all.py](run_all.py) | Orquestador con veredicto global. |
| [requirements.txt](requirements.txt) | Dependencias pip. |

## Requisitos

1. Backend arriba (`iniciar-servidores.bat`).
2. PostgreSQL 18 con la base `codigo_azul_db` sembrada.
3. Dependencias Python:
   ```bash
   pip install -r requirements.txt
   ```

## Uso

Correr toda la auditoría:
```bash
python run_all.py
```

Correr una suite individual:
```bash
python test_funcionales.py
python test_latencia.py
python test_defectos.py
```

## Configuración por entorno (opcional)

| Variable | Default |
|---|---|
| `QA_BASE_URL`       | `http://localhost:3000` |
| `QA_DB_DSN`         | `host=localhost port=5432 dbname=codigo_azul_db user=postgres password=admin` |
| `QA_UBICACION_ID`   | `1` |

## Salida

Cada test loguea `[OK] TC-XXX-YYY — descripción (medición)` o
`[FAIL] TC-XXX-YYY — descripción` con el detalle del problema.
Al final imprime `RESULTADO SUITE ...: N/M` y `run_all.py` produce el
veredicto global por tabla.

## Notas de honestidad técnica

- **TC-PERF-002 (FCM 100 dispositivos)**: no medimos entrega real en 100 Android físicos.
  El script verifica la latencia end-to-end del servidor (proxy medible desde una sola máquina)
  y que el gateway despacha el evento de dominio hacia FCM. Para 100 devices reales el PDF
  cita Artillery + Firebase — eso queda fuera del alcance de la máquina local.
- **TC-PERF-003 (200 clientes)**: 200 sockets desde el mismo host es un stress bajo.
  Para validar carga hospitalaria real hay que distribuir clientes en varios workers.

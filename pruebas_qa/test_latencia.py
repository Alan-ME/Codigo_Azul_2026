"""
Auditoría de latencia y concurrencia — Tabla 2 del PDF (TC-PERF-001 a TC-PERF-004).

Notas de honestidad técnica:
  · TC-PERF-002 (FCM 100 dispositivos): la infra de push real necesita
    dispositivos Android físicos. Este script verifica que el gateway
    despacha el evento de dominio y mide la latencia end-to-end del
    servidor, que es el proxy medible desde una máquina sola.
  · TC-PERF-003 (200 clientes): abrir 200 sockets desde una sola PC es
    un stress mínimo; para carga real usar Artillery como indica el PDF.
"""
from __future__ import annotations

import statistics
import threading
import time

import requests
import socketio

from common import (
    API, BASE_URL, TIMEOUT_S, UBICACION_DEMO,
    Resultado, Suite,
    bearer, imprimir_encabezado, limpiar_estado_qa, login, salir_si_backend_caido,
)


CRED_MEDICO  = ("medico.activador@hospital.gob.ar", "Password123!")
CRED_REANIM  = ("reanimador1@hospital.gob.ar",      "Password123!")
CRED_GUARDIA = ("guardia@hospital.gob.ar",          "Password123!")


def conectar_sockets(cantidad: int, token: str) -> list[socketio.Client]:
    """Abre `cantidad` clientes Socket.IO autenticados."""
    clientes: list[socketio.Client] = []
    for _ in range(cantidad):
        c = socketio.Client(reconnection=False, logger=False, engineio_logger=False)
        c.connect(BASE_URL, auth={"token": token}, wait_timeout=5)
        clientes.append(c)
    return clientes


def cerrar_sockets(clientes: list[socketio.Client]) -> None:
    for c in clientes:
        try:
            c.disconnect()
        except Exception:
            pass


def tc_perf_001_latencia_ws(suite: Suite) -> None:
    """TC-PERF-001 — 50 sockets conectados, latencia disparo → recepción broadcast < 500ms."""
    tok_g, _ = login(*CRED_GUARDIA)
    tok_m, _ = login(*CRED_MEDICO)

    clientes = []
    try:
        clientes = conectar_sockets(50, tok_g)
        tiempos_ms: list[float] = []
        recibidos = threading.Event()
        lock = threading.Lock()

        def handler(payload):
            with lock:
                tiempos_ms.append((time.perf_counter() - t0) * 1000)
                if len(tiempos_ms) >= 50:
                    recibidos.set()

        for c in clientes:
            c.on("codigo_azul_alerta", handler)

        t0 = time.perf_counter()
        r = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(tok_m),
            json={"ubicacionId": UBICACION_DEMO + 4},
            timeout=TIMEOUT_S,
        )
        recibidos.wait(timeout=3.0)

        if not tiempos_ms:
            suite.registrar(Resultado("TC-PERF-001", "Latencia broadcast WS (50 sockets)",
                                       False, detalle="Ningún socket recibió el evento."))
            return

        p50 = statistics.median(tiempos_ms)
        pmax = max(tiempos_ms)
        exito = pmax < 500 and r.status_code in (200, 201)
        suite.registrar(Resultado(
            "TC-PERF-001", "Latencia broadcast WS (50 sockets) < 500ms", exito,
            detalle=f"recibieron {len(tiempos_ms)}/50 · p50={p50:.1f}ms · max={pmax:.1f}ms",
            medicion=f"p50={p50:.1f}ms · max={pmax:.1f}ms",
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-PERF-001", "Latencia broadcast WS", False, detalle=str(e)))
    finally:
        cerrar_sockets(clientes)


def tc_perf_002_latencia_fcm(suite: Suite) -> None:
    """
    TC-PERF-002 — Verifica que el despacho FCM se dispara (latencia end-to-end de
    servidor + cola FCM). No mide dispositivos reales.
    """
    try:
        tok_m, _ = login(*CRED_MEDICO)
        tok_r, _ = login(*CRED_REANIM)

        # Registrar un token dummy para que haya destinatario aunque no sea real.
        import uuid as _uuid
        token_dummy = f"QA-PERF-{_uuid.uuid4()}"
        requests.post(f"{API}/fcm/token", headers=bearer(tok_r),
                       json={"token": token_dummy, "plataforma": "ANDROID"}, timeout=TIMEOUT_S)

        t0 = time.perf_counter()
        r = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(tok_m),
            json={"ubicacionId": UBICACION_DEMO + 5},
            timeout=TIMEOUT_S,
        )
        latencia_ms = (time.perf_counter() - t0) * 1000

        exito = r.status_code in (200, 201) and latencia_ms < 2000
        suite.registrar(Resultado(
            "TC-PERF-002", "Latencia despacho backend (proxy FCM) < 2.000ms", exito,
            detalle=f"HTTP {r.status_code} · disparo->respuesta={latencia_ms:.0f}ms "
                    "(no incluye entrega en dispositivo físico)",
            medicion=f"{latencia_ms:.0f}ms",
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-PERF-002", "Latencia FCM (proxy)", False, detalle=str(e)))


def tc_perf_003_concurrencia(suite: Suite) -> None:
    """TC-PERF-003 — 200 clientes concurrentes conectan sin pérdida."""
    tok, _ = login(*CRED_GUARDIA)
    clientes = []
    fallos = 0
    try:
        for _ in range(200):
            try:
                c = socketio.Client(reconnection=False, logger=False, engineio_logger=False)
                c.connect(BASE_URL, auth={"token": tok}, wait_timeout=5)
                clientes.append(c)
            except Exception:
                fallos += 1
        conectados = sum(1 for c in clientes if c.connected)
        perdida_pct = ((200 - conectados) / 200) * 100
        exito = perdida_pct == 0
        suite.registrar(Resultado(
            "TC-PERF-003", "Concurrencia 200 clientes · 0% pérdida", exito,
            detalle=f"conectados={conectados}/200 · fallos_conexion={fallos}",
            medicion=f"pérdida={perdida_pct:.1f}%",
        ))
    finally:
        cerrar_sockets(clientes)


def tc_perf_004_latencia_ack(suite: Suite) -> None:
    """TC-PERF-004 — Latencia del endpoint PUT /:id/ack < 1.500ms."""
    try:
        tok_m, _ = login(*CRED_MEDICO)
        tok_r, _ = login(*CRED_REANIM)

        r = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(tok_m),
            json={"ubicacionId": UBICACION_DEMO + 6},
            timeout=TIMEOUT_S,
        )
        inc = r.json()["data"]
        inc_id = inc.get("incidenteId") or inc.get("id")

        t0 = time.perf_counter()
        r_ack = requests.put(f"{API}/incidentes/{inc_id}/ack", headers=bearer(tok_r), timeout=TIMEOUT_S)
        latencia_ms = (time.perf_counter() - t0) * 1000

        exito = r_ack.status_code == 200 and latencia_ms < 1500
        suite.registrar(Resultado(
            "TC-PERF-004", "Latencia registro ACK < 1.500ms", exito,
            detalle=f"HTTP {r_ack.status_code} · latencia={latencia_ms:.0f}ms",
            medicion=f"{latencia_ms:.0f}ms",
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-PERF-004", "Latencia ACK", False, detalle=str(e)))


def main() -> int:
    imprimir_encabezado("Auditoría de Latencia — Tabla 2 del PDF (TC-PERF-001 a TC-PERF-004)")
    salir_si_backend_caido()
    limpiar_estado_qa()

    suite = Suite("latencia")
    tc_perf_001_latencia_ws(suite)
    tc_perf_002_latencia_fcm(suite)
    tc_perf_003_concurrencia(suite)
    tc_perf_004_latencia_ack(suite)

    ok, total = suite.resumen()
    print(f"\nRESULTADO SUITE LATENCIA: {ok}/{total}")
    return 0 if ok == total else 1


if __name__ == "__main__":
    raise SystemExit(main())

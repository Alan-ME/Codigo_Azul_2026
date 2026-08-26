"""
Auditoría funcional — Tabla 1 del PDF (TC-FUN-001 a TC-FUN-008).

Valida cada afirmación del Plan de Pruebas contra el backend real,
la base PostgreSQL y el gateway Socket.IO.
"""
from __future__ import annotations

import threading
import time
import uuid

import psycopg2
import requests
import socketio

from common import (
    API, DB_DSN, TIMEOUT_S, UBICACION_DEMO,
    Resultado, Suite,
    bearer, imprimir_encabezado, limpiar_estado_qa, login, salir_si_backend_caido,
)


CRED_MEDICO   = ("medico.activador@hospital.gob.ar", "Password123!")
CRED_REANIM   = ("reanimador1@hospital.gob.ar",      "Password123!")
CRED_GUARDIA  = ("guardia@hospital.gob.ar",          "Password123!")


def tc_fun_001_login_jwt(suite: Suite) -> str | None:
    """TC-FUN-001 — POST /auth/login devuelve JWT con claim de rol."""
    try:
        token, user = login(*CRED_MEDICO)
        exito = (
            isinstance(token, str) and token.count(".") == 2
            and user.get("rol") == "MEDICO_ACTIVADOR"
        )
        suite.registrar(Resultado(
            "TC-FUN-001", "Login JWT con claim de rol",
            exito, detalle=f"rol={user.get('rol')} · token[:20]={token[:20]}…"
        ))
        return token if exito else None
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-001", "Login JWT con claim de rol", False, detalle=str(e)))
        return None


def tc_fun_002_disparar(suite: Suite, token: str) -> tuple[int, str] | tuple[None, None]:
    """TC-FUN-002 — POST /incidentes/activar devuelve HTTP 201, UUID v4 y estado ACTIVADO."""
    try:
        r = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(token),
            json={"ubicacionId": UBICACION_DEMO},
            timeout=TIMEOUT_S,
        )
        data = r.json().get("data", {})
        codigo = data.get("codigoUUID") or data.get("codigo_uuid") or ""
        try:
            uuid_valido = uuid.UUID(codigo).version == 4
        except Exception:
            uuid_valido = False
        exito = (
            r.status_code in (200, 201)
            and data.get("estado") == "ACTIVADO"
            and uuid_valido
        )
        suite.registrar(Resultado(
            "TC-FUN-002", "Disparo de Código Azul (201 + UUID v4)",
            exito, detalle=f"HTTP {r.status_code} · estado={data.get('estado')} · uuid={codigo}"
        ))
        return (data.get("incidenteId") or data.get("id")), codigo if exito else (None, None)
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-002", "Disparo de Código Azul", False, detalle=str(e)))
        return None, None


def tc_fun_003_ack(suite: Suite, incidente_id: int) -> None:
    """TC-FUN-003 — PUT /incidentes/:id/ack → HTTP 200, estado EN_ATENCION, latencia calculada."""
    try:
        tok, _ = login(*CRED_REANIM)
        r = requests.put(f"{API}/incidentes/{incidente_id}/ack", headers=bearer(tok), timeout=TIMEOUT_S)
        data = r.json().get("data", {})
        latencia = data.get("latenciaRespuestaSegundos") or data.get("latenciaSegundos")
        exito = (r.status_code == 200 and data.get("estado") == "EN_ATENCION" and latencia is not None)
        suite.registrar(Resultado(
            "TC-FUN-003", "ACK Reanimador (EN_ATENCION + latencia)",
            exito, detalle=f"HTTP {r.status_code} · estado={data.get('estado')} · latencia={latencia}s"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-003", "ACK Reanimador", False, detalle=str(e)))


def tc_fun_004_cancelar(suite: Suite, token_activador: str) -> None:
    """TC-FUN-004 — Nueva alerta + cancelación con motivo → estado CANCELADO + resolvedAt."""
    try:
        r_activar = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(token_activador),
            json={"ubicacionId": UBICACION_DEMO + 1},
            timeout=TIMEOUT_S,
        )
        inc_id = r_activar.json()["data"].get("incidenteId") or r_activar.json()["data"].get("id")

        tok_g, _ = login(*CRED_GUARDIA)
        r = requests.post(
            f"{API}/incidentes/{inc_id}/cancelar",
            headers=bearer(tok_g),
            json={"motivo": "Prueba automatizada QA (TC-FUN-004)"},
            timeout=TIMEOUT_S,
        )
        data = r.json().get("data", {})
        exito = (r.status_code == 200 and data.get("estado") == "CANCELADO" and data.get("resolvedAt"))
        suite.registrar(Resultado(
            "TC-FUN-004", "Cancelación con motivo (CANCELADO + resolvedAt)",
            exito, detalle=f"HTTP {r.status_code} · estado={data.get('estado')} · resolvedAt={data.get('resolvedAt')}"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-004", "Cancelación", False, detalle=str(e)))


def tc_fun_005_idempotencia(suite: Suite, token: str) -> None:
    """TC-FUN-005 — Pulsaciones repetidas <60s en la misma cama devuelven mismo UUID sin duplicar."""
    try:
        payload = {"ubicacionId": UBICACION_DEMO + 2}
        r1 = requests.post(f"{API}/incidentes/activar", headers=bearer(token), json=payload, timeout=TIMEOUT_S)
        r2 = requests.post(f"{API}/incidentes/activar", headers=bearer(token), json=payload, timeout=TIMEOUT_S)
        uuid1 = r1.json()["data"].get("codigoUUID") or r1.json()["data"].get("codigo_uuid")
        uuid2 = r2.json()["data"].get("codigoUUID") or r2.json()["data"].get("codigo_uuid")
        exito = (r1.status_code in (200, 201) and r2.status_code == 200 and uuid1 == uuid2)
        suite.registrar(Resultado(
            "TC-FUN-005", "Barrera de idempotencia 60s por sala",
            exito, detalle=f"HTTP1={r1.status_code} HTTP2={r2.status_code} · uuid_igual={uuid1 == uuid2}"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-005", "Idempotencia 60s", False, detalle=str(e)))


def tc_fun_006_fcm_token(suite: Suite) -> None:
    """TC-FUN-006 — POST /fcm/token registra token en usuarios_dispositivos_fcm."""
    try:
        tok, user = login(*CRED_REANIM)
        token_fcm = f"QA-TEST-{uuid.uuid4()}"
        r = requests.post(
            f"{API}/fcm/token",
            headers=bearer(tok),
            json={"token": token_fcm, "plataforma": "ANDROID"},
            timeout=TIMEOUT_S,
        )
        # Verificar directamente en la BD que el token quedó vinculado.
        with psycopg2.connect(DB_DSN) as cnx, cnx.cursor() as cur:
            cur.execute(
                "SELECT usuario_id, plataforma FROM usuarios_dispositivos_fcm WHERE token_fcm = %s",
                (token_fcm,),
            )
            fila = cur.fetchone()
        exito = (r.status_code == 201 and fila is not None and fila[0] == user["id"])
        suite.registrar(Resultado(
            "TC-FUN-006", "Registro Token FCM en usuarios_dispositivos_fcm",
            exito, detalle=f"HTTP {r.status_code} · fila_bd={fila}"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-006", "Registro Token FCM", False, detalle=str(e)))


def tc_fun_007_broadcast_socket(suite: Suite, token_activador: str) -> None:
    """
    TC-FUN-007 — El despacho de un Código Azul se propaga por Socket.IO
    (proxy verificable del broadcast paralelo hacia FCM).
    """
    try:
        tok_g, _ = login(*CRED_GUARDIA)
        cliente = socketio.Client(reconnection=False)
        recibido: dict[str, object] = {}
        listo = threading.Event()

        @cliente.on("codigo_azul_alerta")
        def _on_alerta(payload):
            recibido["payload"] = payload
            listo.set()

        cliente.connect(API.replace("/api/v1", ""), auth={"token": tok_g}, wait_timeout=5)

        r = requests.post(
            f"{API}/incidentes/activar",
            headers=bearer(token_activador),
            json={"ubicacionId": UBICACION_DEMO + 3},
            timeout=TIMEOUT_S,
        )
        propagado = listo.wait(timeout=3.0)
        cliente.disconnect()

        exito = (r.status_code in (200, 201) and propagado)
        suite.registrar(Resultado(
            "TC-FUN-007", "Broadcast socket 'codigo_azul_alerta' emitido",
            exito, detalle=f"HTTP={r.status_code} · socket_recibido={propagado}"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-007", "Broadcast socket", False, detalle=str(e)))


def tc_fun_008_auditoria_inmutable(suite: Suite) -> None:
    """TC-FUN-008 — El trigger PostgreSQL rechaza UPDATE y DELETE sobre la bitácora."""
    try:
        with psycopg2.connect(DB_DSN) as cnx, cnx.cursor() as cur:
            # Buscar cualquier evento existente para intentar mutarlo.
            cur.execute("SELECT id FROM incidentes_auditoria_eventos ORDER BY id DESC LIMIT 1;")
            fila = cur.fetchone()
            if not fila:
                suite.registrar(Resultado(
                    "TC-FUN-008", "Trigger inmutable de auditoría",
                    False, detalle="No hay eventos de auditoría para probar. Ejecutá primero los TC-FUN-002/003.",
                ))
                return
            evento_id = fila[0]

            update_bloqueado = False
            delete_bloqueado = False
            for sql, flag in (
                ("UPDATE incidentes_auditoria_eventos SET tipo_evento='HACK' WHERE id=%s", "update"),
                ("DELETE FROM incidentes_auditoria_eventos WHERE id=%s", "delete"),
            ):
                try:
                    with cnx.cursor() as c2:
                        c2.execute(sql, (evento_id,))
                    cnx.commit()
                except psycopg2.Error:
                    cnx.rollback()
                    if flag == "update":
                        update_bloqueado = True
                    else:
                        delete_bloqueado = True

        exito = update_bloqueado and delete_bloqueado
        suite.registrar(Resultado(
            "TC-FUN-008", "Auditoría inmutable por trigger PostgreSQL",
            exito, detalle=f"update_bloqueado={update_bloqueado} · delete_bloqueado={delete_bloqueado}"
        ))
    except Exception as e:
        suite.registrar(Resultado("TC-FUN-008", "Auditoría inmutable", False, detalle=str(e)))


def main() -> int:
    imprimir_encabezado("Auditoría Funcional — Tabla 1 del PDF (TC-FUN-001 a TC-FUN-008)")
    salir_si_backend_caido()
    limpiar_estado_qa()

    suite = Suite("funcionales")

    token = tc_fun_001_login_jwt(suite)
    if not token:
        print("[STOP] Sin token — el resto de los tests requieren autenticación.")
        return 1

    incidente_id, _ = tc_fun_002_disparar(suite, token)
    if incidente_id:
        tc_fun_003_ack(suite, incidente_id)

    tc_fun_004_cancelar(suite, token)
    tc_fun_005_idempotencia(suite, token)
    tc_fun_006_fcm_token(suite)
    tc_fun_007_broadcast_socket(suite, token)
    # Pequeña espera para asegurar que el evento del TC-FUN-007 quedó auditado.
    time.sleep(0.5)
    tc_fun_008_auditoria_inmutable(suite)

    ok, total = suite.resumen()
    print(f"\nRESULTADO SUITE FUNCIONAL: {ok}/{total}")
    return 0 if ok == total else 1


if __name__ == "__main__":
    raise SystemExit(main())

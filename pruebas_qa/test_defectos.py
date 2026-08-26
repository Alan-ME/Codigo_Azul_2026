"""
Auditoría de regresión — Tabla 3 del PDF (BUG-001 a BUG-004).

Verifica que cada bug reportado como resuelto NO reaparece en el estado
actual del código y de la base de datos.
"""
from __future__ import annotations

import os

import psycopg2
import requests

from common import (
    API, DB_DSN, TIMEOUT_S, UBICACION_DEMO,
    Resultado, Suite,
    bearer, imprimir_encabezado, limpiar_estado_qa, login, salir_si_backend_caido,
)

RUTA_PROYECTO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def bug_001_heartbeat_socket(suite: Suite) -> None:
    """
    BUG-001 — Desconexión involuntaria de sockets.
    Fix reportado: heartbeat + reconexión JWT.
    Verificación: el cliente móvil re-adjunta el token en `auth: { token }`
    y el gateway lo valida en el handshake.
    """
    try:
        gateway = os.path.join(RUTA_PROYECTO, "src", "core", "sockets", "socket.gateway.js")
        with open(gateway, encoding="utf-8") as f:
            src = f.read()
        exito = ("handshake.auth" in src and "jwt.verify" in src)
        suite.registrar(Resultado(
            "BUG-001", "Reautenticación JWT en handshake Socket.IO",
            exito, detalle=f"handshake.auth={'sí' in src or 'handshake.auth' in src} · jwt.verify={'jwt.verify' in src}"
        ))
    except Exception as e:
        suite.registrar(Resultado("BUG-001", "Reautenticación socket", False, detalle=str(e)))


def bug_002_idempotencia(suite: Suite) -> None:
    """
    BUG-002 — Duplicación de alertas por pulsaciones múltiples.
    Fix reportado: ventana de idempotencia de 60s por sala/cama.
    Verificación: dos POST /activar seguidos en la misma sala devuelven el
    mismo UUID y no crean fila duplicada en `incidentes`.
    """
    try:
        tok, _ = login("medico.activador@hospital.gob.ar", "Password123!")
        payload = {"ubicacionId": UBICACION_DEMO + 7}

        r1 = requests.post(f"{API}/incidentes/activar", headers=bearer(tok), json=payload, timeout=TIMEOUT_S)
        r2 = requests.post(f"{API}/incidentes/activar", headers=bearer(tok), json=payload, timeout=TIMEOUT_S)
        uuid1 = r1.json()["data"].get("codigoUUID") or r1.json()["data"].get("codigo_uuid")
        uuid2 = r2.json()["data"].get("codigoUUID") or r2.json()["data"].get("codigo_uuid")

        # Confirmar en la BD que hay UNA sola fila activa para esa ubicación.
        with psycopg2.connect(DB_DSN) as cnx, cnx.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM incidentes "
                "WHERE ubicacion_id = %s AND estado IN ('ACTIVADO','NOTIFICADO','EN_ATENCION') "
                "  AND created_at >= NOW() - INTERVAL '60 seconds'",
                (payload["ubicacionId"],),
            )
            (cantidad,) = cur.fetchone()

        exito = uuid1 == uuid2 and cantidad == 1
        suite.registrar(Resultado(
            "BUG-002", "Idempotencia 60s: no duplica ni por API ni en BD",
            exito, detalle=f"uuid1==uuid2={uuid1 == uuid2} · filas_bd_activas={cantidad}"
        ))
    except Exception as e:
        suite.registrar(Resultado("BUG-002", "Idempotencia 60s", False, detalle=str(e)))


def bug_003_fcm_project_id(suite: Suite) -> None:
    """
    BUG-003 — Permission denied en FCM por FCM_PROJECT_ID incorrecto.
    Fix reportado: usar el ID `proyecto---olimpiada-2026`.
    Verificación: (a) .env tiene ese ID; (b) GET /fcm/estado no devuelve OFFLINE.
    """
    detalles: list[str] = []
    id_ok = False
    servicio_ok = False
    try:
        env_path = os.path.join(RUTA_PROYECTO, ".env")
        with open(env_path, encoding="utf-8") as f:
            env = f.read()
        id_ok = "FCM_PROJECT_ID=proyecto---olimpiada-2026" in env
        detalles.append(f"env_id_ok={id_ok}")
    except Exception as e:
        detalles.append(f"env_err={e}")

    try:
        # GET /fcm/estado requiere auth — usamos guardia.
        tok, _ = login("guardia@hospital.gob.ar", "Password123!")
        r = requests.get(f"{API}/fcm/estado", headers=bearer(tok), timeout=TIMEOUT_S)
        data = r.json().get("data", {})
        servicio_ok = data.get("estado") == "ONLINE"
        detalles.append(f"servicio={data.get('estado')} · proyecto={data.get('proyecto')}")
    except Exception as e:
        detalles.append(f"estado_err={e}")

    suite.registrar(Resultado(
        "BUG-003", "FCM_PROJECT_ID correcto y servicio ONLINE",
        id_ok and servicio_ok, detalle=" · ".join(detalles),
    ))


def bug_004_trigger_inmutable(suite: Suite) -> None:
    """
    BUG-004 — Vulnerabilidad de manipulación en bitácora.
    Fix reportado: trigger PostgreSQL `fn_prevent_audit_tampering`.
    Verificación directa: (a) el trigger existe; (b) UPDATE/DELETE fallan.
    """
    trigger_encontrado = False
    update_bloqueado = False
    delete_bloqueado = False
    try:
        with psycopg2.connect(DB_DSN) as cnx, cnx.cursor() as cur:
            cur.execute("""
                SELECT tgname FROM pg_trigger
                WHERE tgname = 'trg_audit_immutable';
            """)
            trigger_encontrado = cur.fetchone() is not None

            cur.execute("SELECT id FROM incidentes_auditoria_eventos ORDER BY id DESC LIMIT 1;")
            fila = cur.fetchone()
            if not fila:
                suite.registrar(Resultado(
                    "BUG-004", "Trigger inmutable de auditoría", False,
                    detalle="Sin eventos previos para probar. Corré primero test_funcionales.",
                ))
                return
            eid = fila[0]

            for sql, flag in (
                ("UPDATE incidentes_auditoria_eventos SET tipo_evento='HACK' WHERE id=%s", "u"),
                ("DELETE FROM incidentes_auditoria_eventos WHERE id=%s", "d"),
            ):
                try:
                    with cnx.cursor() as c2:
                        c2.execute(sql, (eid,))
                    cnx.commit()
                except psycopg2.Error:
                    cnx.rollback()
                    if flag == "u": update_bloqueado = True
                    else:           delete_bloqueado = True

        exito = trigger_encontrado and update_bloqueado and delete_bloqueado
        suite.registrar(Resultado(
            "BUG-004", "Auditoría médico-legal inmutable (trigger + rechazo)",
            exito,
            detalle=f"trigger={trigger_encontrado} · update_bloq={update_bloqueado} · delete_bloq={delete_bloqueado}"
        ))
    except Exception as e:
        suite.registrar(Resultado("BUG-004", "Trigger inmutable", False, detalle=str(e)))


def main() -> int:
    imprimir_encabezado("Auditoría de Regresión — Tabla 3 del PDF (BUG-001 a BUG-004)")
    salir_si_backend_caido()
    limpiar_estado_qa()

    suite = Suite("defectos")
    bug_001_heartbeat_socket(suite)
    bug_002_idempotencia(suite)
    bug_003_fcm_project_id(suite)
    bug_004_trigger_inmutable(suite)

    ok, total = suite.resumen()
    print(f"\nRESULTADO SUITE REGRESIÓN: {ok}/{total}")
    return 0 if ok == total else 1


if __name__ == "__main__":
    raise SystemExit(main())

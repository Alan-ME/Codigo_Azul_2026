"""Utilidades compartidas por todos los scripts de auditoría QA."""
from __future__ import annotations

import io
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Callable

import requests

# Forzar UTF-8 en stdout — Windows por defecto usa cp1252 y rompe con acentos/→.
if sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_URL   = os.environ.get("QA_BASE_URL", "http://localhost:3000")
API        = f"{BASE_URL}/api/v1"
DB_DSN     = os.environ.get(
    "QA_DB_DSN",
    "host=localhost port=5432 dbname=codigo_azul_db user=postgres password=admin",
)
TIMEOUT_S  = 10
UBICACION_DEMO = int(os.environ.get("QA_UBICACION_ID", "1"))


ANSI_OK   = "\033[92m"
ANSI_FAIL = "\033[91m"
ANSI_INFO = "\033[96m"
ANSI_END  = "\033[0m"


@dataclass
class Resultado:
    id: str
    descripcion: str
    exitoso: bool
    detalle: str = ""
    medicion: str = ""


@dataclass
class Suite:
    nombre: str
    resultados: list[Resultado] = field(default_factory=list)

    def registrar(self, r: Resultado) -> None:
        self.resultados.append(r)
        marca = f"{ANSI_OK}[OK]{ANSI_END}" if r.exitoso else f"{ANSI_FAIL}[FAIL]{ANSI_END}"
        extra = f"  ({r.medicion})" if r.medicion else ""
        print(f"  {marca} {r.id} — {r.descripcion}{extra}")
        if r.detalle:
            print(f"       {r.detalle}")

    def resumen(self) -> tuple[int, int]:
        ok = sum(1 for r in self.resultados if r.exitoso)
        return ok, len(self.resultados)


def imprimir_encabezado(titulo: str) -> None:
    print()
    print(f"{ANSI_INFO}{'=' * 68}{ANSI_END}")
    print(f"{ANSI_INFO}  {titulo}{ANSI_END}")
    print(f"{ANSI_INFO}{'=' * 68}{ANSI_END}")


def esperar_backend(intentos: int = 5, espera_s: float = 1.0) -> bool:
    """Verifica que el backend responda antes de correr la suite."""
    for _ in range(intentos):
        try:
            r = requests.get(f"{API}/health", timeout=3)
            if r.ok and r.json().get("data", {}).get("status") == "online":
                return True
        except requests.RequestException:
            pass
        time.sleep(espera_s)
    return False


def login(email: str, password: str) -> tuple[str, dict]:
    """Devuelve (token, user) para las credenciales dadas."""
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=TIMEOUT_S)
    r.raise_for_status()
    data = r.json()["data"]
    return data["token"], data["user"]


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def cronometrar(fn: Callable[[], object]) -> tuple[object, float]:
    """Ejecuta fn() y devuelve (resultado, ms_transcurridos)."""
    t0 = time.perf_counter()
    valor = fn()
    ms = (time.perf_counter() - t0) * 1000
    return valor, ms


def salir_si_backend_caido() -> None:
    if not esperar_backend():
        print(f"{ANSI_FAIL}[ABORT] El backend no responde en {BASE_URL}. "
              f"Levantalo con `iniciar-servidores.bat` y reintentá.{ANSI_END}")
        sys.exit(2)


def limpiar_estado_qa() -> None:
    """
    Cierra cualquier incidente pendiente creado por corridas previas de la suite
    para que las ventanas de idempotencia no contaminen las validaciones.
    Sólo toca incidentes en estados abiertos — deja intacta la auditoría inmutable.
    """
    import psycopg2  # import local: evita costo si el DSN no está configurado
    try:
        with psycopg2.connect(DB_DSN) as cnx, cnx.cursor() as cur:
            cur.execute("""
                UPDATE incidentes
                SET    estado='CANCELADO',
                       motivo_cancelacion='QA_RESET (limpieza automática de suite)',
                       resolved_at=NOW()
                WHERE  estado IN ('ACTIVADO','NOTIFICADO','EN_ATENCION');
            """)
            print(f"  {ANSI_INFO}[QA_RESET]{ANSI_END} incidentes abiertos cerrados: {cur.rowcount}")
    except Exception as e:
        print(f"  {ANSI_FAIL}[QA_RESET][ERR]{ANSI_END} no pude limpiar estado: {e}")

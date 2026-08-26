"""
Orquestador — corre las tres suites y produce un veredicto único frente
a las afirmaciones del PDF `Plan_de_Pruebas_y_Calidad_Test_Plan_APA.pdf`.
"""
from __future__ import annotations

import test_defectos
import test_funcionales
import test_latencia
from common import ANSI_END, ANSI_FAIL, ANSI_INFO, ANSI_OK


def main() -> int:
    r_fun  = test_funcionales.main()
    r_perf = test_latencia.main()
    r_def  = test_defectos.main()

    print()
    print(f"{ANSI_INFO}{'=' * 68}{ANSI_END}")
    print(f"{ANSI_INFO}  VEREDICTO GLOBAL{ANSI_END}")
    print(f"{ANSI_INFO}{'=' * 68}{ANSI_END}")
    for nombre, code in (("Funcionales (Tabla 1)", r_fun),
                          ("Latencia    (Tabla 2)", r_perf),
                          ("Defectos    (Tabla 3)", r_def)):
        marca = f"{ANSI_OK}[APROBADA]{ANSI_END}" if code == 0 else f"{ANSI_FAIL}[CON FALLOS]{ANSI_END}"
        print(f"  {marca}  {nombre}")

    return 0 if (r_fun == 0 and r_perf == 0 and r_def == 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())

-- ─────────────────────────────────────────────────────────────
-- sql/001_create_enums.sql
-- Tipos enumerados nativos de PostgreSQL para Código Azul.
-- Normativa: SAD v1.0 / IEEE 830 / ISO 25010
-- ─────────────────────────────────────────────────────────────

-- Extensión pgcrypto / uuid-ossp para gen_random_uuid() si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Estado del ciclo de vida de un incidente según la FSM clínica
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_incidente') THEN
    CREATE TYPE estado_incidente AS ENUM (
      'ACTIVADO',
      'NOTIFICADO',
      'EN_ATENCION',
      'RESUELTO',
      'CANCELADO'
    );
  END IF;
END $$;

-- Roles de usuario para el sistema de control de acceso RBAC
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    CREATE TYPE rol_usuario AS ENUM (
      'ADMINISTRADOR',
      'MEDICO_ACTIVADOR',
      'REANIMADOR_MEDICO',
      'OPERADOR_GUARDIA'
    );
  END IF;
END $$;

-- Resultado clínico médico-legal al resolver un incidente (Estándar AHA / PERKI / ILCOR)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resultado_clinico') THEN
    CREATE TYPE resultado_clinico AS ENUM (
      'ROSC_EXITOSO',
      'DESFIBRILACION_EFECTIVA',
      'TRASLADO_UTI',
      'FALLECIDO_DOA',
      'FALSA_ALARMA'
    );
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- sql/002_create_tables.sql
-- Estructura relacional de 5 tablas maestras según DER v1.0.
-- ─────────────────────────────────────────────────────────────

-- 1. Tabla de Usuarios del Sistema Hospitalario
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            rol_usuario NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Ubicaciones Espaciales Hospitalarias
CREATE TABLE IF NOT EXISTS ubicaciones (
  id             SERIAL PRIMARY KEY,
  edificio       VARCHAR(100) NOT NULL,
  piso           INT NOT NULL,
  sector_sala    VARCHAR(100) NOT NULL,
  cama           VARCHAR(20) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ubicacion_espacio UNIQUE (edificio, piso, sector_sala, cama)
);

-- 3. Tabla Principal Transaccional de Incidentes Código Azul
CREATE TABLE IF NOT EXISTS incidentes (
  id                 SERIAL PRIMARY KEY,
  codigo_uuid        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ubicacion_id       INT NOT NULL REFERENCES ubicaciones(id) ON DELETE RESTRICT,
  activado_por_id    INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  reanimador_id      INT REFERENCES usuarios(id) ON DELETE SET NULL,
  estado             estado_incidente NOT NULL DEFAULT 'ACTIVADO',
  motivo_cancelacion TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ
);

-- 4. Tabla de Auditoría Inmutable de Eventos (Append-Only Event Sourcing)
CREATE TABLE IF NOT EXISTS incidentes_auditoria_eventos (
  id                 BIGSERIAL PRIMARY KEY,
  incidente_id       INT NOT NULL REFERENCES incidentes(id) ON DELETE CASCADE,
  usuario_id         INT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_evento        VARCHAR(50) NOT NULL,
  payload_data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp_evento   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Notificaciones Push Despachadas (FCM)
CREATE TABLE IF NOT EXISTS notificaciones_push (
  id                 SERIAL PRIMARY KEY,
  incidente_id       INT NOT NULL REFERENCES incidentes(id) ON DELETE CASCADE,
  token_fcm          VARCHAR(255) NOT NULL,
  titulo             VARCHAR(150) NOT NULL,
  cuerpo             TEXT NOT NULL,
  despachado         BOOLEAN NOT NULL DEFAULT false,
  timestamp_despacho TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

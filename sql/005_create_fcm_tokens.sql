-- ─────────────────────────────────────────────────────────────
-- sql/005_create_fcm_tokens.sql
-- Tabla para tokens de dispositivos móviles FCM asociados a usuarios.
-- Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
-- Normativa: SAD v1.0 / IEEE 830 / ISO 25010
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios_dispositivos_fcm (
  id              SERIAL PRIMARY KEY,
  usuario_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_fcm       VARCHAR(500) NOT NULL UNIQUE,
  plataforma      VARCHAR(20) NOT NULL DEFAULT 'ANDROID',
  activo          BOOLEAN NOT NULL DEFAULT true,
  ultimo_acceso   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_usuario_id ON usuarios_dispositivos_fcm(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fcm_token ON usuarios_dispositivos_fcm(token_fcm);

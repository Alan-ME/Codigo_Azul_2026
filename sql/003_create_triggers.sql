-- ─────────────────────────────────────────────────────────────
-- sql/003_create_triggers.sql
-- Triggers de inmutabilidad médico-legal e índices de rendimiento.
-- ─────────────────────────────────────────────────────────────

-- 1. Función de Trigger para bloqueo estricto de UPDATE y DELETE en Auditoría
CREATE OR REPLACE FUNCTION fn_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'VIOLACIÓN MÉDICO-LEGAL: La tabla incidentes_auditoria_eventos es inmutable (Append-Only). No se permiten operaciones de UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger sobre incidentes_auditoria_eventos
DROP TRIGGER IF EXISTS trg_audit_immutable ON incidentes_auditoria_eventos;
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON incidentes_auditoria_eventos
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_audit_tampering();

-- 3. Índices de optimización de consultas en tiempo real y latencia crítica
CREATE INDEX IF NOT EXISTS idx_incidentes_estado
  ON incidentes (estado);

CREATE INDEX IF NOT EXISTS idx_incidentes_idempotencia
  ON incidentes (ubicacion_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidentes_uuid
  ON incidentes (codigo_uuid);

CREATE INDEX IF NOT EXISTS idx_auditoria_incidente
  ON incidentes_auditoria_eventos (incidente_id, timestamp_evento ASC);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
  ON usuarios (email);

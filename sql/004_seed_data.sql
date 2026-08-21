-- ─────────────────────────────────────────────────────────────
-- sql/004_seed_data.sql
-- Datos sintéticos para pruebas, demo ante jurado y validación de roles.
-- Contraseña de todos los usuarios de prueba: Password123!
-- Hash bcrypt (cost 10): $2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.
-- ─────────────────────────────────────────────────────────────

-- 1. Inserción de Usuarios Sintéticos
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, activo)
VALUES
  (
    'Alan', 'Martinez',
    'admin@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'ADMINISTRADOR',
    true
  ),
  (
    'Maria Elena', 'Gonzalez',
    'medico.activador@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'MEDICO_ACTIVADOR',
    true
  ),
  (
    'Carlos', 'Benitez',
    'enfermero.activador@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'MEDICO_ACTIVADOR',
    true
  ),
  (
    'Ivan', 'Cardozo',
    'reanimador1@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'REANIMADOR_MEDICO',
    true
  ),
  (
    'Alex', 'Heredia',
    'reanimador2@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'REANIMADOR_MEDICO',
    true
  ),
  (
    'Marcos', 'Silvani',
    'guardia@hospital.gob.ar',
    '$2b$10$5wRKxiF.bmNBVd70DQ.wUeg9QZecoCOSYG2KzpuaJsAz284ia.3L.',
    'OPERADOR_GUARDIA',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- 2. Inserción de Ubicaciones Hospitalarias
INSERT INTO ubicaciones (edificio, piso, sector_sala, cama)
VALUES
  ('Monoblock Central', 1, 'Guardia General', 'Shockroom-01'),
  ('Monoblock Central', 1, 'Guardia General', 'Shockroom-02'),
  ('Monoblock Central', 2, 'Quirófano Central', 'Quirófano-03'),
  ('Monoblock Central', 3, 'Unidad de Cuidados Intensivos', 'UCI-01'),
  ('Monoblock Central', 3, 'Unidad de Cuidados Intensivos', 'UCI-04'),
  ('Monoblock Central', 4, 'Unidad Coronaria (UCO)', 'UCO-02'),
  ('Pabellón Materno-Infantil', 1, 'Neonatología', 'Cuna-05'),
  ('Pabellón Quirúrgico', 0, 'Sala de Recuperación', 'Cama-08')
ON CONFLICT (edificio, piso, sector_sala, cama) DO NOTHING;

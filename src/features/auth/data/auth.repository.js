// ─────────────────────────────────────────────────────────────
// src/features/auth/data/auth.repository.js
// Repositorio de acceso a datos de Usuarios para Autenticación.
// ─────────────────────────────────────────────────────────────
import { query } from '../../../core/config/db.js';

export class AuthRepository {
  /**
   * Busca un usuario activo por su correo electrónico.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const text = `
      SELECT
        id,
        nombre,
        apellido,
        email,
        password_hash,
        rol,
        activo,
        created_at
      FROM usuarios
      WHERE LOWER(email) = LOWER($1) AND activo = true
      LIMIT 1;
    `;
    const result = await query(text, [email.trim()]);
    return result.rows[0] || null;
  }

  /**
   * Busca un usuario por ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = `
      SELECT
        id,
        nombre,
        apellido,
        email,
        rol,
        activo,
        created_at
      FROM usuarios
      WHERE id = $1 AND activo = true
      LIMIT 1;
    `;
    const result = await query(text, [id]);
    return result.rows[0] || null;
  }
}

export const authRepository = new AuthRepository();

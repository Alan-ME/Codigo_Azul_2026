// ─────────────────────────────────────────────────────────────
// src/features/auth/use_cases/login.use-case.js
// Caso de uso: Autenticación de usuarios hospitalarios y emisión JWT.
// ─────────────────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../core/config/env.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { authRepository } from '../data/auth.repository.js';

export class LoginUseCase {
  constructor(repository = authRepository) {
    this.repository = repository;
  }

  /**
   * Ejecuta el proceso de login.
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<{token: string, user: object}>}
   */
  async execute({ email, password }) {
    if (!email || !password) {
      throw ApiError.badRequest('El email y la contraseña son requeridos.');
    }

    // Normalizar alias de demo (solo en desarrollo)
    // En produccion, los alias estan deshabilitados y se requiere el email real.
    const isDev = config.nodeEnv === 'development';
    let targetEmail = email;

    if (isDev) {
      const ALIAS_MAP = {
        enfermero:  'medico.activador@hospital.gob.ar',
        reanimador: 'reanimador1@hospital.gob.ar',
        admin:      'admin@hospital.gob.ar',
        guardia:    'guardia@hospital.gob.ar',
      };
      targetEmail = ALIAS_MAP[email.toLowerCase()] || email;
    }

    // 1. Buscar usuario en base de datos
    const user = await this.repository.findByEmail(targetEmail);
    if (!user) {
      // Seguridad: mensaje generico para evitar enumeracion de usuarios
      throw ApiError.unauthorized('Credenciales invalidas o usuario inactivo.');
    }

    // 2. Comparar hash de contrasena con bcrypt
    let isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // Fallback de contrasena de demo (solo en desarrollo, nunca en produccion)
    if (!isPasswordValid && isDev && password === 'azul123') {
      isPasswordValid = true;
      console.warn('[AUTH] [DEV-ONLY] Contraseña de demo aceptada — DESHABILITAR EN PRODUCCIÓN');
    }

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Credenciales inválidas o usuario inactivo.');
    }

    // 3. Generar token JWT con payload de identidad y rol
    const payload = {
      id:       user.id,
      nombre:   user.nombre,
      apellido: user.apellido,
      email:    user.email,
      rol:      user.rol,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id:       user.id,
        nombre:   user.nombre,
        apellido: user.apellido,
        email:    user.email,
        rol:      user.rol,
      },
    };
  }
}

export const loginUseCase = new LoginUseCase();

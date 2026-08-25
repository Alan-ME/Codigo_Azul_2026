// ─────────────────────────────────────────────────────────────
// scripts/test-api.js
// Suite de verificación automatizada End-to-End para Código Azul Backend.
// Ejecuta el flujo clínico completo, valida idempotencia, RBAC,
// transacciones ACID y trigger médico-legal.
// ─────────────────────────────────────────────────────────────
import { query } from '../src/core/config/db.js';
import { config } from '../src/core/config/env.js';

const BASE_URL = `http://localhost:${config.port || 3000}/api/v1`;

const logStep = (step, title) => {
  console.log(`\n[TEST ${step}] ${title}`);
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
};

const post = async (endpoint, body, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
};

const get = async (endpoint, token = null) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
};

const put = async (endpoint, body = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
};

const runAllTests = async () => {
  console.log('===========================================================');
  console.log('  SUITE DE PRUEBAS AUTOMATIZADAS — CODIGO AZUL BACKEND     ');
  console.log('===========================================================');

  // 1. Health check
  logStep(1, 'Verificar Endpoint de Salud (Health Check)');
  const health = await get('/health');
  assert(health.status === 200 && health.data.data.status === 'online', 'Health check responde 200 OK y status online');

  // 2. Autenticación de Roles
  logStep(2, 'Autenticacion de Usuarios (JWT + Roles)');

  const loginMed = await post('/auth/login', {
    email: 'medico.activador@hospital.gob.ar',
    password: 'Password123!',
  });
  assert(loginMed.status === 200 && loginMed.data.data.user.rol === 'MEDICO_ACTIVADOR', 'Login Medico Activador');
  const medicoToken = loginMed.data.data.token;

  const loginRea1 = await post('/auth/login', {
    email: 'reanimador1@hospital.gob.ar',
    password: 'Password123!',
  });
  assert(loginRea1.status === 200 && loginRea1.data.data.user.rol === 'REANIMADOR_MEDICO', 'Login Reanimador 1');
  const reanimador1Token = loginRea1.data.data.token;

  const loginRea2 = await post('/auth/login', {
    email: 'reanimador2@hospital.gob.ar',
    password: 'Password123!',
  });
  assert(loginRea2.status === 200 && loginRea2.data.data.user.rol === 'REANIMADOR_MEDICO', 'Login Reanimador 2');
  const reanimador2Token = loginRea2.data.data.token;

  const loginGuardia = await post('/auth/login', {
    email: 'guardia@hospital.gob.ar',
    password: 'Password123!',
  });
  assert(loginGuardia.status === 200 && loginGuardia.data.data.user.rol === 'OPERADOR_GUARDIA', 'Login Operador Guardia');
  const guardiaToken = loginGuardia.data.data.token;

  // 3. Catálogo de Ubicaciones
  logStep(3, 'Listado de Ubicaciones Hospitalarias');
  const ubicacionesRes = await get('/incidentes/ubicaciones', medicoToken);
  assert(ubicacionesRes.status === 200 && ubicacionesRes.data.data.length >= 8, '8 ubicaciones registradas en base de datos');
  const targetUbicacion = ubicacionesRes.data.data[3]; // UCI-01

  // 4. Disparo de Código Azul
  logStep(4, 'Disparo de Codigo Azul (POST /api/v1/incidentes/activar)');
  const activarRes = await post('/incidentes/activar', { ubicacionId: targetUbicacion.id }, medicoToken);
  assert(activarRes.status === 201, 'Codigo Azul activado con status HTTP 201');
  assert(activarRes.data.data.estado === 'ACTIVADO', 'Estado inicial es ACTIVADO');
  assert(Boolean(activarRes.data.data.codigoUUID), 'UUID criptografico generado correctamente');
  const incidenteId = activarRes.data.data.incidenteId;

  // 5. Barrera de Idempotencia (<60s)
  logStep(5, 'Validacion de Barrera de Idempotencia de 60s (Pulsacion repetida)');
  const activarRedundante = await post('/incidentes/activar', { ubicacionId: targetUbicacion.id }, medicoToken);
  assert(activarRedundante.status === 200, 'Reactivacion redundante devuelve HTTP 200 (no duplica registro)');
  assert(activarRedundante.data.data.codigoUUID === activarRes.data.data.codigoUUID, 'Retorna el mismo UUID del incidente previo');

  // 6. Listado de Activos
  logStep(6, 'Monitoreo de Guardia (GET /api/v1/incidentes/activos)');
  const activosRes = await get('/incidentes/activos', guardiaToken);
  assert(activosRes.status === 200, 'Guardia consulta lista de activos');
  const incidenteEncontrado = activosRes.data.data.find((i) => i.id === incidenteId);
  assert(Boolean(incidenteEncontrado), 'Incidente creado figura en el panel de guardia');

  // 7. Confirmación de Asistencia (ACK Primario)
  logStep(7, 'Confirmacion de Asistencia ACK Primario (PUT /api/v1/incidentes/:id/ack)');
  await new Promise((r) => setTimeout(r, 600));

  const ack1Res = await put(`/incidentes/${incidenteId}/ack`, {}, reanimador1Token);
  assert(ack1Res.status === 200, 'ACK 1 procesado con exito');
  assert(ack1Res.data.data.estado === 'EN_ATENCION', 'Estado actualizado a EN_ATENCION');
  assert(ack1Res.data.data.esReanimadorSecundario === false, 'Reanimador 1 asignado como Reanimador Principal');
  assert(ack1Res.data.data.latenciaRespuestaSegundos > 0, `Latencia calculada: ${ack1Res.data.data.latenciaRespuestaSegundos}s`);

  // 8. Confirmación de Asistencia (ACK Secundario de Apoyo)
  logStep(8, 'Confirmacion de Asistencia ACK Secundario (Reanimador de Apoyo)');
  const ack2Res = await put(`/incidentes/${incidenteId}/ack`, {}, reanimador2Token);
  assert(ack2Res.status === 200, 'ACK 2 procesado correctamente');
  assert(ack2Res.data.data.esReanimadorSecundario === true, 'Reanimador 2 registrado como Reanimador Secundario de Apoyo');

  // 9. Cancelación / Cierre
  logStep(9, 'Cancelacion de Incidente con Motivo Obligatorio');
  const cancelRes = await post(
    `/incidentes/${incidenteId}/cancelar`,
    { motivo: 'Paciente estabilizado rapidamente / simulacro de guardia' },
    guardiaToken
  );
  assert(cancelRes.status === 200, 'Incidente cancelado con exito');
  assert(cancelRes.data.data.estado === 'CANCELADO', 'Estado final CANCELADO');
  assert(Boolean(cancelRes.data.data.resolvedAt), 'Fecha resolvedAt registrada');

  // 10. Detalle Completo e Historial de Auditoría Inmutable
  logStep(10, 'Consulta de Trazabilidad e Historial Inmutable de Auditoria');
  const detalleRes = await get(`/incidentes/${incidenteId}`, guardiaToken);
  assert(detalleRes.status === 200, 'Detalle obtenido con exito');
  const historial = detalleRes.data.data.historialAuditoria;
  assert(historial.length >= 4, `Historial completo registrado (${historial.length} eventos auditados)`);
  console.log('   Eventos auditados registrados en BD:');
  historial.forEach((ev, i) => {
    console.log(`     ${i + 1}. [${ev.timestamp_evento}] ${ev.tipo_evento}`);
  });

  // 11. Control de Permisos RBAC (Intentos no autorizados)
  logStep(11, 'Validacion de Seguridad RBAC (Acceso no autorizado rechazado)');
  const activacionInvalida = await post('/incidentes/activar', { ubicacionId: targetUbicacion.id }, guardiaToken);
  assert(activacionInvalida.status === 403, 'Guardia intentando activar es rechazado con HTTP 403 Forbidden');

  // 12. Blindaje Médico-Legal (Trigger Append-Only)
  logStep(12, 'Prueba de Blindaje Medico-Legal (Trigger Append-Only en PostgreSQL)');
  try {
    await query('DELETE FROM incidentes_auditoria_eventos WHERE id = $1', [historial[0].id]);
    assert(false, 'DELETE en auditoria debio ser bloqueado por el trigger');
  } catch (err) {
    assert(
      err.message.includes('VIOLACIÓN MÉDICO-LEGAL'),
      'Trigger PostgreSQL bloqueo exitosamente intento de DELETE en auditoria'
    );
  }

  try {
    await query("UPDATE incidentes_auditoria_eventos SET tipo_evento = 'HACK' WHERE id = $1", [historial[0].id]);
    assert(false, 'UPDATE en auditoria debio ser bloqueado por el trigger');
  } catch (err) {
    assert(
      err.message.includes('VIOLACIÓN MÉDICO-LEGAL'),
      'Trigger PostgreSQL bloqueo exitosamente intento de UPDATE en auditoria'
    );
  }

  // 13. Registro de Token FCM (Fase 2 - Alex Heredia)
  logStep(13, 'Registro de Token FCM de Dispositivo Movil (POST /api/v1/fcm/token)');
  const fakeToken = 'fcm_test_token_reanimador_doctor_cardiaco_2026_xyz';
  const fcmRegRes = await post(
    '/fcm/token',
    { token: fakeToken, plataforma: 'ANDROID' },
    reanimador1Token
  );
  assert(fcmRegRes.status === 201, 'Token FCM registrado con status HTTP 201');
  assert(fcmRegRes.data.data.token === fakeToken, 'Token guardado coincide con el enviado');
  assert(fcmRegRes.data.data.plataforma === 'ANDROID', 'Plataforma ANDROID identificada correctamente');

  // 14. Seguridad en Registro FCM (Rechazo sin JWT)
  logStep(14, 'Validacion de Seguridad en Endpoint FCM (Rechazo sin Token JWT)');
  const unauthFcm = await post('/fcm/token', { token: 'unauthorized_token' }, null);
  assert(unauthFcm.status === 401, 'Peticion sin JWT rechazada con HTTP 401 Unauthorized');

  // 15. Consulta de Estado de Infraestructura FCM
  logStep(15, 'Consulta de Estado del Servicio FCM (GET /api/v1/fcm/estado)');
  const fcmEstadoRes = await get('/fcm/estado', reanimador1Token);
  assert(fcmEstadoRes.status === 200, 'Estado de FCM responde HTTP 200 OK');
  assert(fcmEstadoRes.data.data.dispositivosActivos >= 1, 'Al menos 1 dispositivo activo registrado en la base de datos');
  assert(fcmEstadoRes.data.data.servicio.includes('Firebase Cloud Messaging'), 'Servicio identificado como FCM');

  // 16. Telemetría y Auditoría JSONB de Push Despachada (Fases 3 y 4)
  logStep(16, 'Verificacion de Telemetria y Auditoria JSONB de Despacho Push');
  // Disparamos un nuevo incidente en otra sala para verificar el despacho FCM completo
  const ubicacionesList = ubicacionesRes.data.data;
  const otraUbicacion = ubicacionesList[1] || ubicacionesList[0];
  const nuevoIncidenteRes = await post('/incidentes/activar', { ubicacionId: otraUbicacion.id }, medicoToken);
  assert(nuevoIncidenteRes.status === 201 || nuevoIncidenteRes.status === 200, 'Incidente disparado para prueba de telemetria');
  
  // Esperar un breve instante para que el bus asíncrono procese la auditoría de telemetría
  await new Promise((r) => setTimeout(r, 200));

  const audTelemetria = await query(
    `SELECT * FROM incidentes_auditoria_eventos 
     WHERE tipo_evento = 'NOTIFICACION_PUSH_DESPACHADA' 
     ORDER BY timestamp_evento DESC LIMIT 1`
  );
  assert(audTelemetria.rows.length > 0, 'Evento NOTIFICACION_PUSH_DESPACHADA registrado en auditoria inmutable');
  const payloadTelemetria = audTelemetria.rows[0].payload_data;
  assert(payloadTelemetria.tipo === 'FCM_PUSH_DISPATCH', 'Payload JSONB de telemetria tiene estructura correcta');
  assert(typeof payloadTelemetria.latenciaDespachoMs === 'number', `Latencia de despacho medida: ${payloadTelemetria.latenciaDespachoMs}ms`);

  console.log('\n===========================================================');
  console.log('  TODAS LAS PRUEBAS FUNCIONALES, SEGURIDAD Y FCM PASARON (16/16 - 100%)');
  console.log('===========================================================\n');
  process.exit(0);
};

runAllTests().catch((err) => {
  console.error('[ERROR] Error fatal en suite de pruebas:', err);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────
// client/src/data/mockData.js
// Catálogo de datos clínicos y utilitarios de persistencia local.
// ─────────────────────────────────────────────────────────────

export function paletaAvatar(str = '') {
  const paleta = ['#0B5FFF', '#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F43F5E', '#14B8A6', '#6366F1', '#84CC16'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return paleta[h % paleta.length];
}

export function avatar(nombre = '', color) {
  const iniciales = (nombre || 'CA').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const c = color || paletaAvatar(nombre);
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <rect width='80' height='80' rx='40' fill='${c}'/>
      <text x='50%' y='54%' text-anchor='middle' font-family='Inter,Arial' font-size='30' font-weight='700' fill='white'>${iniciales}</text>
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function fechaISO(offsetMin = 0) {
  const d = new Date(Date.now() - offsetMin * 60000);
  return d.toISOString();
}

export const initialAreas = [
  { id: 'a1', nombre: 'Terapia Intensiva',      abrev: 'UTI',  color: '#DC2626', descripcion: 'Cuidados críticos', habitaciones: 8,  camasTotales: 12, camasOcupadas: 10, responsable: 'Dra. Alicia Ferreyra' },
  { id: 'a2', nombre: 'Clínica Médica',         abrev: 'CLIN', color: '#0B5FFF', descripcion: 'Internación general adultos', habitaciones: 20, camasTotales: 40, camasOcupadas: 32, responsable: 'Dr. Ramón Ojeda' },
  { id: 'a3', nombre: 'Pediatría',              abrev: 'PED',  color: '#EC4899', descripcion: 'Atención de menores', habitaciones: 14, camasTotales: 22, camasOcupadas: 15, responsable: 'Dra. Marina Costa' },
  { id: 'a4', nombre: 'Maternidad',             abrev: 'MAT',  color: '#8B5CF6', descripcion: 'Obstetricia y neonatología', habitaciones: 12, camasTotales: 18, camasOcupadas: 11, responsable: 'Dra. Silvina Rojas' },
  { id: 'a5', nombre: 'Cirugía',                abrev: 'CIR',  color: '#0EA5E9', descripcion: 'Post-quirúrgico y recuperación', habitaciones: 10, camasTotales: 16, camasOcupadas: 12, responsable: 'Dr. Federico Bulacio' },
  { id: 'a6', nombre: 'Guardia',                abrev: 'GDR',  color: '#F59E0B', descripcion: 'Emergencias y triage', habitaciones: 6,  camasTotales: 10, camasOcupadas: 7,  responsable: 'Dr. Enzo Villalba' },
  { id: 'a7', nombre: 'Cardiología',            abrev: 'CAR',  color: '#14B8A6', descripcion: 'Unidad coronaria', habitaciones: 8,  camasTotales: 12, camasOcupadas: 9,  responsable: 'Dra. Verónica Salcedo' },
  { id: 'a8', nombre: 'Oncología',              abrev: 'ONC',  color: '#6366F1', descripcion: 'Tratamientos oncológicos', habitaciones: 10, camasTotales: 14, camasOcupadas: 8,  responsable: 'Dr. Ignacio Ponce' },
];

export const initialUsuarios = [
  { id: 'u1', nombre: 'Julieta Molina',      usuario: 'jmolina',      email: 'j.molina@hospital.gob.ar',      rol: 'admin',     estado: 'activo',   ultimoAcceso: '2026-08-20 07:12', areaId: null, telefono: '+54 381 4123-889', avatar: avatar('Julieta Molina') },
  { id: 'u2', nombre: 'Rodrigo Peralta',     usuario: 'rperalta',     email: 'r.peralta@hospital.gob.ar',     rol: 'admin',     estado: 'activo',   ultimoAcceso: '2026-08-19 22:41', areaId: null, telefono: '+54 381 4551-002', avatar: avatar('Rodrigo Peralta') },
  { id: 'u3', nombre: 'Camila Herrera',      usuario: 'cherrera',     email: 'c.herrera@hospital.gob.ar',     rol: 'enfermero', estado: 'activo',   ultimoAcceso: '2026-08-20 08:03', areaId: 'a1', telefono: '+54 381 4998-121', avatar: avatar('Camila Herrera') },
  { id: 'u4', nombre: 'Matías Sosa',         usuario: 'msosa',        email: 'm.sosa@hospital.gob.ar',        rol: 'enfermero', estado: 'activo',   ultimoAcceso: '2026-08-20 06:58', areaId: 'a2', telefono: '+54 381 4423-778', avatar: avatar('Matías Sosa') },
  { id: 'u5', nombre: 'Belén Aguirre',       usuario: 'baguirre',     email: 'b.aguirre@hospital.gob.ar',     rol: 'enfermero', estado: 'activo',   ultimoAcceso: '2026-08-20 07:44', areaId: 'a3', telefono: '+54 381 4802-014', avatar: avatar('Belén Aguirre') },
  { id: 'u6', nombre: 'Nicolás Barrionuevo', usuario: 'nbarrionuevo', email: 'n.barrionuevo@hospital.gob.ar', rol: 'enfermero', estado: 'activo',   ultimoAcceso: '2026-08-20 07:33', areaId: 'a6', telefono: '+54 381 4110-993', avatar: avatar('Nicolás Barrionuevo') },
  { id: 'u7', nombre: 'Florencia Ríos',      usuario: 'frios',        email: 'f.rios@hospital.gob.ar',        rol: 'enfermero', estado: 'inactivo', ultimoAcceso: '2026-08-10 15:12', areaId: 'a4', telefono: '+54 381 4776-521', avatar: avatar('Florencia Ríos') },
];

export const initialPacientes = [
  { id:'p1',  nombre:'María',     apellido:'González',   dni:'32.887.412', fechaNac:'1971-04-12', edad:54, sexo:'F', obraSocial:'PAMI',      grupo:'A+',  alergias:['Penicilina'], patologias:['Hipertensión'], medicacion:['Enalapril 10mg'], telefono:'+54 381 4223-889', direccion:'Av. Mate de Luna 1420, S.M.T.', contactoEmerg:'Pedro González (hijo) — 381 4998-112', areaId:'a2', habitacion:'202', cama:'B', enfermeroId:'u4', estado:'internado' },
  { id:'p2',  nombre:'Juan',      apellido:'Pérez',      dni:'28.104.221', fechaNac:'1968-11-30', edad:57, sexo:'M', obraSocial:'OSDE',      grupo:'O+',  alergias:[],             patologias:['Diabetes tipo II','Hipertensión'], medicacion:['Metformina','Losartán'], telefono:'+54 381 4665-102', direccion:'San Martín 890', contactoEmerg:'Roxana Pérez (esposa) — 381 4222-118', areaId:'a1', habitacion:'UTI-3', cama:'A', enfermeroId:'u3', estado:'internado' },
  { id:'p3',  nombre:'Sofía',     apellido:'Rodríguez',  dni:'42.115.203', fechaNac:'2001-06-08', edad:24, sexo:'F', obraSocial:'Swiss Medical', grupo:'B+', alergias:['AAS'], patologias:[], medicacion:[], telefono:'+54 381 3554-102', direccion:'Bolívar 210', contactoEmerg:'Elena Rodríguez (madre) — 381 4111-902', areaId:'a4', habitacion:'MAT-105', cama:'A', enfermeroId:'u5', estado:'internado' },
  { id:'p4',  nombre:'Carlos',    apellido:'Fernández',  dni:'22.998.554', fechaNac:'1963-02-19', edad:62, sexo:'M', obraSocial:'IOSEP',     grupo:'A-',  alergias:[],             patologias:['EPOC','Cardiopatía isquémica'], medicacion:['Salbutamol','AAS 100'], telefono:'+54 381 4009-887', direccion:'Rivadavia 1010', contactoEmerg:'Marta Fernández (hija) — 381 4551-990', areaId:'a7', habitacion:'CAR-04', cama:'A', enfermeroId:'u3', estado:'internado' },
  { id:'p5',  nombre:'Lucía',     apellido:'Martínez',   dni:'38.001.665', fechaNac:'1994-07-25', edad:31, sexo:'F', obraSocial:'PAMI',      grupo:'AB+', alergias:[],             patologias:[], medicacion:[], telefono:'+54 381 4778-201', direccion:'9 de Julio 340', contactoEmerg:'Carla Martínez (hermana) — 381 4661-770', areaId:'a5', habitacion:'CIR-207', cama:'B', enfermeroId:'u4', estado:'observacion' },
  { id:'p6',  nombre:'Roberto',   apellido:'López',      dni:'18.556.230', fechaNac:'1955-09-14', edad:70, sexo:'M', obraSocial:'PAMI',      grupo:'O-',  alergias:['Sulfamidas'], patologias:['Insuficiencia renal crónica','Diabetes'], medicacion:['Insulina','Furosemida'], telefono:'+54 381 4110-338', direccion:'Alberdi 552', contactoEmerg:'Elba López (esposa) — 381 4223-441', areaId:'a2', habitacion:'204', cama:'A', enfermeroId:'u4', estado:'internado' },
  { id:'p7',  nombre:'Emilia',    apellido:'Torres',     dni:'46.887.001', fechaNac:'2015-03-04', edad:10, sexo:'F', obraSocial:'Swiss Medical', grupo:'A+', alergias:['Nueces'], patologias:['Asma'], medicacion:['Salbutamol'], telefono:'+54 381 4443-556', direccion:'Marco Avellaneda 25', contactoEmerg:'Carolina Torres (madre) — 381 4443-556', areaId:'a3', habitacion:'PED-11', cama:'A', enfermeroId:'u5', estado:'internado' },
  { id:'p8',  nombre:'Diego',     apellido:'Sánchez',    dni:'30.221.008', fechaNac:'1980-12-01', edad:44, sexo:'M', obraSocial:'OSDE',      grupo:'B-',  alergias:[],             patologias:['Fractura de fémur'], medicacion:['Ibuprofeno','Enoxaparina'], telefono:'+54 381 4665-118', direccion:'Belgrano 780', contactoEmerg:'Vanesa Sánchez (esposa) — 381 4771-002', areaId:'a5', habitacion:'CIR-210', cama:'A', enfermeroId:'u4', estado:'internado' },
  { id:'p9',  nombre:'Ana',       apellido:'Ramírez',    dni:'27.554.909', fechaNac:'1978-05-16', edad:47, sexo:'F', obraSocial:'PAMI',      grupo:'O+',  alergias:[],             patologias:['Neumonía'], medicacion:['Ceftriaxona','Paracetamol'], telefono:'+54 381 4996-887', direccion:'Congreso 234', contactoEmerg:'Julio Ramírez (esposo) — 381 4001-227', areaId:'a2', habitacion:'207', cama:'C', enfermeroId:'u4', estado:'internado' },
  { id:'p10', nombre:'Miguel',    apellido:'Flores',     dni:'35.114.220', fechaNac:'1986-08-23', edad:39, sexo:'M', obraSocial:'IOSEP',     grupo:'A+',  alergias:[],             patologias:['Apendicitis aguda'], medicacion:['Metamizol','Metronidazol'], telefono:'+54 381 4442-990', direccion:'Sarmiento 998', contactoEmerg:'Rita Flores (madre) — 381 4551-118', areaId:'a5', habitacion:'CIR-201', cama:'C', enfermeroId:'u4', estado:'internado' },
  { id:'p11', nombre:'Valentina', apellido:'Ibarra',     dni:'43.998.007', fechaNac:'2005-01-11', edad:20, sexo:'F', obraSocial:'Swiss Medical', grupo:'B+', alergias:[],           patologias:['Meningitis'], medicacion:['Ceftriaxona','Dexametasona'], telefono:'+54 381 4229-001', direccion:'25 de Mayo 220', contactoEmerg:'Silvina Ibarra (madre) — 381 4665-990', areaId:'a1', habitacion:'UTI-1', cama:'B', enfermeroId:'u3', estado:'internado' },
  { id:'p12', nombre:'Andrés',    apellido:'Vega',       dni:'26.445.881', fechaNac:'1976-10-05', edad:49, sexo:'M', obraSocial:'PAMI',      grupo:'A-',  alergias:['Ácido acetilsalicílico'], patologias:['Infarto agudo de miocardio'], medicacion:['Atorvastatina','Clopidogrel'], telefono:'+54 381 4001-002', direccion:'Corrientes 445', contactoEmerg:'Ester Vega (madre) — 381 4665-118', areaId:'a7', habitacion:'CAR-06', cama:'A', enfermeroId:'u3', estado:'internado' },
  { id:'p13', nombre:'Josefina',  apellido:'Cabrera',    dni:'40.998.221', fechaNac:'1997-02-27', edad:28, sexo:'F', obraSocial:'OSDE',      grupo:'O+',  alergias:[],             patologias:['Embarazo 38 semanas'], medicacion:['Ácido fólico'], telefono:'+54 381 4442-556', direccion:'Balcarce 990', contactoEmerg:'Marcelo Cabrera (esposo) — 381 4001-889', areaId:'a4', habitacion:'MAT-107', cama:'B', enfermeroId:'u5', estado:'internado' },
  { id:'p14', nombre:'Tomás',     apellido:'Núñez',      dni:'44.220.556', fechaNac:'2003-11-17', edad:22, sexo:'M', obraSocial:'PAMI',      grupo:'AB-', alergias:[],             patologias:['Politraumatismo'], medicacion:['Tramadol'], telefono:'+54 381 4998-002', direccion:'Chacabuco 12', contactoEmerg:'Diego Núñez (padre) — 381 4223-887', areaId:'a6', habitacion:'GDR-3', cama:'A', enfermeroId:'u6', estado:'observacion' },
  { id:'p15', nombre:'Patricia',  apellido:'Villalba',   dni:'23.998.001', fechaNac:'1970-06-30', edad:55, sexo:'F', obraSocial:'IOSEP',     grupo:'A+',  alergias:[],             patologias:['Cáncer de mama en tratamiento'], medicacion:['Tamoxifeno'], telefono:'+54 381 4221-889', direccion:'Muñecas 220', contactoEmerg:'Sabrina Villalba (hija) — 381 4009-990', areaId:'a8', habitacion:'ONC-02', cama:'A', enfermeroId:'u4', estado:'internado' },
  { id:'p16', nombre:'Federico',  apellido:'Salinas',    dni:'31.554.220', fechaNac:'1983-09-09', edad:42, sexo:'M', obraSocial:'OSDE',      grupo:'O+',  alergias:[],             patologias:['ACV isquémico'], medicacion:['Enoxaparina','AAS'], telefono:'+54 381 4996-002', direccion:'Junín 445', contactoEmerg:'Laura Salinas (esposa) — 381 4223-334', areaId:'a1', habitacion:'UTI-5', cama:'A', enfermeroId:'u3', estado:'internado' },
  { id:'p17', nombre:'Gabriela',  apellido:'Ramos',      dni:'25.887.001', fechaNac:'1975-12-24', edad:50, sexo:'F', obraSocial:'PAMI',      grupo:'B+',  alergias:[],             patologias:['Colecistitis'], medicacion:['Ceftriaxona'], telefono:'+54 381 4001-441', direccion:'Salta 660', contactoEmerg:'Ricardo Ramos (esposo) — 381 4665-998', areaId:'a5', habitacion:'CIR-203', cama:'A', enfermeroId:'u4', estado:'internado' },
  { id:'p18', nombre:'Bruno',     apellido:'Delgado',    dni:'47.220.100', fechaNac:'2019-03-15', edad:6,  sexo:'M', obraSocial:'Swiss Medical', grupo:'A+', alergias:[],           patologias:['Bronquiolitis'], medicacion:['Salbutamol','Corticoides'], telefono:'+54 381 4001-772', direccion:'Lavalle 118', contactoEmerg:'Cintia Delgado (madre) — 381 4223-880', areaId:'a3', habitacion:'PED-08', cama:'A', enfermeroId:'u5', estado:'internado' },
].map(p => ({ ...p, avatar: avatar(`${p.nombre} ${p.apellido}`) }));

export const initialTiposLlamado = [
  { id:'normal',     nombre:'Normal',      color:'#F59E0B', sonido:'campanilla.mp3', tiempoMax:'10 min' },
  { id:'emergencia', nombre:'Emergencia',  color:'#DC2626', sonido:'sirena-corta.mp3', tiempoMax:'5 min' },
  { id:'codigo-azul',nombre:'Código Azul', color:'#0047FF', sonido:'alarma-codazul.mp3', tiempoMax:'2 min' },
];

export const initialOrigenesLlamado = [
  { id:'cama',    nombre:'Botón de cama',  icono:'cama',  descripcion:'Botón físico ubicado en la baranda de la cama.' },
  { id:'baño',    nombre:'Botón de baño',  icono:'bath',  descripcion:'Botón junto al inodoro/ducha (accionable con la mano o con cordón).' },
  { id:'pulsera', nombre:'Pulsera',        icono:'watch', descripcion:'Pulsera identificatoria con botón de emergencia.' },
  { id:'pared',   nombre:'Botón de pared', icono:'radio', descripcion:'Botón fijo en habitaciones sin paciente identificado.' },
  { id:'voz',     nombre:'Comando de voz', icono:'mic',   descripcion:'Detección por comando de voz (activo solo en UTI).' },
];

export const initialLlamadosActivos = [];

export function generarHistoricos() {
  const arr = [];
  const tipos = ['normal','normal','normal','normal','emergencia','emergencia','codigo-azul'];
  const origenes = ['cama','cama','cama','baño','baño','pulsera'];
  const estados = ['atendido','atendido','atendido','atendido','no-atendido'];
  let idc = 1;
  for (let i = 0; i < 60; i++) {
    const pac = initialPacientes[Math.floor(Math.random() * initialPacientes.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const origen = origenes[Math.floor(Math.random() * origenes.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const enfermerosAct = initialUsuarios.filter(u => u.rol === 'enfermero' && u.estado === 'activo');
    const enf = enfermerosAct[Math.floor(Math.random() * enfermerosAct.length)];
    const inicioMin = Math.floor(Math.random() * 60 * 24 * 30);
    const duracionSeg = tipo === 'codigo-azul'
      ? 30 + Math.floor(Math.random() * 180)
      : tipo === 'emergencia'
        ? 60 + Math.floor(Math.random() * 300)
        : 90 + Math.floor(Math.random() * 900);
    const tiempoRespuestaSeg = estado === 'atendido'
      ? Math.max(15, Math.floor(duracionSeg * (0.15 + Math.random() * 0.4)))
      : null;
    arr.push({
      id: 'lh' + (idc++),
      pacienteId: pac.id,
      tipo,
      origen,
      estado,
      enfermeroId: enf.id,
      horaInicio: fechaISO(inicioMin + duracionSeg / 60),
      horaFin:    fechaISO(inicioMin),
      duracionSeg,
      tiempoRespuestaSeg,
    });
  }
  arr.sort((a, b) => b.horaInicio.localeCompare(a.horaInicio));
  return arr;
}

export const initialLlamadosHistoricos = generarHistoricos();

export const initialNotificaciones = [
  { id:'n1', tipo:'codigo-azul', texto:'Código Azul activo — Valentina Ibarra (UTI-1)', hora:fechaISO(2),  leida:false },
  { id:'n2', tipo:'emergencia',  texto:'Nueva emergencia — Juan Pérez (UTI-3)',        hora:fechaISO(6),  leida:false },
  { id:'n3', tipo:'sistema',     texto:'Paciente asignado: Josefina Cabrera (MAT-107)', hora:fechaISO(28), leida:false },
  { id:'n4', tipo:'normal',      texto:'Llamado normal atendido — Diego Sánchez',       hora:fechaISO(52), leida:true },
  { id:'n5', tipo:'sistema',     texto:'Turno de guardia iniciado — 07:00',             hora:fechaISO(75), leida:true },
  { id:'n6', tipo:'sistema',     texto:'Backup automático completado',                  hora:fechaISO(180),leida:true },
  { id:'n7', tipo:'aviso',       texto:'Habitación 204 marcada como aislamiento',       hora:fechaISO(410),leida:true },
  { id:'n8', tipo:'sistema',     texto:'Actualización de firmware programada',          hora:fechaISO(720),leida:true },
];

// ─────────────────────────────────────────────────────────────
// Utilidades de Persistencia en LocalStorage (Offline Resilience)
// ─────────────────────────────────────────────────────────────

export function getStored(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`codazul_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStored(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`codazul_${key}`, JSON.stringify(value));
  } catch {}
}

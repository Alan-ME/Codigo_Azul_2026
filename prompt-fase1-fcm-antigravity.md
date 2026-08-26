# Prompt para Antigravity — Fase 1 (actualizada): Conexión Firebase Admin SDK

## 1. El prompt (copiar y pegar tal cual en Antigravity)

```
Actuá como un desarrollador backend senior especializado en Node.js e
integraciones con Firebase. Vas a implementar EXCLUSIVAMENTE la Fase 1 de
mi hoja de ruta técnica individual (que fue reestructurada), ni una tarea
más ni una menos.

CONTEXTO DEL PROYECTO:
Proyecto de olimpiadas de programación (E.E.S.T. N.º 2). El sistema notifica
en tiempo real eventos de "código azul" (protocolo de emergencia hospitalaria)
al personal médico. Mi rol es "Push Notifications & Telemetry Engineer Lead".
El gateway Socket.IO base y los middlewares JWT ya fueron implementados por
otro integrante del equipo (Ivan Cardozo) — yo NO toco esa parte. Mi trabajo
empieza en la capa de notificaciones push (Firebase Cloud Messaging). El
líder de Arquitectura y QA (Alan Martinez) va a revisar este entregable
contra la hoja de ruta original, así que el resultado tiene que coincidir
exactamente con lo pedido.

ALCANCE EXACTO DE LA FASE 1 (no agregar nada fuera de esto):
1. Crear el módulo `src/config/firebase.config.js` e inicializar
   `firebase-admin` leyendo las credenciales de servicio `FCM_PROJECT_ID` y
   `FCM_PRIVATE_KEY` desde variables de entorno.
2. Validar que la conexión con la consola de Firebase se estableció
   correctamente al iniciar el servidor (verificación de arranque, no un
   endpoint nuevo).

ENTREGABLE Y UBICACIÓN:
- Archivo principal: `src/config/firebase.config.js`
  (esta ruta la fija la hoja de ruta, no la cambies).
- Debe exportar la instancia ya inicializada de `firebase-admin` (o una
  función `initFirebase()` que la devuelva) para que las fases siguientes
  (registro de tokens, despacho push) la importen desde acá.
- No implementes el endpoint `/api/v1/fcm/token`, el despachador de push,
  ni la telemetría/auditoría — eso pertenece a las Fases 2, 3 y 4 y NO se
  hace ahora. Como mucho, dejá un comentario indicando dónde se va a
  enganchar más adelante.
- No toques nada relacionado a Socket.IO ni a los middlewares JWT — esa
  capa ya la entregó Ivan Cardozo.

REQUISITOS TÉCNICOS OBLIGATORIOS:
- Usar el paquete oficial `firebase-admin`.
- Las credenciales (`FCM_PROJECT_ID`, `FCM_PRIVATE_KEY`, y el resto de los
  campos del service account que Firebase requiera, como `client_email`)
  se leen SIEMPRE desde variables de entorno, nunca hardcodeadas ni
  commiteadas en el repo.
- Si la inicialización falla (credenciales mal formadas, faltantes, etc.),
  el servidor debe loguear un error claro al arrancar, no fallar en
  silencio.

TRAZABILIDAD (importante para la evaluación del proyecto):
- Agregá un bloque de comentario al inicio del archivo indicando:
  responsable (Alex Heredia), rol actualizado, fase de la hoja de ruta
  actualizada, y qué hace el archivo en una línea.
- Comentá el bloque de inicialización explicando el POR QUÉ de cada
  variable de entorno que se lee.

FORMATO DE RESPUESTA:
Explicame también, en un resumen corto al final, qué archivos creaste, qué
decisiones tomaste si algo no estaba especificado en la hoja de ruta (por
ejemplo, si hay más campos del service account además de PROJECT_ID y
PRIVATE_KEY que hacen falta para inicializar), y cómo probar la conexión
manualmente sin depender de las fases siguientes.
```

## 2. Qué va a construir Antigravity, punto por punto

| Lo que pide la hoja de ruta | Cómo se traduce en código |
|---|---|
| "Inicialización SDK... leyendo las credenciales `FCM_PROJECT_ID` y `FCM_PRIVATE_KEY` del `.env`" | `admin.initializeApp({ credential: admin.credential.cert({...}) })` usando `process.env.FCM_PROJECT_ID` y `process.env.FCM_PRIVATE_KEY` (más `client_email`, que Firebase exige junto a esos dos para armar el service account). |
| "Validar el correcto enlace con la consola de Google Firebase en el inicio del servidor" | Una verificación al arrancar — por ejemplo, loguear si `admin.apps.length > 0` o intentar una llamada mínima al SDK — que confirme que la conexión quedó bien armada, no un endpoint HTTP nuevo. |

Nada más que esto debería aparecer acá. Si Antigravity te arma el endpoint de registro de tokens o el envío de notificaciones, es scope creep de las Fases 2 y 3 — pedile que lo saque.

## 3. Dónde tiene que quedar ubicado en el proyecto

```
src/
└── config/
    └── firebase.config.js   ← tu entregable de esta Fase 1
```

Esta ruta la especifica literalmente la hoja de ruta actualizada en el Paso 1 ("Crear el módulo `src/config/firebase.config.js`"). Importa por lo mismo de siempre: es donde Alan y el resto del equipo van a buscarlo, y es de donde tus propias Fases 2 y 3 van a importar la conexión ya inicializada.

## 4. Cómo saber que está funcionando correctamente

1. **El servidor arranca sin errores** y en la consola ves el log de confirmación de que Firebase se inicializó.
2. **Con credenciales mal puestas a propósito** (por ejemplo, una `FCM_PRIVATE_KEY` inválida), el servidor te tiene que avisar con un error claro en el arranque — no puede fallar en silencio ni seguir como si nada.
3. **Sin necesitar nada de las fases siguientes**: no hace falta un token de celular real ni enviar ninguna notificación todavía. Esta fase se valida solo con que la conexión al SDK quede establecida.

## 5. Glosario rápido para cuando te pregunten

- **Firebase Admin SDK**: la librería que le permite a tu servidor (backend) hablar con los servicios de Firebase — en este caso, para poder mandar notificaciones push más adelante. No es lo mismo que el SDK de cliente (el que usaría la app móvil).
- **Service account**: una "identidad de servidor" que Firebase te da para autenticar tu backend contra sus servicios, en vez de usar un usuario humano. Se compone de varios campos (`project_id`, `private_key`, `client_email`), no solo de los dos que menciona la hoja de ruta.
- **`FCM_PROJECT_ID` / `FCM_PRIVATE_KEY`**: dos de los datos de ese service account, guardados como variables de entorno para no exponerlos en el código fuente.
- **Inicializar el SDK**: el paso previo obligatorio antes de poder mandar cualquier notificación — sin esto, ninguna de tus fases siguientes puede funcionar.

## 6. Por qué no hay que agregar ni sacar nada de la hoja de ruta

Sigue aplicando el mismo motivo que en la versión anterior, con un matiz extra: la reorganización del equipo (Ivan absorbiendo el gateway base) ya generó un cambio de alcance una vez. Si además vos agregás o sacás cosas por tu cuenta, se vuelve mucho más difícil para Alan reconstruir "quién hizo qué" cuando audite el proyecto contra los dos documentos (el viejo y el actualizado). Ceñirte estrictamente a esta versión es lo que mantiene rastreable el trabajo de todo el equipo.

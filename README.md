# Chashly

PWA de finanzas personales **offline-first**: registras ingresos, gastos y presupuestos sin conexión, y todo se sincroniza con la nube automáticamente cuando vuelve la red.

## Arrancar

```bash
npm install
npm run dev          # API en :4000 y PWA en :5173 (Vite hace proxy de /api)
npm test             # pruebas de API, motor de presupuestos y sincronización
npm run build        # build de producción de todo el monorepo
```

Requiere Node 20 o superior.

## Estructura

```
packages/shared    Esquemas zod y contratos de la API compartidos por cliente y servidor
apps/api           Express + JWT. Servicios, repositorios (interfaces) y rutas separados
apps/web           React + Vite + Workbox + Dexie (IndexedDB)
  src/sw.ts                Service worker: precache, rutas offline y Background Sync
  src/db/                  Esquema de IndexedDB (fuente de verdad en el dispositivo)
  src/data/local-store.ts  Escrituras local-first con patrón Outbox
  src/sync/                Motor de sincronización (compartido por ventana y SW) y disparadores
  src/features/            Pantallas y lógica por funcionalidad
```

## Cómo funciona offline y la sincronización

1. **App shell offline.** En el build, Workbox inyecta en `sw.ts` la lista de JS, CSS, HTML, fuentes e iconos y los precachea. Cualquier ruta responde con `index.html` desde caché, así la app abre sin red.
2. **Datos en IndexedDB.** La UI nunca espera a la red: lee y escribe en Dexie y se actualiza sola con `useLiveQuery`. La API no se cachea en Cache Storage porque los datos ya viven en IndexedDB.
3. **Outbox.** Cada escritura guarda el registro y encola el cambio en `outbox` dentro de la misma transacción. Varias ediciones del mismo registro se compactan en una.
4. **Background Sync.** Tras cada escritura se registra el tag `chashly-sync`. El navegador despierta al service worker cuando hay red, incluso con la pestaña cerrada, y este ejecuta `runSync()`. Si falla, el SW rechaza la promesa y el navegador reintenta.
5. **Respaldo.** Background Sync solo existe en navegadores Chromium. En Safari y Firefox la ventana sincroniza al volver la red (`online`), al volver a la pestaña y cada minuto.
6. **Protocolo.** `push` envía el outbox en lotes; cada cambio lleva un `opId` que hace el envío idempotente. `pull` trae lo cambiado desde un cursor de versión, incluidos borrados (tombstones). Los conflictos se resuelven con last-write-wins por `updatedAt`; si gana el servidor, devuelve su versión y el cliente converge.
7. **Concurrencia.** Un Web Lock evita que la ventana y el SW sincronicen al mismo tiempo.

### Probarlo en Chrome

1. `npm run build && npm run preview --workspace @chashly/web` con la API corriendo (o `npm run dev`, el SW también está activo en desarrollo).
2. DevTools, pestaña Application, sección Service Workers: debe aparecer activo.
3. En Network marca "Offline", registra gastos y recarga: la app sigue funcionando y el indicador dice cuántos cambios faltan por subir.
4. Quita "Offline": el evento `sync` se dispara y el indicador pasa a "Guardado en la nube". En Application, Background services, Background sync puedes ver el evento.

## Decisiones y pendientes para producción

- **Persistencia del servidor:** hoy usa repositorios en memoria detrás de interfaces (`apps/api/src/repositories/types.ts`). Para producción, implementa esas mismas interfaces con PostgreSQL; la lógica no cambia. `version` debe venir de una secuencia y `processedOps` de una tabla con índice único `(user_id, op_id)`.
- **Token:** el JWT se guarda en IndexedDB porque el service worker necesita leerlo para sincronizar en segundo plano. Para mayor seguridad, usa tokens de acceso cortos más un refresh token en cookie `httpOnly`.
- **Pendiente:** rate limiting en `/api/auth`, importación de extractos bancarios (RF-04), push notifications desde el servidor con VAPID (hoy las alertas de presupuesto se generan en el dispositivo) y pruebas end-to-end con Playwright.

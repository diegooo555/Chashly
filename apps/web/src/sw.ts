/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { SW_MESSAGE, SYNC_TAG, type SwMessage } from './sync/constants';
import { runSync } from './sync/sync-engine';

declare const self: ServiceWorkerGlobalScope;

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

// 1) App shell offline: Workbox inyecta aquí la lista de JS/CSS/HTML/fuentes/iconos del build.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2) Cualquier navegación (p. ej. /movimientos) responde con index.html precacheado → rutas SPA offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }));

// 3) La API nunca se cachea: los datos offline viven en IndexedDB, no en la Cache Storage.
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly());

// 4) Background Sync: el navegador despierta al SW cuando vuelve la conexión.
self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === SYNC_TAG) syncEvent.waitUntil(syncAndNotify());
});

async function syncAndNotify(): Promise<void> {
  try {
    const result = await runSync();
    await broadcast({ type: SW_MESSAGE.SYNC_FINISHED, result });
  } catch (error) {
    await broadcast({ type: SW_MESSAGE.SYNC_FAILED, error: String(error) });
    throw error; // Rechazar = el navegador reintentará con backoff.
  }
}

async function broadcast(message: SwMessage) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}

// Actualizaciones controladas: la UI pregunta al usuario antes de activar la nueva versión.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
clientsClaim();

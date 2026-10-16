import { useSyncExternalStore } from 'react';


type Listener = () => void;
let syncing = false;
const listeners = new Set<Listener>();

export function setSyncing(value: boolean) {
  syncing = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsSyncing(): boolean {
  return useSyncExternalStore(subscribe, () => syncing);
}

function subscribeOnline(listener: Listener) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine);
}

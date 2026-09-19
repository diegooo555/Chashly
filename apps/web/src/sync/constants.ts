/** Tag de Background Sync: el navegador despierta al service worker con este nombre al volver la red. */
export const SYNC_TAG = 'chashly-sync';
export const SYNC_LOCK = 'chashly-sync-lock';
export const PUSH_BATCH_SIZE = 100;
export const PULL_PAGE_SIZE = 200;

export const SW_MESSAGE = {
  SYNC_FINISHED: 'SYNC_FINISHED',
  SYNC_FAILED: 'SYNC_FAILED',
} as const;

export type SwMessage =
  | { type: typeof SW_MESSAGE.SYNC_FINISHED; result: SyncResult }
  | { type: typeof SW_MESSAGE.SYNC_FAILED; error: string };

export interface SyncResult {
  pushed: number;
  pulled: number;
}

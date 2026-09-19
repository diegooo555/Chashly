import { useLiveQuery } from 'dexie-react-hooks';
import type { AuthResponse } from '@chashly/shared';
import { getMeta } from '../../db/meta';

export type SessionState = AuthResponse | null | 'loading';

export function useSession(): SessionState {
  return useLiveQuery(async () => (await getMeta('session')) ?? null, [], 'loading' as const);
}

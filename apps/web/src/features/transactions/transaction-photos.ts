import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export async function saveTransactionPhoto(transactionId: string, blob: Blob): Promise<void> {
  await db.photos.put({ transactionId, blob, createdAt: Date.now() });
}

export async function deleteTransactionPhoto(transactionId: string): Promise<void> {
  await db.photos.delete(transactionId);
}

function useTransactionPhotoBlob(transactionId: string): Blob | undefined {
  return useLiveQuery(async () => (await db.photos.get(transactionId))?.blob, [transactionId]);
}

/** URL de objeto para mostrar la foto en <img>; se revoca sola cuando cambia o se desmonta. */
export function useTransactionPhotoUrl(transactionId: string): string | undefined {
  const blob = useTransactionPhotoBlob(transactionId);
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

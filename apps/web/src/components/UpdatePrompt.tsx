import { useRegisterSW } from 'virtual:pwa-register/react';

/** Avisa cuando hay una versión nueva del service worker y deja que el usuario decida cuándo aplicarla. */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status">
      <p>{needRefresh ? 'Hay una versión nueva de Chashly.' : 'Chashly ya funciona sin conexión.'}</p>
      <div className="toast__actions">
        {needRefresh && (
          <button type="button" className="button button--primary" onClick={() => void updateServiceWorker(true)}>
            Actualizar
          </button>
        )}
        <button type="button" className="button button--ghost" onClick={close}>
          {needRefresh ? 'Después' : 'Entendido'}
        </button>
      </div>
    </div>
  );
}

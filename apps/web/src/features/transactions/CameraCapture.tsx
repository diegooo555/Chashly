import { useCamera } from './use-camera';

type CameraCaptureProps = {
  onCapture: (photo: File) => void;
  onCancel: () => void;
};

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const { videoRef, status, error, capture } = useCamera();

  async function handleCapture() {
    const photo = await capture();
    if (photo) onCapture(photo);
  }

  return (
    <div className="camera">
      {status === 'error' ? (
        <p className="field__error">{error}</p>
      ) : (
        <video ref={videoRef} className="camera__video" autoPlay playsInline muted aria-label="Vista de la cámara" />
      )}
      <div className="camera__actions">
        <button type="button" className="button button--primary" onClick={handleCapture} disabled={status !== 'ready'}>
          Capturar
        </button>
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

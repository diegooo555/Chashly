import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, type TransactionType } from '@chashly/shared';
import { fromDateInputValue, toDateInputValue } from '../../lib/dates';
import { toMinorUnits } from '../../lib/money';
import { CameraCapture } from './CameraCapture';
import { saveTransactionPhoto } from './transaction-photos';
import { isCameraSupported } from './use-camera';
import { addTransaction } from './transactions-repository';

const DEFAULT_CATEGORY: Record<TransactionType, string> = { expense: 'Alimentación', income: 'Salario' };

export function TransactionFormPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY.expense);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const changeType = (next: TransactionType) => {
    setType(next);
    setCategory(DEFAULT_CATEGORY[next]);
  };

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPhoto(file);
    event.target.value = '';
  }

  function handleTakePhoto() {
    if (isCameraSupported()) setCameraOpen(true);
    else cameraInputRef.current?.click();
  }

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const minor = toMinorUnits(amount);
    if (minor === null) {
      setError('Escribe un monto mayor que cero, por ejemplo 25000.');
      return;
    }
    setSaving(true);
    const id = await addTransaction({ type, amount: minor, category, description, occurredAt: fromDateInputValue(date) });
    if (photo) await saveTransactionPhoto(id, photo);
    navigate(-1);
  }

  return (
    <form className="page form" onSubmit={handleSubmit} noValidate>
      <h1 className="page__title">Registrar movimiento</h1>

      <div className="segmented" role="radiogroup" aria-label="Tipo de movimiento">
        {(['expense', 'income'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={type === option}
            className={`segmented__option segmented__option--${option}`}
            onClick={() => changeType(option)}
          >
            {option === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>

      <label className="field field--amount">
        <span className="field__label">Monto en pesos</span>
        <input
          inputMode="decimal"
          autoFocus
          placeholder="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'amount-error' : undefined}
        />
        {error && (
          <span id="amount-error" className="field__error">
            {error}
          </span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Categoría</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Descripción (opcional)</span>
        <input maxLength={140} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="field">
        <span className="field__label">Fecha</span>
        <input type="date" value={date} max={toDateInputValue()} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <div className="field">
        <span className="field__label">Foto (opcional)</span>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhotoChange} />
        {cameraOpen ? (
          <CameraCapture
            onCapture={(captured) => {
              setPhoto(captured);
              setCameraOpen(false);
            }}
            onCancel={() => setCameraOpen(false)}
          />
        ) : (
          <div className="photo-picker">
            <button type="button" className="button button--ghost" onClick={() => fileInputRef.current?.click()}>
              Subir imagen
            </button>
            <button type="button" className="button button--ghost" onClick={handleTakePhoto}>
              Tomar foto
            </button>
          </div>
        )}
        {photoPreview && <img src={photoPreview} alt="Vista previa de la foto del movimiento" className="field__photo-preview" />}
      </div>

      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={saving}>
          Guardar {type === 'expense' ? 'gasto' : 'ingreso'}
        </button>
        <button type="button" className="button button--ghost" onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </div>
      <p className="form__hint">Se guarda en tu dispositivo al instante y se sube a la nube cuando haya conexión.</p>
    </form>
  );
}

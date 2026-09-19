import { useState, type FormEvent } from 'react';
import { CredentialsSchema } from '@chashly/shared';
import { ApiError } from '../../lib/api-client';
import { useIsOnline } from '../../sync/sync-status';
import { authenticate, type AuthMode } from './auth-service';

export function LoginPage() {
  const online = useIsOnline();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authenticate(mode, parsed.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No hay conexión con el servidor. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <div className="auth">
      <div className="auth__intro">
        <span className="wordmark wordmark--large">Chashly</span>
        <p>Cada peso que entra y sale, en un solo lugar. Sigue funcionando sin internet.</p>
      </div>

      <form className="form auth__form" onSubmit={handleSubmit} noValidate>
        <h1 className="page__title">{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

        {!online && (
          <p className="notice">Necesitas conexión para entrar la primera vez. Después podrás usar Chashly sin internet.</p>
        )}

        <label className="field">
          <span className="field__label">Correo</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Contraseña</span>
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button button--primary" disabled={busy || !online}>
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login');
            setError(null);
          }}
        >
          {isLogin ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}

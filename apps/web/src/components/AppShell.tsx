import { NavLink, Outlet } from 'react-router-dom';
import { logout, pendingChangesCount } from '../features/auth/auth-service';
import { SyncBadge } from './SyncBadge';

const NAV = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/movimientos', label: 'Movimientos', end: false },
  { to: '/presupuestos', label: 'Presupuestos', end: false },
];

async function confirmLogout() {
  const pending = await pendingChangesCount();
  const message = pending
    ? `Tienes ${pending} cambios que aún no están en la nube y se perderán. ¿Cerrar sesión de todos modos?`
    : 'Se borrarán tus datos de este dispositivo. Seguirán guardados en la nube. ¿Cerrar sesión?';
  if (window.confirm(message)) await logout();
}

export function AppShell({ email }: { email: string }) {
  return (
    <div className="shell">
      <header className="shell__header">
        <span className="wordmark">Chashly</span>
        <SyncBadge />
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Principal">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="tabbar__link">
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/nuevo" className="tabbar__add">
          Registrar
        </NavLink>
      </nav>

      <footer className="shell__footer">
        <span>{email}</span>
        <button type="button" className="link-button" onClick={() => void confirmLogout()}>
          Cerrar sesión
        </button>
      </footer>
    </div>
  );
}

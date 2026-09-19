import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { UpdatePrompt } from './components/UpdatePrompt';
import { LoginPage } from './features/auth/LoginPage';
import { useSession } from './features/auth/use-session';
import { BudgetsPage } from './features/budgets/BudgetsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TransactionFormPage } from './features/transactions/TransactionFormPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { startSyncScheduler } from './sync/scheduler';

export function App() {
  const session = useSession();
  const signedIn = session !== 'loading' && session !== null;

  useEffect(() => (signedIn ? startSyncScheduler() : undefined), [signedIn]);

  if (session === 'loading') return null;

  return (
    <BrowserRouter>
      {session === null ? (
        <LoginPage />
      ) : (
        <Routes>
          <Route element={<AppShell email={session.user.email} />}>
            <Route index element={<DashboardPage />} />
            <Route path="movimientos" element={<TransactionsPage />} />
            <Route path="presupuestos" element={<BudgetsPage />} />
            <Route path="nuevo" element={<TransactionFormPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
      <UpdatePrompt />
    </BrowserRouter>
  );
}

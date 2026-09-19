import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './styles/tokens.css';
import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró #root');

// Pide al navegador no borrar IndexedDB bajo presión de espacio (datos offline valiosos).
void navigator.storage?.persist?.();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

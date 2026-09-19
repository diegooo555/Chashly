import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  // El paquete compartido es TypeScript fuente: se empaqueta dentro del build.
  noExternal: ['@chashly/shared'],
});

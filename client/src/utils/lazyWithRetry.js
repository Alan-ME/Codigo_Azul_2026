import { lazy } from 'react';

/**
 * Carga perezosa de componentes React con reintento automático y auto-recarga ante
 * despliegues o actualizaciones de chunks (evita el fallo 404 'Failed to fetch dynamically imported module').
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} componentImport
 * @returns {React.LazyExoticComponent<React.ComponentType<any>>}
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const sessionKey = 'codigo_azul_chunk_reload_attempted';
    try {
      const module = await componentImport();
      // Si la carga fue exitosa, limpiamos cualquier flag previo de reintento
      window.sessionStorage.removeItem(sessionKey);
      return module;
    } catch (error) {
      const hasRefreshed = window.sessionStorage.getItem(sessionKey) === 'true';

      const isDynamicImportError =
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('404');

      if (isDynamicImportError && !hasRefreshed) {
        console.warn('[Vite Lazy] Chunk no encontrado (actualización de build detectada). Sincronizando nueva versión...', error);
        window.sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
        // Devolvemos una promesa que no se resuelve para que Suspense espere la recarga limpia
        return new Promise(() => {});
      }

      // Si ya recargó una vez o es un error de ejecución del componente, propagarlo
      throw error;
    }
  });
}

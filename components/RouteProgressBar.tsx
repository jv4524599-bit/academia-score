'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Barra fina no topo da página que aparece assim que o usuário clica em
// qualquer link interno (ex.: "Ver perfil", "Voltar ao site") e some quando
// a navegação termina. Resolve a sensação de "travou" quando a próxima
// página demora pra carregar -- sem depender de nenhuma lib externa: escuta
// cliques em links internos pra mostrar a barra, e usePathname/useSearchParams
// pra saber quando a navegação terminou (a URL só muda depois que o Next
// recebeu o conteúdo da nova rota).
export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const currentKey = `${pathname}?${searchParams.toString()}`;
  const lastKey = useRef(currentKey);

  // A navegação terminou assim que a URL observada muda.
  useEffect(() => {
    if (lastKey.current !== currentKey) {
      lastKey.current = currentKey;
      setLoading(false);
    }
  }, [currentKey]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Ignora cliques com modificador (abrir em nova aba etc.), botão
      // direito/meio, ou que algum handler já tenha cancelado.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Só mostra a barra para navegação interna de verdade (link externo
      // ou âncora pra mesma página não dispara carregamento de rota).
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setLoading(true);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!loading) return null;
  return (
    <div className="route-progress" role="status" aria-label="Carregando página">
      <div className="route-progress-bar" />
    </div>
  );
}

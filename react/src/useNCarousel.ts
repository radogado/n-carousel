import { useEffect } from 'react';

/**
 * React hook to (re)initialize n-carousel after render.
 *
 * This is a thin wrapper around `window.nCarouselInit()`; it does not fork carousel logic.
 */
export function useNCarousel(
  hostRef: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const init = (window as any).nCarouselInit;
    if (typeof init === 'function') {
      // nCarouselInit(host) initializes carousels *inside* host via querySelectorAll,
      // but querySelectorAll does not include the host element itself.
      // If the host itself is `.n-carousel`, init its parent so the host is discoverable.
      if (host.classList.contains('n-carousel')) {
        init(host.parentElement || document);
      } else {
        init(host);
      }
    }
    // n-carousel does not expose a destroy API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}



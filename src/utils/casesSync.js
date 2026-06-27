import { useEffect, useRef } from 'react';

// Cross-view sync for case data. Every case list keeps its own local copy, so an
// edit made in one view (e.g. a status folder) won't show in another already-open
// view (e.g. All Cases) until that view re-reads from the server. This module:
//   1. lets any mutation broadcast a "cases changed" signal, and
//   2. gives list pages a hook that re-fetches on that signal, on window focus,
//      and when the tab becomes visible again.
// Together with each page's fetch-on-mount, this keeps all views consistent.

const EVENT = 'cases:changed';

// Call after any create / update / delete so other mounted views refresh.
export function notifyCasesChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

// Subscribe a list page to refreshes. `refetch` is called (debounced) when the
// data may have changed elsewhere. Pass `enabled: false` to pause (e.g. while a
// modal is open) if a refetch would be disruptive.
export function useCasesRefresh(refetch, enabled = true) {
  const fnRef = useRef(refetch);
  fnRef.current = refetch;

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fnRef.current?.(), 400);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') trigger(); };

    window.addEventListener(EVENT, trigger);
    window.addEventListener('focus', trigger);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(EVENT, trigger);
      window.removeEventListener('focus', trigger);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);
}

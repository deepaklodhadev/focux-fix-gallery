import { useCallback, useState } from "react";

/**
 * Shared multi-select state machine used by any grid screen.
 * Enter selection mode via a long-press; toggle items on tap while in mode.
 */
export function useSelection() {
  const [mode, setMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const enter = useCallback((firstId: string) => {
    setMode(true);
    setSelected(new Set([firstId]));
  }, []);

  const exit = useCallback(() => {
    setMode(false);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { mode, selected, enter, exit, toggle, clear };
}

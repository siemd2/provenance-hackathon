import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useVerification } from "./verification";

// One shared selection across rail / globe / DAG / findings. selection = {kind, id}
// where kind is 'country' | 'node' | 'anomaly'. Clears when the scenario changes.
const Ctx = createContext(null);

export function SelectionProvider({ children }) {
  const { activeIndex } = useVerification();
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    setSelection(null);
  }, [activeIndex]);

  const select = useCallback((sel) => setSelection(sel), []);
  const clear = useCallback(() => setSelection(null), []);

  return <Ctx.Provider value={{ selection, select, clear }}>{children}</Ctx.Provider>;
}

export const useSelection = () => useContext(Ctx);

import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Collection, DB, Row } from './types';
import { buildSeed, emptyDB } from './data/seed';

/**
 * In-memory data store for the prototype.
 * All data lives in React state only and is lost on reload.
 * To move to Supabase later, replace `upsert` / `remove` with calls to
 * supabase.from(table).upsert(...) / .delete() and load initial state with select().
 */

type Action =
  | { type: 'upsert'; collection: Collection; row: { id: string } }
  | { type: 'remove'; collection: Collection; id: string }
  | { type: 'replace'; db: DB };

function reducer(state: DB, action: Action): DB {
  switch (action.type) {
    case 'upsert': {
      const list = state[action.collection] as { id: string }[];
      const exists = list.some((r) => r.id === action.row.id);
      const next = exists ? list.map((r) => (r.id === action.row.id ? action.row : r)) : [action.row, ...list];
      return { ...state, [action.collection]: next };
    }
    case 'remove': {
      const list = state[action.collection] as { id: string }[];
      return { ...state, [action.collection]: list.filter((r) => r.id !== action.id) };
    }
    case 'replace':
      return action.db;
  }
}

interface StoreValue {
  db: DB;
  upsert: <C extends Collection>(collection: C, row: Row<C>) => void;
  remove: (collection: Collection, id: string) => void;
  loadSample: () => void;
  clearAll: () => void;
  toast: string | null;
  notify: (msg: string) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, dispatch] = useReducer(reducer, undefined, buildSeed);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout((notify as unknown as { t?: number }).t);
    (notify as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      db,
      upsert: (collection, row) => dispatch({ type: 'upsert', collection, row: row as { id: string } }),
      remove: (collection, id) => dispatch({ type: 'remove', collection, id }),
      loadSample: () => dispatch({ type: 'replace', db: buildSeed() }),
      clearAll: () => dispatch({ type: 'replace', db: emptyDB() }),
      toast,
      notify,
    }),
    [db, toast, notify],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore outside provider');
  return v;
};

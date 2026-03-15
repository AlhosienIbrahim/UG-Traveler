import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SK, DEFAULT_REGIONS } from '../constants';
import { getItem, setItem, removeItem } from '../utils/storage';
import { uid } from '../utils/helpers';

const AppDataCtx = createContext(null);

export function AppDataProvider({ children }) {
  const [regions, setRegions] = useState(null);   // null = not yet loaded
  const [drafts, setDrafts] = useState(null);
  const [loading, setLoading] = useState(true);

  const regionsTimer = useRef(null);
  const draftsTimer = useRef(null);

  /* ── Boot: load from IndexedDB ── */
  useEffect(() => {
    Promise.all([getItem(SK.REGIONS), getItem(SK.DRAFTS)])
      .then(([savedRegions, savedDrafts]) => {
        setRegions(savedRegions
          ? [...savedRegions].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
          : DEFAULT_REGIONS
        );
        setDrafts(savedDrafts || []);
      })
      .catch(() => { setRegions(DEFAULT_REGIONS); setDrafts([]); })
      .finally(() => setLoading(false));
  }, []);

  /* ── Debounced saves ── */
  useEffect(() => {
    if (regions === null) return;
    clearTimeout(regionsTimer.current);
    regionsTimer.current = setTimeout(() => setItem(SK.REGIONS, regions).catch(console.error), 800);
    return () => clearTimeout(regionsTimer.current);
  }, [regions]);

  useEffect(() => {
    if (drafts === null) return;
    clearTimeout(draftsTimer.current);
    draftsTimer.current = setTimeout(() => setItem(SK.DRAFTS, drafts).catch(console.error), 800);
    return () => clearTimeout(draftsTimer.current);
  }, [drafts]);

  /* ── Draft CRUD ── */
  const createDraft = (data) => {
    const draft = { id: uid(), passengers: [], regionStatus: {}, createdAt: Date.now(), ...data };
    setDrafts(p => [...p, draft]);
    return draft.id;
  };
  const updateDraft  = (d) => setDrafts(p => p.map(x => x.id === d.id ? d : x));
  const deleteDraft  = (id) => setDrafts(p => p.filter(d => d.id !== id));
  const clearAllDrafts = async () => { await removeItem(SK.DRAFTS); setDrafts([]); };

  return (
    <AppDataCtx.Provider value={{
      regions, setRegions,
      drafts,
      loading,
      createDraft,
      updateDraft,
      deleteDraft,
      clearAllDrafts,
      importDrafts: setDrafts,
    }}>
      {children}
    </AppDataCtx.Provider>
  );
}

export const useAppData = () => useContext(AppDataCtx);

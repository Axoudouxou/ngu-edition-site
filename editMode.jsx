import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminFetch, isAdminLoggedIn } from '@/lib/adminAuth';

const STORAGE_KEY = 'ngu_edit_mode';

const EditContext = createContext({
  canEdit: false,
  editing: false,
  status: '',
  setEditing: () => {},
  saveText: async () => {},
});

export function EditModeProvider({ children }) {
  const queryClient = useQueryClient();
  const [canEdit] = useState(() => isAdminLoggedIn());
  const [editing, setEditingState] = useState(() => {
    try { return isAdminLoggedIn() && sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (_) { return false; }
  });
  const [status, setStatus] = useState('');

  const setEditing = useCallback((on) => {
    setEditingState(on);
    try { sessionStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ngu-edit-on', editing);
    return () => document.body.classList.remove('ngu-edit-on');
  }, [editing]);

  const saveText = useCallback(async (key, value) => {
    setStatus('saving');
    try {
      const res = await adminFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, label: key, section: 'Site' }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      queryClient.setQueryData(['site-content'], (old) => ({ ...(old || {}), [key]: value }));
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? '' : s)), 2500);
    } catch (e) {
      setStatus('error');
      setTimeout(() => setStatus((s) => (s === 'error' ? '' : s)), 4000);
      throw e;
    }
  }, [queryClient]);

  const value = useMemo(() => ({ canEdit, editing, status, setEditing, saveText }), [canEdit, editing, status, setEditing, saveText]);
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEditMode() {
  return useContext(EditContext);
}

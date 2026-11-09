import React from 'react';
import { Pencil, Check, Loader2, AlertCircle } from 'lucide-react';
import { useEditMode } from '@/lib/editMode';

export default function EditBar() {
  const { canEdit, editing, setEditing, status } = useEditMode();
  if (!canEdit) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-full bg-primary text-primary-foreground shadow-lg px-5 py-3 text-sm max-w-[92vw]">
      {editing ? (
        <>
          <span className="hidden sm:inline">Mode édition : cliquez sur un texte pour le modifier</span>
          <span className="sm:hidden">Mode édition</span>
          {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'saved' && <span className="inline-flex items-center gap-1 text-secondary"><Check className="w-4 h-4" />Enregistré</span>}
          {status === 'error' && <span className="inline-flex items-center gap-1 text-red-300"><AlertCircle className="w-4 h-4" />Non enregistré</span>}
          <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-primary-foreground text-primary font-semibold px-4 py-1.5">
            Terminer
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 font-semibold">
          <Pencil className="w-4 h-4" /> Modifier le site
        </button>
      )}
    </div>
  );
}

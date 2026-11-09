import React, { useState } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useEditMode } from '@/lib/editMode';

/**
 * Texte modifiable du site.
 * - Pour les visiteurs : affiche le texte enregistré (clé k), sinon le texte d'origine (fallback).
 * - Pour l'administrateur en « mode édition » : on clique sur le texte, on le modifie, il s'enregistre en quittant le champ.
 */
export default function T({ k, fallback = '', as: Tag = 'span', multiline = false, className = '', ...rest }) {
  const content = useSiteContent();
  const { editing, saveText } = useEditMode();
  const [version, setVersion] = useState(0);

  const stored = content[k];
  const value = stored === undefined || stored === null || stored === '' ? fallback : stored;
  const lines = multiline ? 'whitespace-pre-line ' : '';

  if (!editing) {
    return <Tag className={`${lines}${className}`.trim()} {...rest}>{value}</Tag>;
  }

  const onBlur = async (e) => {
    const text = e.currentTarget.innerText.replace(/\u00a0/g, ' ').trim();
    if (text === String(value).trim()) return;
    if (!text) { setVersion((v) => v + 1); return; } // texte vide : on garde l'ancien
    try { await saveText(k, text); } catch (_) { setVersion((v) => v + 1); }
  };

  return (
    <Tag
      key={version}
      className={`${lines}${className} ngu-editable`.trim()}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-ngu-key={k}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.currentTarget.blur(); }
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
      }}
      onBlur={onBlur}
      {...rest}
    >
      {value}
    </Tag>
  );
}

import React, { useRef, useState } from 'react';
import { CheckCircle, Loader2, Upload } from 'lucide-react';
import { Badge, Chips, ErrorNote, Field, Page, Panel, SearchBox, Spinner, Table, btn, inputCls, useLoad, Empty } from './ui';
import { api, fcfa } from './api';
import { readXlsx, sheetToCatalogue } from './xlsxRead';

const readBuffer = (file) =>
  file.arrayBuffer
    ? file.arrayBuffer()
    : new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsArrayBuffer(file); });

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function ImportPanel({ onDone }) {
  const input = useRef(null);
  const [stage, setStage] = useState('idle'); // idle | reading | preview | saving | done
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [publisher, setPublisher] = useState('NEI-CEDA');
  const [replace, setReplace] = useState(true);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async (nextRows, nextPublisher, nextReplace, dryRun) =>
    api('/api/admin/v2/catalog/import', { method: 'POST', body: { rows: nextRows, publisher: nextPublisher, replace: nextReplace, dry_run: dryRun } });

  const reset = () => { setStage('idle'); setRows([]); setPreview(null); setError(''); setFileName(''); if (input.current) input.current.value = ''; };

  const choose = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setFileName(file.name); setStage('reading');
    try {
      const parsed = sheetToCatalogue(readXlsx(await readBuffer(file)));
      if (parsed.length === 0) throw new Error('Le fichier ne contient aucune ligne de livre.');
      setRows(parsed);
      setPreview(await run(parsed, publisher, replace, true));
      setStage('preview');
    } catch (err) {
      setError(err.message || 'Lecture impossible.');
      setStage('idle');
    }
  };

  const refresh = async (nextPublisher, nextReplace) => {
    setError('');
    try { setPreview(await run(rows, nextPublisher, nextReplace, true)); } catch (err) { setError(err.message); }
  };

  const apply = async () => {
    setStage('saving'); setError('');
    try {
      setResult(await run(rows, publisher, replace, false));
      setStage('done');
      onDone();
    } catch (err) {
      setError(err.message); setStage('preview');
    }
  };

  return (
    <Panel className="p-5 mb-8">
      <input ref={input} type="file" accept=".xlsx" className="sr-only" aria-label="Fichier Excel du catalogue" onChange={choose} />
      <ErrorNote>{error}</ErrorNote>

      {(stage === 'idle' || stage === 'reading') && (
        <div className="flex flex-wrap items-center gap-4">
          <button className={btn.primary} disabled={stage === 'reading'} onClick={() => input.current?.click()}>
            {stage === 'reading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Importer un fichier Excel
          </button>
          <p className="text-sm text-[#6B7468] max-w-xl">
            Le fichier doit avoir les colonnes « Code », « Titre » et « Prix de vente » (celles du fichier catalogue-nei-ceda). Un aperçu s'affiche avant toute modification.
          </p>
        </div>
      )}

      {(stage === 'preview' || stage === 'saving') && preview && (
        <div className="space-y-5">
          <p className="text-sm"><span className="font-medium">{fileName}</span> : {preview.total} références lues.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Maison d'édition">
              <input className={inputCls} value={publisher} onChange={(e) => setPublisher(e.target.value)} onBlur={() => refresh(publisher, replace)} />
            </Field>
            <label className="flex items-start gap-3 text-sm pt-6">
              <input type="checkbox" checked={replace} onChange={(e) => { setReplace(e.target.checked); refresh(publisher, e.target.checked); }} className="mt-1 h-4 w-4" />
              <span>Retirer du site les références de cette maison d'édition qui ne sont plus dans le fichier</span>
            </label>
          </div>
          <ul className="text-sm space-y-1">
            <li><strong>{preview.added}</strong> nouvelle{preview.added > 1 ? 's' : ''}</li>
            <li><strong>{preview.updated}</strong> modifiée{preview.updated > 1 ? 's' : ''} (titre, prix…)</li>
            <li><strong>{preview.unchanged}</strong> inchangée{preview.unchanged > 1 ? 's' : ''}</li>
            <li><strong>{preview.removed}</strong> retirée{preview.removed > 1 ? 's' : ''} du site</li>
            {preview.invalid_count > 0 && <li className="text-[#9B2C2C]"><strong>{preview.invalid_count}</strong> ligne{preview.invalid_count > 1 ? 's' : ''} ignorée{preview.invalid_count > 1 ? 's' : ''}</li>}
          </ul>
          {preview.invalid_count > 0 && (
            <div className="text-xs text-[#6B7468] bg-[#FAF9F5] rounded-lg p-3 max-h-40 overflow-auto">
              {preview.invalid.slice(0, 15).map((i, k) => <p key={k}>Ligne {i.row}{i.code ? ` (${i.code})` : ''} : {i.reason}</p>)}
              {preview.invalid_count > 15 && <p>… et {preview.invalid_count - 15} autres.</p>}
              {preview.invalid.some((i) => /prix de vente/.test(i.reason)) && <p className="mt-2">Prix absents : ouvrez le fichier dans Excel, enregistrez-le, puis réimportez-le (les prix de vente sont calculés par Excel).</p>}
            </div>
          )}
          <div className="flex gap-3">
            <button className={btn.primary} disabled={stage === 'saving' || preview.total === 0} onClick={apply}>
              {stage === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />} Importer maintenant
            </button>
            <button className={btn.ghost} disabled={stage === 'saving'} onClick={reset}>Annuler</button>
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[#2F6B3F] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Import terminé.</p>
            <p className="text-[#6B7468]">{result.added} ajoutée{result.added > 1 ? 's' : ''}, {result.updated} modifiée{result.updated > 1 ? 's' : ''}, {result.removed} retirée{result.removed > 1 ? 's' : ''} du site.</p>
            <button className={`${btn.ghost} mt-3`} onClick={reset}>Importer un autre fichier</button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export default function OnOrder() {
  const state = useLoad(() => api('/api/admin/v2/catalog'));
  const [q, setQ] = useState('');
  const [view, setView] = useState('all');
  const [shown, setShown] = useState(50);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const items = state.data?.items || [];
  const counts = state.data?.counts || { total: 0, active: 0, hidden: 0 };
  const query = norm(q).split(/\s+/).filter(Boolean);
  const list = items.filter((i) => {
    if (view === 'active' && !i.active) return false;
    if (view === 'hidden' && i.active) return false;
    const hay = norm(`${i.title} ${i.code} ${i.rubrique} ${i.sous_rubrique} ${i.collection} ${i.catalogue}`);
    return query.every((t) => hay.includes(t));
  });

  const toggle = async (item) => {
    setBusy(item.code); setError('');
    try { await api(`/api/admin/v2/catalog/${encodeURIComponent(item.code)}/active`, { method: 'POST', body: { active: !item.active } }); state.reload(); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  return (
    <Page title="Sur commande" subtitle="Le catalogue d'un éditeur partenaire. Ces livres ne s'achètent pas en ligne : le client envoie une demande sur WhatsApp depuis la page Catalogue du site.">
      <ImportPanel onDone={state.reload} />
      <ErrorNote>{state.error || error}</ErrorNote>
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <Chips value={view} onChange={(v) => { setView(v); setShown(50); }} options={[
          { value: 'all', label: 'Toutes', count: counts.total }, { value: 'active', label: 'En ligne', count: counts.active }, { value: 'hidden', label: 'Masquées', count: counts.hidden },
        ]} />
        <div className="flex-1 min-w-[220px]"><SearchBox value={q} onChange={(v) => { setQ(v); setShown(50); }} placeholder="Rechercher un titre ou un code" /></div>
      </div>
      {state.loading ? <Spinner /> : list.length === 0 ? (
        <Panel><Empty>{items.length ? 'Aucune référence ne correspond.' : "Aucune référence pour l'instant. Importez le fichier Excel pour commencer."}</Empty></Panel>
      ) : (
        <>
          <Table head={['Code', 'Titre', 'Classement', "Prix d'achat", 'Prix de vente', 'Site']}>
            {list.slice(0, shown).map((i) => (
              <tr key={i.code}>
                <td className="px-4 py-3 text-xs text-[#6B7468] whitespace-nowrap">{i.code}</td>
                <td className="px-4 py-3"><p className="font-medium">{i.title}</p><p className="text-xs text-[#7B8478]">{i.publisher}</p></td>
                <td className="px-4 py-3 text-xs text-[#6B7468]">{[i.rubrique, i.sous_rubrique || i.collection, i.level].filter(Boolean).join(' · ')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[#6B7468]">{fcfa(i.supplier_price)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{fcfa(i.price)}</td>
                <td className="px-4 py-3">
                  <button disabled={busy === i.code} onClick={() => toggle(i)} aria-label={i.active ? `Masquer ${i.title}` : `Remettre ${i.title} en ligne`}>
                    <Badge tone={i.active ? 'green' : 'grey'}>{i.active ? 'En ligne' : 'Masquée'}</Badge>
                  </button>
                </td>
              </tr>
            ))}
          </Table>
          <div className="flex items-center justify-between mt-4 text-sm text-[#6B7468]">
            <span>{Math.min(shown, list.length)} sur {list.length}</span>
            {shown < list.length && <button className={btn.ghost} onClick={() => setShown(shown + 100)}>Afficher plus</button>}
          </div>
        </>
      )}
    </Page>
  );
}

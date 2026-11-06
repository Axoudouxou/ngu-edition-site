import React, { useRef, useState } from 'react';
import { CheckCircle, Loader2, Upload } from 'lucide-react';
import { Badge, Chips, ErrorNote, Field, Page, Panel, SearchBox, Spinner, Table, btn, inputCls, useLoad, Empty } from './ui';
import { unzipSync } from 'fflate';
import { api, fcfa, shrinkImage, uploadMany } from './api';
import { readXlsx, sheetToCatalogue } from './xlsxRead';

const API = 'https://payment.nguedition.com';

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

function CoversPanel({ onDone }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const choose = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setBusy(true); setError(''); setResult(null); setProgress('Lecture des fichiers…');
    try {
      const images = [];
      for (const file of picked) {
        if (/\.zip$/i.test(file.name)) {
          const entries = unzipSync(new Uint8Array(await readBuffer(file)));
          for (const [path, bytes] of Object.entries(entries)) {
            const name = path.split('/').pop();
            if (!name || name.startsWith('.') || path.includes('__MACOSX') || !/\.(jpe?g|png|webp)$/i.test(name)) continue;
            const type = /png$/i.test(name) ? 'image/png' : /webp$/i.test(name) ? 'image/webp' : 'image/jpeg';
            images.push(new File([bytes], name, { type }));
          }
        } else {
          images.push(file);
        }
      }
      if (images.length === 0) throw new Error("Aucune image trouvée. Envoie des photos JPEG, PNG ou WebP, ou un ZIP qui en contient, nommées d'après le code du livre.");
      let saved = 0; const unknown = []; const invalid = [];
      for (let i = 0; i < images.length; i += 12) {
        setProgress(`Envoi ${Math.min(i + 12, images.length)} / ${images.length}…`);
        const batch = await Promise.all(images.slice(i, i + 12).map((f) => shrinkImage(f, 700, 0.85)));
        const r = await uploadMany('/api/admin/v2/catalog/covers', batch);
        saved += r.saved; unknown.push(...r.unknown); invalid.push(...r.invalid);
      }
      setResult({ total: images.length, saved, unknown, invalid });
      onDone();
    } catch (err) {
      setError(err.message || 'Envoi impossible.');
    } finally {
      setBusy(false); setProgress('');
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Panel className="p-5 mb-8">
      <input ref={input} type="file" accept=".zip,image/jpeg,image/png,image/webp" multiple className="sr-only" aria-label="Photos des couvertures" onChange={choose} />
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap items-center gap-4">
        <button className={btn.ghost} disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Ajouter des couvertures
        </button>
        <p className="text-sm text-[#6B7468] max-w-xl">
          Choisis des photos, ou un fichier ZIP, <strong>nommées d'après le code du livre</strong> (par exemple 1PRE2084.jpg). Elles remplacent les couvertures générées.
        </p>
      </div>
      {busy && progress && <p className="text-sm mt-3">{progress}</p>}
      {result && (
        <div className="text-sm mt-4 space-y-1">
          <p><strong>{result.saved}</strong> couverture{result.saved > 1 ? 's' : ''} ajoutée{result.saved > 1 ? 's' : ''} sur {result.total} image{result.total > 1 ? 's' : ''}.</p>
          {result.unknown.length > 0 && <p className="text-[#9B2C2C]">{result.unknown.length} fichier{result.unknown.length > 1 ? 's' : ''} ne correspond{result.unknown.length > 1 ? 'ent' : ''} à aucun code : {result.unknown.slice(0, 8).join(', ')}{result.unknown.length > 8 ? '…' : ''}</p>}
          {result.invalid.length > 0 && <p className="text-[#9B2C2C]">Refusées : {result.invalid.slice(0, 5).map((i) => `${i.name} (${i.reason})`).join(' ; ')}</p>}
        </div>
      )}
    </Panel>
  );
}

function DeletePanel({ total, onDone }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const run = async () => {
    setBusy(true); setError('');
    try {
      const r = await api('/api/admin/v2/catalog/delete-all', { method: 'POST', body: { confirm: typed } });
      setDone(r.deleted); setOpen(false); setTyped(''); onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done !== null && total === 0) {
    return <p className="mt-10 text-sm text-[#6B7468]">Catalogue supprimé : {done} référence{done > 1 ? 's' : ''} retirée{done > 1 ? 's' : ''}.</p>;
  }
  if (total === 0) return null;
  return (
    <Panel className="p-5 mt-10 border-[#E8CFCF]">
      <h3 className="font-medium mb-1">Supprimer le catalogue</h3>
      <p className="text-sm text-[#6B7468] mb-4 max-w-xl">
        Retire définitivement les {total} références importées et leurs couvertures. Tes livres NGU, les commandes et les auteurs ne sont pas touchés.
        Tu pourras réimporter un fichier ensuite.
      </p>
      {!open ? (
        <button className={btn.danger} onClick={() => setOpen(true)}>Supprimer tout le catalogue</button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <ErrorNote>{error}</ErrorNote>
          <Field label="Pour confirmer, tape SUPPRIMER">
            <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" aria-label="Confirmation de suppression" />
          </Field>
          <div className="flex gap-3">
            <button className={btn.danger} disabled={busy || typed !== 'SUPPRIMER'} onClick={run}>
              {busy && <Loader2 className="w-4 h-4 animate-spin inline mr-1" />}Supprimer définitivement
            </button>
            <button className={btn.ghost} disabled={busy} onClick={() => { setOpen(false); setTyped(''); setError(''); }}>Annuler</button>
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
      <CoversPanel onDone={state.reload} />
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
                <td className="px-4 py-3 text-xs text-[#6B7468] whitespace-nowrap"><span className="inline-flex items-center gap-2">{i.cover ? <img src={`${API}/api/catalog/cover/${encodeURIComponent(i.code)}`} alt="" loading="lazy" className="w-6 h-9 object-cover rounded-sm" /> : <span className="w-6 h-9 rounded-sm bg-[#EDEAE0]" />}{i.code}</span></td>
                <td className="px-4 py-3"><p className="font-medium">{i.title}</p><p className="text-xs text-[#7B8478]">{i.author ? `${i.author} · ` : ''}{i.publisher}</p></td>
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
      <DeletePanel total={counts.total} onDone={state.reload} />
    </Page>
  );
}

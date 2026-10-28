import React, { useEffect, useState } from 'react';
import { Download, Loader2, Mail, MessageCircle } from 'lucide-react';
import { Badge, Chips, Drawer, Empty, ErrorNote, Page, Panel, Spinner, Table, btn, inputCls, useLoad } from './ui';
import { api, downloadFile, fmtDate, waLink } from './api';

const STATUS = {
  nouvelle: { label: 'Nouvelle', tone: 'ochre' },
  en_lecture: { label: 'En lecture', tone: 'grey' },
  retenue: { label: 'Retenue', tone: 'green' },
  declinee: { label: 'Déclinée', tone: 'red' },
};
const size = (b) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`);

function Detail({ item, onChanged, onClosed }) {
  const [note, setNote] = useState(item.note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setNote(item.note || ''); }, [item.id, item.note]);
  const base = `/api/admin/v2/submissions/${item.id}`;

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); onChanged(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-7">
      <ErrorNote>{error}</ErrorNote>
      <dl className="text-sm">
        {[['Auteur', `${item.first_name} ${item.last_name}`], ['Email', item.email], ['Téléphone', item.phone], ['Reçue le', fmtDate(item.date)], ['Document', `${item.file_name} (${size(item.size)})`]].map(([l, v]) => (
          <div key={l} className="flex gap-4 py-2.5 border-b border-[#F0EEE7] last:border-0">
            <dt className="w-28 shrink-0 text-[#7B8478]">{l}</dt><dd className="flex-1 break-words">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        <button className={btn.primary} disabled={busy} onClick={() => run(() => downloadFile(`${base}/file`, item.file_name))}><Download className="w-4 h-4" /> Télécharger le PDF</button>
        <a className={btn.ghost} href={`mailto:${item.email}?subject=${encodeURIComponent('Votre proposition à Never Give Up Édition')}`}><Mail className="w-4 h-4" /> Écrire</a>
        <a className={btn.ghost} href={waLink(item.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Suivi</h3>
        <Chips value={item.status} onChange={(v) => run(() => api(base, { method: 'POST', body: { status: v } }))} options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))} />
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F] mb-2">Note interne</h3>
        <textarea className={`${inputCls} min-h-[90px]`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible uniquement par l'équipe" />
        <button className={`${btn.ghost} mt-2`} disabled={busy || note === (item.note || '')} onClick={() => run(() => api(base, { method: 'POST', body: { note } }))}>Enregistrer la note</button>
      </div>

      <div className="border-t border-[#E4E1D8] pt-5">
        <button className={btn.danger} disabled={busy} onClick={() => { if (confirm('Supprimer cette proposition et son document ?')) run(async () => { await api(base, { method: 'DELETE' }); onClosed(); }); }}>
          {busy && <Loader2 className="w-4 h-4 animate-spin inline mr-1" />}Supprimer cette proposition
        </button>
      </div>
    </div>
  );
}

export default function Submissions() {
  const state = useLoad(() => api('/api/admin/v2/submissions'));
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState(null);

  const all = state.data?.items || [];
  const counts = state.data?.counts || {};
  const items = all.filter((i) => status === 'all' || i.status === status);
  const current = all.find((i) => i.id === openId);

  return (
    <Page title="Propositions" subtitle="Les livres envoyés par les auteurs depuis la page « Publier avec NGU ».">
      <div className="mb-6">
        <Chips value={status} onChange={setStatus} options={[
          { value: 'all', label: 'Toutes', count: counts.all },
          ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label === 'Nouvelle' ? 'Nouvelles' : s.label + (value === 'retenue' || value === 'declinee' ? 's' : ''), count: counts[value] })),
        ]} />
      </div>
      <ErrorNote>{state.error}</ErrorNote>
      {state.loading ? <Spinner /> : items.length === 0 ? (
        <Panel><Empty>{all.length ? 'Aucune proposition dans cette catégorie.' : "Aucune proposition pour l'instant."}</Empty></Panel>
      ) : (
        <Table head={['Reçue le', 'Auteur', 'Document', 'Suivi']}>
          {items.map((i) => (
            <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer hover:bg-[#FAF9F5]">
              <td className="px-4 py-3 whitespace-nowrap text-[#6B7468]">{fmtDate(i.date)}</td>
              <td className="px-4 py-3"><p className="font-medium">{i.first_name} {i.last_name}</p><p className="text-xs text-[#7B8478]">{i.email} · {i.phone}</p></td>
              <td className="px-4 py-3"><p>{i.file_name}</p><p className="text-xs text-[#7B8478]">{size(i.size)}</p></td>
              <td className="px-4 py-3"><Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge></td>
            </tr>
          ))}
        </Table>
      )}
      <Drawer open={!!current} onClose={() => setOpenId(null)} title={current ? `${current.first_name} ${current.last_name}` : ''}>
        {current && <Detail item={current} onChanged={state.reload} onClosed={() => { setOpenId(null); state.reload(); }} />}
      </Drawer>
    </Page>
  );
}

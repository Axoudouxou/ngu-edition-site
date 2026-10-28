import React from 'react';
import { Download } from 'lucide-react';
import { Empty, ErrorNote, Page, Panel, Spinner, Table, btn, useLoad } from './ui';
import { api, downloadCsv, fmtDate } from './api';

export default function Newsletter() {
  const state = useLoad(() => api('/api/admin/v2/subscribers'));
  const items = state.data?.items || [];

  const exportCsv = () =>
    downloadCsv(`abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Email', 'Date d\'inscription'],
      ...items.map((s) => [s.email, s.date]),
    ]);

  return (
    <Page
      title="Newsletter"
      subtitle="Les personnes qui se sont inscrites depuis le site pour recevoir vos nouvelles parutions."
      actions={<button className={btn.ghost} onClick={exportCsv} disabled={!items.length}><Download className="w-4 h-4" /> Exporter</button>}
    >
      <ErrorNote>{state.error}</ErrorNote>
      {state.loading ? <Spinner /> : items.length === 0 ? (
        <Panel><Empty>Aucun inscrit pour l'instant.</Empty></Panel>
      ) : (
        <>
          <p className="text-sm text-[#6B7468] mb-4">{state.data.total} inscrit{state.data.total > 1 ? 's' : ''}</p>
          <Table head={['Email', 'Inscrit le']}>
            {items.map((s) => (
              <tr key={s.email}>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-[#6B7468]">{fmtDate(s.date)}</td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </Page>
  );
}

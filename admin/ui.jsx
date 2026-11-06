import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-md bg-[#20392D] px-4 py-2 text-sm font-medium text-[#F7F6F2] transition-colors hover:bg-[#2D4D3D] disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-md border border-[#D9D5C9] bg-white px-4 py-2 text-sm font-medium text-[#20392D] transition-colors hover:bg-[#F1EFE8] disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'text-sm font-medium text-[#8A5F1F] hover:underline disabled:opacity-50',
  danger: 'text-sm text-[#A33B2F] hover:underline disabled:opacity-50',
};

export const inputCls =
  'w-full rounded-md border border-[#D9D5C9] bg-white px-3 py-2 text-sm text-[#20392D] placeholder:text-[#9AA096] focus:outline-none focus:border-[#20392D]';

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await fn());
    } catch (e) {
      setError(e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

export function Page({ title, subtitle, actions, children }) {
  return (
    <div className="px-5 sm:px-8 py-8 md:py-10 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-editorial text-3xl md:text-4xl font-medium text-[#20392D]">{title}</h1>
          {subtitle && <p className="text-sm text-[#6B7468] mt-1.5 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Section({ title, hint, actions, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A5F1F]">{title}</h2>
          {hint && <p className="text-xs text-[#7B8478] mt-1">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className = '' }) {
  return <div className={`bg-white border border-[#E4E1D8] rounded-lg ${className}`}>{children}</div>;
}

const TONES = {
  green: 'bg-[#E3EDE6] text-[#20392D]',
  ochre: 'bg-[#F4E9D3] text-[#8A5F1F]',
  grey: 'bg-[#ECEAE3] text-[#5A6258]',
  red: 'bg-[#F5DEDA] text-[#A33B2F]',
};
export function Badge({ tone = 'grey', children }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export const STATUS = {
  paid: { label: 'Payée', tone: 'green' },
  pending: { label: 'En attente', tone: 'ochre' },
  refunded: { label: 'Remboursée', tone: 'grey' },
};
export const FULFILLMENT = {
  a_livrer: { label: 'À livrer', tone: 'ochre' },
  livree: { label: 'Livrée', tone: 'green' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'grey' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === o.value ? 'bg-[#20392D] text-[#F7F6F2]' : 'border border-[#D9D5C9] bg-white text-[#4B5A51] hover:bg-[#F1EFE8]'
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className={`ml-1.5 ${value === o.value ? 'opacity-70' : 'text-[#8A9188]'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9188]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pl-9`}
      />
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#4B5A51] mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[#7B8478] mt-1.5">{hint}</span>}
    </label>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-[#7B8478] text-center py-10">{children}</p>;
}

export function Spinner() {
  return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#8A9188]" /></div>;
}

export function ErrorNote({ children }) {
  return children ? <p className="text-sm text-[#A33B2F] mb-4">{children}</p> : null;
}

export function Drawer({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#20392D]/40" onClick={onClose} />
      <aside className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white h-full overflow-y-auto shadow-xl`} role="dialog" aria-label={title}>
        <div className="sticky top-0 bg-white border-b border-[#E4E1D8] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-editorial text-2xl font-medium text-[#20392D]">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-[#6B7468] hover:text-[#20392D]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </aside>
    </div>
  );
}

export function Table({ head, children, className = '' }) {
  return (
    <Panel className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.1em] text-[#7B8478] border-b border-[#E4E1D8]">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-3 font-medium whitespace-nowrap ${h.right ? 'text-right' : ''}`}>{h.label ?? h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EEE7]">{children}</tbody>
      </table>
    </Panel>
  );
}

export function Stat({ label, value, hint, strong }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7B8478] mb-1.5">{label}</p>
      <p className={`font-editorial ${strong ? 'text-4xl' : 'text-3xl'} font-medium text-[#20392D] leading-none`}>{value}</p>
      {hint && <p className="text-xs text-[#7B8478] mt-2">{hint}</p>}
    </div>
  );
}

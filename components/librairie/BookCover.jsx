import React from 'react';

const API_BASE = 'https://payment.nguedition.com';
const COLORS = ['#2F4A2A', '#8A3B2A', '#1F3A5F', '#A9722A', '#5A3B66', '#2A5A58', '#7A2F3E'];

export const colorFor = (seed) => {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
};

/** La vraie couverture si on l'a, sinon une couverture générée (couleur de l'étagère, titre, auteur). */
export default function BookCover({ item, tone, large = false }) {
  if (item.cover) {
    return <img src={`${API_BASE}${item.cover}`} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full text-white flex flex-col justify-between" style={{ background: tone || colorFor(item.catalogue + item.rubrique), padding: large ? '18px 14px 14px 22px' : '10px 7px 8px 13px' }}>
      <div>
        <p className={`font-editorial font-bold leading-[1.08] ${large ? 'text-2xl' : 'text-[13px] line-clamp-5'}`}>{item.title}</p>
        <span className="block h-[2px] w-5 bg-[#C9A15A] mt-1.5" />
      </div>
      {item.author && <p className={`opacity-85 leading-tight ${large ? 'text-sm' : 'text-[9px] line-clamp-2'}`}>{item.author}</p>}
    </div>
  );
}

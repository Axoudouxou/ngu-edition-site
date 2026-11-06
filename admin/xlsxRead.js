import { unzipSync, strFromU8 } from 'fflate';

// Lecture d'un classeur Excel (.xlsx) dans le navigateur : première feuille, valeurs affichées (les formules gardent leur dernier résultat calculé).

const colIndex = (ref) => {
  const letters = /^([A-Z]+)/.exec(ref)[1];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const parseXml = (text) => new DOMParser().parseFromString(text, 'application/xml');
const textOf = (el) => Array.from(el.getElementsByTagName('t')).map((t) => t.textContent).join('');

/** Renvoie un tableau de lignes : grid[numéroDeLigne - 1][indexDeColonne]. */
export function readXlsx(buffer) {
  let files;
  try {
    files = unzipSync(new Uint8Array(buffer));
  } catch (_) {
    throw new Error("Ce fichier n'est pas un classeur Excel (.xlsx).");
  }
  const get = (path) => (files[path] ? strFromU8(files[path]) : null);

  let sheetPath = null;
  const workbook = get('xl/workbook.xml');
  const rels = get('xl/_rels/workbook.xml.rels');
  if (workbook && rels) {
    const sheet = parseXml(workbook).getElementsByTagName('sheet')[0];
    const rid = sheet && sheet.getAttribute('r:id');
    const rel = Array.from(parseXml(rels).getElementsByTagName('Relationship')).find((r) => r.getAttribute('Id') === rid);
    if (rel) {
      const target = rel.getAttribute('Target') || '';
      sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    }
  }
  if (!sheetPath || !files[sheetPath]) {
    sheetPath = Object.keys(files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort()[0];
  }
  if (!sheetPath) throw new Error("Ce fichier n'est pas un classeur Excel (.xlsx).");

  const shared = [];
  const sharedXml = get('xl/sharedStrings.xml');
  if (sharedXml) for (const si of Array.from(parseXml(sharedXml).getElementsByTagName('si'))) shared.push(textOf(si));

  const grid = [];
  for (const rowEl of Array.from(parseXml(get(sheetPath)).getElementsByTagName('row'))) {
    const number = Number(rowEl.getAttribute('r')) || grid.length + 1;
    const cells = [];
    for (const c of Array.from(rowEl.getElementsByTagName('c'))) {
      const type = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0];
      let value = null;
      if (type === 's') value = v ? (shared[Number(v.textContent)] ?? null) : null;
      else if (type === 'inlineStr') value = textOf(c);
      else if (type === 'str') value = v ? v.textContent : null;
      else if (type === 'b') value = v ? v.textContent === '1' : null;
      else if (type === 'e') value = null;
      else if (v && v.textContent !== '') value = Number(v.textContent);
      const ref = c.getAttribute('r');
      cells[ref ? colIndex(ref) : cells.length] = value;
    }
    grid[number - 1] = cells;
  }
  return grid;
}

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

const TEXT_COLUMNS = {
  catalogue: 'catalogue', rubrique: 'rubrique', sous_rubrique: 'sous rubrique', collection: 'collection',
  level: 'niveau', audience: 'public', approval: 'agrement', also_in: 'aussi classe dans',
};

/** Transforme la feuille en lignes prêtes à envoyer au serveur. Les colonnes sont reconnues par leur titre, dans n'importe quel ordre. */
export function sheetToCatalogue(grid) {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    if (grid[i] && grid[i].some((c) => norm(c) === 'code')) { headerIndex = i; break; }
  }
  if (headerIndex < 0) throw new Error('Colonne « Code » introuvable : le fichier doit contenir une ligne d’en-têtes avec « Code », « Titre » et « Prix de vente ».');
  const header = Array.from(grid[headerIndex], norm);
  const at = (test) => header.findIndex(test);
  const idx = {
    code: at((h) => h === 'code'),
    title: at((h) => h === 'titre'),
    price: at((h) => h.startsWith('prix de vente')),
    supplier_price: at((h) => h.startsWith('prix nei') || h.startsWith('prix d achat') || h.startsWith('prix achat')),
  };
  for (const [key, name] of Object.entries(TEXT_COLUMNS)) idx[key] = at((h) => h === name);
  const missing = [];
  if (idx.code < 0) missing.push('Code');
  if (idx.title < 0) missing.push('Titre');
  if (idx.price < 0) missing.push('Prix de vente');
  if (missing.length) throw new Error(`Colonne(s) introuvable(s) : ${missing.join(', ')}.`);

  const rows = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const r = grid[i];
    if (!r) continue;
    const get = (key) => (idx[key] >= 0 && r[idx[key]] != null ? r[idx[key]] : '');
    if (!String(get('code')).trim() && !String(get('title')).trim()) continue;
    const row = { _row: i + 1, code: String(get('code')).trim(), title: get('title'), price: get('price'), supplier_price: get('supplier_price') };
    for (const key of Object.keys(TEXT_COLUMNS)) row[key] = get(key);
    rows.push(row);
  }
  return rows;
}

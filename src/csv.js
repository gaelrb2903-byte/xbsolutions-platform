// Parser CSV minimo pero robusto: maneja comillas, comas dentro de comillas,
// saltos de linea escapados y comillas dobles ("").
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((v) => v.trim() !== '')) rows.push(row);
  }
  return rows;
}

// Mapea encabezados flexibles (acentos/variantes) a nuestras columnas.
const HEADER_MAP = {
  nombre: 'name', name: 'name', negocio: 'name',
  contacto: 'contact', contact: 'contact',
  telefono: 'phone', 'teléfono': 'phone', phone: 'phone', tel: 'phone', celular: 'phone',
  categoria: 'category', 'categoría': 'category', category: 'category', giro: 'category',
};

const norm = (s) => String(s || '').trim().toLowerCase();

// Convierte el CSV en objetos {name, contact, phone, category}.
export function csvToBusinesses(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const header = rows[0].map(norm);
  const cols = header.map((h) => HEADER_MAP[h] || null);
  const hasKnownHeader = cols.some(Boolean);

  const dataRows = hasKnownHeader ? rows.slice(1) : rows;
  // Sin encabezado reconocido, asumimos el orden pedido: nombre, contacto, telefono, categoria.
  const order = hasKnownHeader ? cols : ['name', 'contact', 'phone', 'category'];

  return dataRows.map((r) => {
    const obj = { name: '', contact: '', phone: '', category: '' };
    order.forEach((key, i) => { if (key) obj[key] = (r[i] || '').trim(); });
    return obj;
  }).filter((b) => b.name || b.phone);
}

// Normaliza un teléfono a solo dígitos para deduplicar de forma confiable.
// "(442) 123-4567", "442 123 4567" y "4421234567" colapsan al mismo valor.
// Si trae lada de pais mexicana (52) de 12 digitos, la recorta a 10.
export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith('521')) digits = digits.slice(3);
  return digits;
}

export function formatPhone(raw) {
  const d = normalizePhone(raw);
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return raw || '';
}

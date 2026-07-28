// El guion generado por Gemini trae el marcador literal {{vendedor}} en vez de
// un nombre (para no tener que regenerar con IA cada vez que lo ve un vendedor
// distinto). Aquí se sustituye por el nombre de quien tiene la sesión iniciada.
export function fillScriptVendedor(script, vendorName) {
  if (!script) return script;
  return script.replaceAll('{{vendedor}}', vendorName || 'tu asesor de wxbsolutions');
}

// Gemini a veces devuelve énfasis en Markdown (**negrita**, viñetas "* ") aún
// cuando el prompt no lo pide. La UI pinta el guion como texto plano línea
// por línea, así que sin esto se verían los asteriscos literales.
export function cleanScriptLine(line) {
  return line
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **negrita**
    .replace(/^\*\s+/, '• ')           // "* " al inicio -> vineta
    .replace(/\*(.+?)\*/g, '$1');      // *cursiva* suelta
}

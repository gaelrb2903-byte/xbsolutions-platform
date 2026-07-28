// Fila de tarjetas de resumen (totales/desgloses) arriba de una vista.
// items: [{ label, value, tone? }] — tone: 'accent' | 'warn' | 'success' | 'danger'
export default function StatRow({ items }) {
  return (
    <div className="stat-row">
      {items.map((it, i) => (
        <div key={it.label} className={`glass stat-tile ${it.tone || ''}`} style={{ '--i': i }}>
          <span className="stat-value">{it.value}</span>
          <span className="stat-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

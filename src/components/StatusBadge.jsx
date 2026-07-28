export const STATUSES = ['Pendiente', 'Contactado', 'Interesado', 'No interesado'];

const CLASS = {
  Pendiente: 'st-pendiente',
  Contactado: 'st-contactado',
  Interesado: 'st-interesado',
  'No interesado': 'st-no',
};

// Mismos colores que las pastillas, para pintar otros controles (ej. el
// selector de estatus) sin tener que duplicar el badge al lado.
export const STATUS_COLOR = {
  Pendiente: '#b7c0d0',
  Contactado: 'var(--warn)',
  Interesado: 'var(--success)',
  'No interesado': 'var(--danger)',
};

export default function StatusBadge({ status }) {
  const cls = CLASS[status] || 'st-pendiente';
  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-dot" />
      {status || 'Pendiente'}
    </span>
  );
}

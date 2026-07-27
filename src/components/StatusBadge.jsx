export const STATUSES = ['Pendiente', 'Contactado', 'Interesado', 'No interesado'];

const CLASS = {
  Pendiente: 'st-pendiente',
  Contactado: 'st-contactado',
  Interesado: 'st-interesado',
  'No interesado': 'st-no',
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

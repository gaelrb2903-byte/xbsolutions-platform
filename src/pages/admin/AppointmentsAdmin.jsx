import { useCollection } from '../../useCollections';
import { formatPhone } from '../../phone';

export default function AppointmentsAdmin() {
  const { items, loading } = useCollection('appointments', 'createdAt', 'desc');

  return (
    <div>
      <div className="section-head">
        <h2>Citas</h2>
        <span className="muted">{items.length} agendadas</span>
      </div>

      {loading ? (
        <div className="glass empty"><span className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="glass empty">Aun no hay citas agendadas por el equipo.</div>
      ) : (
        <div className="glass table-wrap">
          <table>
            <thead>
              <tr>
                <th>Negocio</th><th>Contacto</th><th>Teléfono</th>
                <th>Fecha</th><th>Hora</th><th>Vendedor</th><th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.business}</strong></td>
                  <td>{a.contact || '—'}</td>
                  <td>{a.phone ? <a href={`tel:${a.phone}`}>{formatPhone(a.phone)}</a> : '—'}</td>
                  <td>{a.date || '—'}</td>
                  <td>{a.time || '—'}</td>
                  <td><span className="role-pill">{a.sellerName}</span></td>
                  <td className="muted">{a.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

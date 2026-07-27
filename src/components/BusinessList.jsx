import { useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { formatPhone } from '../phone';
import StatusBadge, { STATUSES } from './StatusBadge';

// Lista de negocios en tiempo real. El vendedor cambia el estatus y ve al
// instante los cambios de otros vendedores (via onSnapshot en el padre).
// Props: businesses (array en vivo), onSchedule(biz), onViewScript(biz)
export default function BusinessList({ businesses, onSchedule, onViewScript }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [savingId, setSavingId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      const matchFilter = filter === 'Todos' || (b.status || 'Pendiente') === filter;
      const matchSearch =
        !q ||
        [b.name, b.contact, b.phone, b.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [businesses, search, filter]);

  const changeStatus = async (biz, status) => {
    setSavingId(biz.id);
    try {
      await updateDoc(doc(db, 'businesses', biz.id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: user?.name || user?.username || 'vendedor',
      });
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estatus.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Negocios</h2>
        <span className="muted">{filtered.length} de {businesses.length}</span>
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Buscar por nombre, tel, categoria…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>Todos</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass empty">No hay negocios que coincidan.</div>
      ) : (
        <div className="biz-grid">
          {filtered.map((b) => (
            <div key={b.id} className="glass biz-card">
              <div className="biz-top">
                <div>
                  <p className="biz-name">{b.name}</p>
                  <div className="biz-meta">
                    {b.contact && <span>{b.contact}</span>}
                    {b.phone && <a href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a>}
                    {b.category && <span className="faint">{b.category}</span>}
                  </div>
                </div>
                <StatusBadge status={b.status || 'Pendiente'} />
              </div>

              <div className="stack">
                <label>Cambiar estatus</label>
                <select
                  value={b.status || 'Pendiente'}
                  disabled={savingId === b.id}
                  onChange={(e) => changeStatus(b, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="biz-actions">
                {b.phone && (
                  <a className="btn btn-sm" href={`tel:${b.phone}`}>Llamar</a>
                )}
                <button className="btn-ghost btn-sm" onClick={() => onSchedule(b)}>Agendar cita</button>
                {b.customScript && onViewScript && (
                  <button className="btn-ghost btn-sm" onClick={() => onViewScript(b)}>★ Guion IA</button>
                )}
                {b.updatedBy && (
                  <span className="faint" style={{ alignSelf: 'center' }}>
                    Ult. cambio: {b.updatedBy}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

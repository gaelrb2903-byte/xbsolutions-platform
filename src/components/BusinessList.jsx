import { useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { formatPhone } from '../phone';
import { callFunction } from '../api';
import StatusBadge, { STATUSES } from './StatusBadge';
import EmptyState from './EmptyState';
import Waveform from './Waveform';

// Lista de negocios en tiempo real. El vendedor cambia el estatus y ve al
// instante los cambios de otros vendedores (via onSnapshot en el padre).
// Cualquier vendedor puede generar/regenerar el guion IA, no solo el admin.
// Props: businesses (array en vivo), onSchedule(biz), onViewScript(biz), onComment(biz)
export default function BusinessList({ businesses, onSchedule, onViewScript, onComment }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [savingId, setSavingId] = useState(null);
  const [genId, setGenId] = useState(null);

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
      showToast('error', 'No se pudo actualizar el estatus.');
    } finally {
      setSavingId(null);
    }
  };

  const generateScript = async (biz) => {
    setGenId(biz.id);
    try {
      await callFunction('generate-script', {
        businessId: biz.id,
        name: biz.name,
        category: biz.category || '',
      });
      showToast('ok', `Guion generado para ${biz.name}.`);
    } catch (err) {
      console.error(err);
      showToast('error', `No se pudo generar el guion: ${err.message}`);
    } finally {
      setGenId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2><Waveform /> Negocios</h2>
        <span className="muted">{filtered.length} de {businesses.length}</span>
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Buscar por nombre, tel, categoría…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>Todos</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="No hay negocios que coincidan." />
      ) : (
        <div className="biz-grid">
          {filtered.map((b, i) => (
            <div key={b.id} className="glass biz-card stagger-item" style={{ '--i': Math.min(i, 10) }}>
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
                <button className="btn-ghost btn-sm" disabled={genId === b.id} onClick={() => generateScript(b)}>
                  {genId === b.id ? <span className="spinner" /> : (b.customScript ? 'Regenerar guion' : 'Generar guion')}
                </button>
                {onViewScript && b.customScript && (
                  <button className="btn-ghost btn-sm" onClick={() => onViewScript(b)}>★ Ver guion</button>
                )}
                {onComment && (
                  <button className="btn-ghost btn-sm" onClick={() => onComment(b)}>💬 Comentarios</button>
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

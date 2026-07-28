import { useMemo, useRef, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useCollection } from '../../useCollections';
import { useAuth } from '../../AuthContext';
import { normalizePhone, formatPhone } from '../../phone';
import { csvToBusinesses } from '../../csv';
import { callFunction } from '../../api';
import { useToast } from '../../ToastContext';
import { fillScriptVendedor, cleanScriptLine } from '../../scriptUtils';
import { STATUSES, STATUS_COLOR } from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import StatRow from '../../components/StatRow';
import EmptyState from '../../components/EmptyState';
import CommentsPanel from '../../components/CommentsPanel';
import Waveform from '../../components/Waveform';

export default function BusinessesAdmin() {
  const { user } = useAuth();
  const { items: businesses, loading } = useCollection('businesses', 'name');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [genId, setGenId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [scriptView, setScriptView] = useState(null);
  const [commentFor, setCommentFor] = useState(null);
  const fileRef = useRef();

  const existingPhones = useMemo(
    () => new Set(businesses.map((b) => normalizePhone(b.phone)).filter(Boolean)),
    [businesses]
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    businesses.forEach((b) => { counts[b.status || 'Pendiente'] = (counts[b.status || 'Pendiente'] || 0) + 1; });
    return counts;
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((b) =>
      [b.name, b.contact, b.phone, b.category].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)));
  }, [businesses, search]);

  // Agrupados por estatus, en el orden Pendiente → Contactado → Interesado →
  // No interesado (asi "No interesado" siempre queda hasta el final).
  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(STATUSES.map((s) => [s, []]));
    filtered.forEach((b) => { (groups[b.status || 'Pendiente'] ||= []).push(b); });
    return groups;
  }, [filtered]);

  // Negocios con comentarios, mas recientes primero.
  const withComments = useMemo(
    () => filtered
      .filter((b) => b.commentCount > 0)
      .sort((a, b) => (b.lastCommentAt?.toMillis?.() || 0) - (a.lastCommentAt?.toMillis?.() || 0)),
    [filtered]
  );

  // ── Alta manual ──
  const [form, setForm] = useState({ name: '', contact: '', phone: '', category: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const addOne = async (e) => {
    e.preventDefault();
    if (form.phone && existingPhones.has(normalizePhone(form.phone))) {
      showToast('error', 'Ya existe un negocio con ese teléfono.');
      return;
    }
    try {
      await addDoc(collection(db, 'businesses'), {
        ...form,
        phoneNorm: normalizePhone(form.phone),
        status: 'Pendiente',
        createdAt: serverTimestamp(),
      });
      setForm({ name: '', contact: '', phone: '', category: '' });
      showToast('ok', `"${form.name}" agregado.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'No se pudo agregar el negocio.');
    }
  };

  // ── Carga CSV con dedup por teléfono ──
  const onCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = csvToBusinesses(text);
      if (parsed.length === 0) {
        showToast('error', 'El CSV no tiene filas válidas.');
        return;
      }

      const seen = new Set(existingPhones);
      const toAdd = [];
      let dupInFile = 0, dupExisting = 0, noPhone = 0;

      for (const b of parsed) {
        const p = normalizePhone(b.phone);
        if (!p) { noPhone++; continue; }          // sin teléfono, no podemos deduplicar
        if (existingPhones.has(p)) { dupExisting++; continue; }
        if (seen.has(p)) { dupInFile++; continue; } // duplicado dentro del mismo archivo
        seen.add(p);
        toAdd.push({ ...b, phoneNorm: p, status: 'Pendiente' });
      }

      // Batch en chunks (limite de Firestore ~500 ops).
      for (let i = 0; i < toAdd.length; i += 400) {
        const batch = writeBatch(db);
        toAdd.slice(i, i + 400).forEach((b) => {
          const ref = doc(collection(db, 'businesses'));
          batch.set(ref, { ...b, createdAt: serverTimestamp() });
        });
        await batch.commit();
      }

      showToast('ok', `Se agregaron ${toAdd.length} negocios. Omitidos: ${dupExisting} ya existentes, ${dupInFile} repetidos, ${noPhone} sin teléfono.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error al procesar el CSV.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const changeStatus = async (biz, status) => {
    setSavingId(biz.id);
    try {
      await updateDoc(doc(db, 'businesses', biz.id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: user?.name || user?.username || 'admin',
      });
    } catch (err) {
      console.error(err);
      showToast('error', 'No se pudo actualizar el estatus.');
    } finally {
      setSavingId(null);
    }
  };

  const removeBusiness = async (b) => {
    if (!confirm(`¿Eliminar "${b.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'businesses', b.id));
      showToast('ok', `"${b.name}" eliminado.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'No se pudo eliminar.');
    }
  };

  // ── Generar guion IA (uno a la vez) ──
  const generate = async (b) => {
    setGenId(b.id);
    try {
      const res = await callFunction('generate-script', {
        businessId: b.id,
        name: b.name,
        category: b.category || '',
      });
      showToast('ok', `Guion generado para ${b.name}.`);
      if (res?.script) setScriptView({ name: b.name, script: res.script });
    } catch (err) {
      console.error(err);
      showToast('error', `No se pudo generar el guion: ${err.message}`);
    } finally {
      setGenId(null);
    }
  };

  const renderTable = (list) => (
    <div className="glass table-wrap view-fade">
      <table>
        <thead>
          <tr><th>Negocio</th><th>Contacto</th><th>Teléfono</th><th>Categoría</th><th>Estatus</th><th>Guion IA</th><th></th></tr>
        </thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id}>
              <td><strong>{b.name}</strong></td>
              <td>{b.contact || '—'}</td>
              <td>{b.phone ? formatPhone(b.phone) : '—'}</td>
              <td>{b.category || '—'}</td>
              <td>
                <select
                  className="status-select"
                  style={{ width: 'auto', borderColor: STATUS_COLOR[b.status || 'Pendiente'], color: STATUS_COLOR[b.status || 'Pendiente'] }}
                  value={b.status || 'Pendiente'}
                  disabled={savingId === b.id}
                  onChange={(e) => changeStatus(b, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn-ghost btn-sm" disabled={genId === b.id} onClick={() => generate(b)}>
                    {genId === b.id ? <span className="spinner" /> : (b.customScript ? 'Regenerar' : 'Generar')}
                  </button>
                  {b.customScript && (
                    <button className="btn-ghost btn-sm" onClick={() => setScriptView({ name: b.name, script: b.customScript })}>Ver</button>
                  )}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn-ghost btn-sm" onClick={() => setCommentFor(b)}>
                    💬 Comentarios{b.commentCount > 0 ? ` (${b.commentCount})` : ''}
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => removeBusiness(b)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="section-head"><h2><Waveform /> Negocios</h2></div>

      {!loading && (
        <StatRow
          items={[
            { label: 'Pendiente', value: statusCounts.Pendiente },
            { label: 'Contactado', value: statusCounts.Contactado, tone: 'warn' },
            { label: 'Interesado', value: statusCounts.Interesado, tone: 'success' },
            { label: 'No interesado', value: statusCounts['No interesado'], tone: 'danger' },
          ]}
        />
      )}

      {/* Alta + CSV */}
      <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px' }}>Agregar negocio</h3>
        <form className="form-grid" onSubmit={addOne}>
          <div className="form-row-2">
            <div><label>Nombre</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Contacto</label><input value={form.contact} onChange={set('contact')} /></div>
          </div>
          <div className="form-row-2">
            <div><label>Teléfono</label><input value={form.phone} onChange={set('phone')} inputMode="tel" /></div>
            <div><label>Categoría</label><input value={form.category} onChange={set('category')} placeholder="ej. Barbería" /></div>
          </div>
          <button className="btn">Agregar</button>
        </form>

        <hr className="divider" />

        <h3 style={{ margin: '0 0 6px' }}>Subir CSV</h3>
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Columnas: <code>nombre, contacto, teléfono, categoría</code>. Se deduplica por teléfono.
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onCSV} />
      </div>

      {/* Lista */}
      <div className="filter-row">
        <input className="search-input" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="glass empty"><span className="spinner" /></div>
      ) : businesses.length === 0 ? (
        <EmptyState icon="building" title="Aún no hay negocios cargados." hint="Agrega uno arriba o sube un CSV." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" title="Ningún negocio coincide con la búsqueda." />
      ) : (
        <div className="stack" style={{ gap: 22 }}>
          {withComments.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-dim)' }}>
                💬 Con comentarios ({withComments.length})
              </h3>
              {renderTable(withComments)}
            </div>
          )}

          {STATUSES.map((status) => (
            byStatus[status].length > 0 && (
              <div key={status}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, color: STATUS_COLOR[status] }}>
                  {status} ({byStatus[status].length})
                </h3>
                {renderTable(byStatus[status])}
              </div>
            )
          ))}
        </div>
      )}

      {scriptView && (
        <Modal title="Guion personalizado" subtitle={scriptView.name} onClose={() => setScriptView(null)} wide>
          {fillScriptVendedor(scriptView.script, user?.name || user?.username)
            .split('\n').filter(Boolean).map((l, i) => (
              <p key={i} style={{ lineHeight: 1.5 }}>{cleanScriptLine(l)}</p>
            ))}
        </Modal>
      )}

      {commentFor && (
        <CommentsPanel business={commentFor} onClose={() => setCommentFor(null)} />
      )}
    </div>
  );
}

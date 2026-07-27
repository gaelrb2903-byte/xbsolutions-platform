import { useMemo, useRef, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useCollection } from '../../useCollections';
import { normalizePhone, formatPhone } from '../../phone';
import { csvToBusinesses } from '../../csv';
import { callFunction } from '../../api';
import StatusBadge, { STATUSES } from '../../components/StatusBadge';
import Modal from '../../components/Modal';

export default function BusinessesAdmin() {
  const { items: businesses, loading } = useCollection('businesses', 'name');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null); // { type, text }
  const [genId, setGenId] = useState(null);
  const [scriptView, setScriptView] = useState(null);
  const fileRef = useRef();

  const existingPhones = useMemo(
    () => new Set(businesses.map((b) => normalizePhone(b.phone)).filter(Boolean)),
    [businesses]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((b) =>
      [b.name, b.contact, b.phone, b.category].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)));
  }, [businesses, search]);

  // ── Alta manual ──
  const [form, setForm] = useState({ name: '', contact: '', phone: '', category: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const addOne = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.phone && existingPhones.has(normalizePhone(form.phone))) {
      setMsg({ type: 'error', text: 'Ya existe un negocio con ese telefono.' });
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
      setMsg({ type: 'ok', text: 'Negocio agregado.' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'No se pudo agregar.' });
    }
  };

  // ── Carga CSV con dedup por telefono ──
  const onCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      const text = await file.text();
      const parsed = csvToBusinesses(text);
      if (parsed.length === 0) {
        setMsg({ type: 'error', text: 'El CSV no tiene filas validas.' });
        return;
      }

      const seen = new Set(existingPhones);
      const toAdd = [];
      let dupInFile = 0, dupExisting = 0, noPhone = 0;

      for (const b of parsed) {
        const p = normalizePhone(b.phone);
        if (!p) { noPhone++; continue; }          // sin telefono, no podemos deduplicar
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

      setMsg({
        type: 'ok',
        text: `Se agregaron ${toAdd.length} negocios. Omitidos: ${dupExisting} ya existentes, ${dupInFile} repetidos en el archivo, ${noPhone} sin telefono.`,
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error al procesar el CSV.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeBusiness = async (b) => {
    if (!confirm(`¿Eliminar "${b.name}"?`)) return;
    try { await deleteDoc(doc(db, 'businesses', b.id)); }
    catch (err) { console.error(err); alert('No se pudo eliminar.'); }
  };

  // ── Generar guion IA (uno a la vez) ──
  const generate = async (b) => {
    setGenId(b.id);
    setMsg(null);
    try {
      const res = await callFunction('generate-script', {
        businessId: b.id,
        name: b.name,
        category: b.category || '',
      });
      setMsg({ type: 'ok', text: `Guion generado para ${b.name}.` });
      if (res?.script) setScriptView({ name: b.name, script: res.script });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: `No se pudo generar el guion: ${err.message}` });
    } finally {
      setGenId(null);
    }
  };

  return (
    <div>
      <div className="section-head"><h2>Negocios</h2>
        <span className="muted">{businesses.length} en total</span>
      </div>

      {msg && <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-ok'}`}>{msg.text}</div>}

      {/* Alta + CSV */}
      <div className="glass" style={{ padding: 18, marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 12px' }}>Agregar negocio</h3>
        <form className="form-grid" onSubmit={addOne}>
          <div className="form-row-2">
            <div><label>Nombre</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Contacto</label><input value={form.contact} onChange={set('contact')} /></div>
          </div>
          <div className="form-row-2">
            <div><label>Teléfono</label><input value={form.phone} onChange={set('phone')} inputMode="tel" /></div>
            <div><label>Categoría</label><input value={form.category} onChange={set('category')} placeholder="ej. Barberia" /></div>
          </div>
          <button className="btn">Agregar</button>
        </form>

        <hr className="divider" />

        <h3 style={{ margin: '0 0 6px' }}>Subir CSV</h3>
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Columnas: <code>nombre, contacto, telefono, categoria</code>. Se deduplica por teléfono.
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onCSV} />
      </div>

      {/* Lista */}
      <div className="filter-row">
        <input className="search-input" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="glass empty"><span className="spinner" /></div>
      ) : (
        <div className="glass table-wrap">
          <table>
            <thead>
              <tr><th>Negocio</th><th>Contacto</th><th>Teléfono</th><th>Categoría</th><th>Estatus</th><th>Guion IA</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.contact || '—'}</td>
                  <td>{b.phone ? formatPhone(b.phone) : '—'}</td>
                  <td>{b.category || '—'}</td>
                  <td><StatusBadge status={b.status || 'Pendiente'} /></td>
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
                  <td><button className="btn-danger btn-sm" onClick={() => removeBusiness(b)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scriptView && (
        <Modal title="Guion personalizado" subtitle={scriptView.name} onClose={() => setScriptView(null)}>
          {scriptView.script.split('\n').filter(Boolean).map((l, i) => (
            <p key={i} style={{ lineHeight: 1.5 }}>{l}</p>
          ))}
        </Modal>
      )}
    </div>
  );
}

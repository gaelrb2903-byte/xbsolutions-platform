import { useMemo, useState } from 'react';
import { useCollection } from '../../useCollections';
import { callFunction } from '../../api';

export default function SellersAdmin() {
  const { items: users, loading } = useCollection('users');
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const sellers = useMemo(
    () => users.filter((u) => u.role === 'seller').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password.length < 6) {
      setMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setBusy(true);
    try {
      await callFunction('create-seller', {
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });
      setMsg({ type: 'ok', text: `Vendedor "${form.name}" creado. Entra con usuario: ${form.username.trim().toLowerCase()}` });
      setForm({ name: '', username: '', password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!confirm(`¿Eliminar la cuenta de "${u.name}"? No podra volver a entrar.`)) return;
    setDeletingId(u.id);
    setMsg(null);
    try {
      await callFunction('delete-seller', { uid: u.id });
      setMsg({ type: 'ok', text: `Cuenta de "${u.name}" eliminada.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="section-head"><h2>Vendedores</h2>
        <span className="muted">{sellers.length} activos</span>
      </div>

      {msg && <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-ok'}`}>{msg.text}</div>}

      <div className="glass" style={{ padding: 18, marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 12px' }}>Dar de alta vendedor</h3>
        <form className="form-grid" onSubmit={create}>
          <div className="form-row-2">
            <div><label>Nombre</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Usuario</label><input value={form.username} onChange={set('username')} autoCapitalize="none" placeholder="sin espacios" required /></div>
          </div>
          <div>
            <label>Contraseña (min. 6)</label>
            <input type="text" value={form.password} onChange={set('password')} required />
          </div>
          <button className="btn" disabled={busy}>{busy ? <span className="spinner" /> : 'Crear cuenta'}</button>
        </form>
      </div>

      {loading ? (
        <div className="glass empty"><span className="spinner" /></div>
      ) : sellers.length === 0 ? (
        <div className="glass empty">Aun no hay vendedores. Crea el primero arriba.</div>
      ) : (
        <div className="glass table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Usuario</th><th></th></tr></thead>
            <tbody>
              {sellers.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.username}</td>
                  <td>
                    <button className="btn-danger btn-sm" disabled={deletingId === u.id} onClick={() => remove(u)}>
                      {deletingId === u.id ? <span className="spinner" /> : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

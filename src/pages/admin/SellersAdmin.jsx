import { useMemo, useState } from 'react';
import { useCollection } from '../../useCollections';
import { callFunction } from '../../api';
import { useToast } from '../../ToastContext';
import StatRow from '../../components/StatRow';
import EmptyState from '../../components/EmptyState';
import Waveform from '../../components/Waveform';

export default function SellersAdmin() {
  const { items: users, loading } = useCollection('users');
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const sellers = useMemo(
    () => users.filter((u) => u.role === 'seller').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      showToast('error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const username = form.username.trim().toLowerCase();
      await callFunction('create-seller', { name: form.name.trim(), username, password: form.password });
      showToast('ok', `"${form.name}" creado. Usuario: ${username}`);
      setForm({ name: '', username: '', password: '' });
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!confirm(`¿Eliminar la cuenta de "${u.name}"? No podra volver a entrar.`)) return;
    setDeletingId(u.id);
    try {
      await callFunction('delete-seller', { uid: u.id });
      showToast('ok', `Cuenta de "${u.name}" eliminada.`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="section-head"><h2><Waveform /> Vendedores</h2></div>

      <StatRow items={[{ label: 'Activos', value: sellers.length, tone: 'accent' }]} />

      <div className="two-col">
        <div className="glass" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Dar de alta vendedor</h3>
          <form className="form-grid" onSubmit={create}>
            <div><label>Nombre</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Usuario</label><input value={form.username} onChange={set('username')} autoCapitalize="none" placeholder="sin espacios" required /></div>
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
          <EmptyState icon="users" title="Aún no hay vendedores." hint="Crea el primero con el formulario." />
        ) : (
          <div className="glass table-wrap view-fade">
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
    </div>
  );
}

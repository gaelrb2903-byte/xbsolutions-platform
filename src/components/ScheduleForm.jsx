import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

// Formulario para agendar una cita. Queda registrada en Firestore ('appointments')
// para que el admin la vea en su panel. Sin calendario externo.
// Props: prefill (negocio opcional), onDone()
export default function ScheduleForm({ prefill = {}, onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    business: prefill.name || '',
    contact: prefill.contact || '',
    phone: prefill.phone || '',
    date: '',
    time: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...form,
        businessId: prefill.id || null,
        sellerId: user.uid,
        sellerName: user?.name || user?.username || 'vendedor',
        createdAt: serverTimestamp(),
      });
      setOk(true);
      if (onDone) setTimeout(onDone, 900);
    } catch (err) {
      console.error(err);
      setError('No se pudo agendar. Intenta de nuevo.');
      setBusy(false);
    }
  };

  if (ok) {
    return <div className="alert alert-ok">✓ Cita agendada. El admin ya puede verla.</div>;
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div>
        <label>Negocio</label>
        <input value={form.business} onChange={set('business')} required />
      </div>
      <div className="form-row-2">
        <div>
          <label>Contacto</label>
          <input value={form.contact} onChange={set('contact')} />
        </div>
        <div>
          <label>Teléfono</label>
          <input value={form.phone} onChange={set('phone')} inputMode="tel" />
        </div>
      </div>
      <div className="form-row-2">
        <div>
          <label>Fecha</label>
          <input type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div>
          <label>Hora</label>
          <input type="time" value={form.time} onChange={set('time')} required />
        </div>
      </div>
      <div>
        <label>Notas (ej. pidio algo mas economico, mejor horario, etc.)</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} />
      </div>
      <button className="btn btn-block" disabled={busy}>
        {busy ? <span className="spinner" /> : 'Agendar cita'}
      </button>
    </form>
  );
}

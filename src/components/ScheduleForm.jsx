import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { callFunction } from '../api';

// Formulario para agendar una cita, o editar una ya agendada (prop `editing`).
// Queda registrada en Firestore ('appointments') para que el admin la vea.
// Props: prefill (negocio opcional, solo al crear), editing (cita a editar), onDone()
export default function ScheduleForm({ prefill = {}, editing = null, onDone }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    business: editing?.business || prefill.name || '',
    contact: editing?.contact || prefill.contact || '',
    phone: editing?.phone || prefill.phone || '',
    fechaTexto: editing?.fechaTexto || '',
    notes: editing?.notes || '',
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
      if (editing) {
        await updateDoc(doc(db, 'appointments', editing.id), { ...form });
        setOk(true);
        showToast('ok', `Cita actualizada: ${form.business}.`);
      } else {
        const sellerName = user?.name || user?.username || 'vendedor';
        await addDoc(collection(db, 'appointments'), {
          ...form,
          businessId: prefill.id || null,
          sellerId: user.uid,
          sellerName,
          createdAt: serverTimestamp(),
        });
        setOk(true);
        showToast('ok', `Cita agendada: ${form.business}.`);

        // Aviso por correo a Gael. Best-effort: si falla (o falta la API key
        // de Resend en el servidor) no afecta la cita ya guardada.
        callFunction('notify-appointment', { ...form, sellerName }).catch((err) => {
          console.error('notify-appointment:', err);
        });
      }

      if (onDone) setTimeout(onDone, 900);
    } catch (err) {
      console.error(err);
      setError(editing ? 'No se pudo guardar el cambio. Intenta de nuevo.' : 'No se pudo agendar. Intenta de nuevo.');
      setBusy(false);
    }
  };

  if (ok) {
    return (
      <div className="alert alert-ok">
        {editing ? '✓ Cita actualizada.' : '✓ Cita agendada. El admin ya puede verla.'}
      </div>
    );
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
      <div>
        <label>¿Cuándo quedó la cita?</label>
        <input
          value={form.fechaTexto}
          onChange={set('fechaTexto')}
          placeholder="ej. mañana 3pm, 28 de julio 5pm"
          required
        />
      </div>
      <div>
        <label>Notas (ej. pidió algo más económico, mejor horario, etc.)</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} />
      </div>
      <button className="btn btn-block" disabled={busy}>
        {busy ? <span className="spinner" /> : (editing ? 'Guardar cambios' : 'Agendar cita')}
      </button>
    </form>
  );
}

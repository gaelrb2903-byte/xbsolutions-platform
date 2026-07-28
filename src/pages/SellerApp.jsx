import { useMemo, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from '../components/Layout';
import ScriptView from '../components/ScriptView';
import BusinessList from '../components/BusinessList';
import ScheduleForm from '../components/ScheduleForm';
import Modal from '../components/Modal';
import CommentsPanel from '../components/CommentsPanel';
import EmptyState from '../components/EmptyState';
import Waveform from '../components/Waveform';
import { useCollection } from '../useCollections';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { formatPhone } from '../phone';
import { fillScriptVendedor, cleanScriptLine } from '../scriptUtils';

const TABS = [
  { id: 'guion', label: 'Guion' },
  { id: 'negocios', label: 'Negocios' },
  { id: 'citas', label: 'Mis citas' },
];

export default function SellerApp() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('negocios');
  const { items: businesses, loading } = useCollection('businesses', 'name');
  const { items: myAppointments, loading: apptLoading } = useCollection(
    'appointments', null, 'asc', 'sellerId', '==', user?.uid
  );
  const sortedAppointments = useMemo(
    () => [...myAppointments].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)),
    [myAppointments]
  );
  const [scheduleFor, setScheduleFor] = useState(null); // negocio para modal
  const [editingAppt, setEditingAppt] = useState(null); // cita propia a editar
  const [scriptFor, setScriptFor] = useState(null);     // negocio para ver guion IA
  const [commentFor, setCommentFor] = useState(null);   // negocio para ver comentarios

  const deleteAppointment = async (a) => {
    if (!confirm(`¿Borrar la cita de "${a.business}"?`)) return;
    try {
      await deleteDoc(doc(db, 'appointments', a.id));
      showToast('ok', 'Cita borrada.');
    } catch (err) {
      console.error(err);
      showToast('error', 'No se pudo borrar la cita.');
    }
  };

  return (
    <Layout tabs={TABS} active={tab} onTab={setTab}>
      {tab === 'guion' && <ScriptView />}

      {tab === 'negocios' && (
        loading ? (
          <div className="glass empty"><span className="spinner" /></div>
        ) : (
          <BusinessList
            businesses={businesses}
            onSchedule={(b) => setScheduleFor(b)}
            onViewScript={(b) => setScriptFor(b)}
            onComment={(b) => setCommentFor(b)}
          />
        )
      )}

      {tab === 'citas' && (
        <div>
          <div className="section-head"><h2><Waveform /> Mis citas</h2></div>
          {apptLoading ? (
            <div className="glass empty"><span className="spinner" /></div>
          ) : sortedAppointments.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Aún no has agendado citas."
              hint="Agenda una desde la tarjeta de un negocio en la pestaña Negocios."
            />
          ) : (
            <div className="agenda-list">
              {sortedAppointments.map((a) => (
                <div key={a.id} className="glass agenda-item">
                  <div className="row-between">
                    <div className="agenda-time">{a.fechaTexto || '—'}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => setEditingAppt(a)}>Editar</button>
                      <button className="btn-danger btn-sm" onClick={() => deleteAppointment(a)}>Borrar</button>
                    </div>
                  </div>
                  <div className="agenda-biz">{a.business}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {a.contact || '—'} · {a.phone ? <a href={`tel:${a.phone}`}>{formatPhone(a.phone)}</a> : '—'}
                  </div>
                  {a.notes && <div className="faint" style={{ marginTop: 4 }}>{a.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {scheduleFor && (
        <Modal
          title="Agendar cita"
          subtitle={scheduleFor.name}
          onClose={() => setScheduleFor(null)}
        >
          <ScheduleForm prefill={scheduleFor} onDone={() => setScheduleFor(null)} />
        </Modal>
      )}

      {editingAppt && (
        <Modal
          title="Editar cita"
          subtitle={editingAppt.business}
          onClose={() => setEditingAppt(null)}
        >
          <ScheduleForm editing={editingAppt} onDone={() => setEditingAppt(null)} />
        </Modal>
      )}

      {scriptFor && (
        <Modal
          title="Guion personalizado"
          subtitle={scriptFor.name}
          onClose={() => setScriptFor(null)}
          wide
        >
          {scriptFor.customScript
            ? fillScriptVendedor(scriptFor.customScript, user?.name || user?.username)
                .split('\n').filter(Boolean).map((l, i) => (
                  <p key={i} style={{ lineHeight: 1.5 }}>{cleanScriptLine(l)}</p>
                ))
            : <p className="muted">Aún no hay guion IA para este negocio.</p>}
        </Modal>
      )}

      {commentFor && (
        <CommentsPanel business={commentFor} onClose={() => setCommentFor(null)} />
      )}
    </Layout>
  );
}

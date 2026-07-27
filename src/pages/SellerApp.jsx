import { useState } from 'react';
import Layout from '../components/Layout';
import ScriptView from '../components/ScriptView';
import BusinessList from '../components/BusinessList';
import ScheduleForm from '../components/ScheduleForm';
import Modal from '../components/Modal';
import { useCollection } from '../useCollections';

const TABS = [
  { id: 'guion', label: 'Guion' },
  { id: 'negocios', label: 'Negocios' },
  { id: 'agendar', label: 'Agendar cita' },
];

export default function SellerApp() {
  const [tab, setTab] = useState('negocios');
  const { items: businesses, loading } = useCollection('businesses', 'name');
  const [scheduleFor, setScheduleFor] = useState(null); // negocio para modal
  const [scriptFor, setScriptFor] = useState(null);     // negocio para ver guion IA

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
          />
        )
      )}

      {tab === 'agendar' && (
        <div>
          <div className="section-head"><h2>Agendar cita</h2></div>
          <div className="glass" style={{ padding: 20 }}>
            <ScheduleForm />
          </div>
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

      {scriptFor && (
        <Modal
          title="Guion personalizado"
          subtitle={scriptFor.name}
          onClose={() => setScriptFor(null)}
        >
          {scriptFor.customScript
            ? scriptFor.customScript.split('\n').filter(Boolean).map((l, i) => (
                <p key={i} style={{ lineHeight: 1.5 }}>{l}</p>
              ))
            : <p className="muted">Aun no hay guion IA para este negocio.</p>}
        </Modal>
      )}
    </Layout>
  );
}

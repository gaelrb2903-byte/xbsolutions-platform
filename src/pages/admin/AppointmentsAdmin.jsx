import { useMemo } from 'react';
import { useCollection } from '../../useCollections';
import { formatPhone } from '../../phone';
import StatRow from '../../components/StatRow';
import EmptyState from '../../components/EmptyState';
import Waveform from '../../components/Waveform';

// Rango de la semana actual (lunes 00:00 a domingo 23:59, hora local).
function currentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=domingo ... 6=sabado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59);
  return { start, end };
}

// La cita ("¿cuándo quedó?") es texto libre del vendedor, no una fecha
// estructurada, asi que no se puede ubicar en un calendario ni ordenar por
// ella. Todo (orden y "esta semana") se basa en createdAt, el timestamp del
// servidor de cuando se agendo — eso si es confiable.
export default function AppointmentsAdmin() {
  const { items, loading } = useCollection('appointments', 'createdAt', 'desc');

  const thisWeekCount = useMemo(() => {
    const { start, end } = currentWeekRange();
    return items.filter((a) => {
      const d = a.createdAt?.toDate?.();
      return d && d >= start && d <= end;
    }).length;
  }, [items]);

  return (
    <div>
      <div className="section-head">
        <h2><Waveform /> Citas</h2>
      </div>

      <StatRow
        items={[
          { label: 'Total de citas', value: items.length, tone: 'accent' },
          { label: 'Agendadas esta semana', value: thisWeekCount, tone: 'success' },
        ]}
      />

      {loading ? (
        <div className="glass empty"><span className="spinner" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Aún no hay citas agendadas por el equipo."
          hint="Aparecerán aquí en cuanto un vendedor agende una."
        />
      ) : (
        <div className="agenda-list view-fade">
          {items.map((a) => (
            <div key={a.id} className="glass agenda-item">
              <div className="agenda-time">{a.fechaTexto || '—'}</div>
              <div className="agenda-biz">{a.business}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {a.contact || '—'} · {a.phone ? <a href={`tel:${a.phone}`}>{formatPhone(a.phone)}</a> : '—'}
              </div>
              <div className="faint" style={{ marginTop: 4 }}>
                Vendedor: {a.sellerName}{a.notes ? ` · ${a.notes}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

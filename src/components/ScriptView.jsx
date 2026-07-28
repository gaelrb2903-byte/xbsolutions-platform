import { BASE_SCRIPT } from '../baseScript';
import Waveform from './Waveform';

// Guion de referencia. Si se le pasa `customScript` (texto generado por IA para
// un negocio concreto), lo muestra arriba en una tarjeta destacada.
export default function ScriptView({ customScript, businessName }) {
  return (
    <div>
      <div className="section-head">
        <h2><Waveform /> Guion de llamada</h2>
      </div>

      <div className="glass script-section alert-info" style={{ marginBottom: 16 }}>
        <strong>Objetivo:</strong> {BASE_SCRIPT.objetivo}
      </div>

      {customScript && (
        <div className="glass script-section" style={{ borderColor: 'var(--accent-border)' }}>
          <h3>★ Guion personalizado{businessName ? ` · ${businessName}` : ''}</h3>
          {customScript.split('\n').filter(Boolean).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {BASE_SCRIPT.secciones.map((sec) => (
        <div key={sec.id} className="glass script-section">
          <h3>{sec.titulo}</h3>
          {sec.contenido.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

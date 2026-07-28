// Acento visual de barras tipo "onda de voz", ligado al producto (llamadas +
// recepcionista con IA). Uso sutil: junto a titulos de seccion o en el login.
export default function Waveform({ className = '' }) {
  return (
    <span className={`waveform ${className}`} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </span>
  );
}

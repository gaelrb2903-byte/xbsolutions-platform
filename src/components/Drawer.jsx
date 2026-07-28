// Panel lateral que entra desde la derecha, para contenido secundario (ej.
// comentarios de un negocio) sin tapar toda la pantalla como un modal centrado.
export default function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="glass drawer" onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="muted" style={{ margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

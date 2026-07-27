export default function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass modal" onClick={(e) => e.stopPropagation()}>
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

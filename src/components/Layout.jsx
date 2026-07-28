import Logo from './Logo';
import { useAuth } from '../AuthContext';

export default function Layout({ tabs, active, onTab, children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo className="topbar-logo" />
        <div className="topbar-user">
          <span className="role-pill">{user?.role === 'admin' ? 'Admin' : 'Vendedor'}</span>
          <span className="hide-sm">{user?.name || user?.username || user?.email}</span>
          <button className="btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </header>
      <main className="container">
        {tabs && (
          <nav className="tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`tab ${active === t.id ? 'active' : ''}`}
                onClick={() => onTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
        <div key={active} className="view-fade">
          {children}
        </div>
      </main>
    </div>
  );
}

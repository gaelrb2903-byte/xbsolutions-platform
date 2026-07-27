import { useAuth } from './AuthContext';
import Login from './pages/Login';
import SellerApp from './pages/SellerApp';
import AdminApp from './pages/AdminApp';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <span>Cargando…</span>
      </div>
    );
  }

  if (!user) return <Login />;
  return user.role === 'admin' ? <AdminApp /> : <SellerApp />;
}

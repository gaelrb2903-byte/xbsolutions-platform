import { useState } from 'react';
import Logo from '../components/Logo';
import Waveform from '../components/Waveform';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { loginWithUsername, loginWithEmail } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Si escribe un correo, entra como admin; si escribe un usuario, como vendedor.
      if (identifier.includes('@')) {
        await loginWithEmail(identifier, password);
      } else {
        await loginWithUsername(identifier, password);
      }
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="glass login-card" onSubmit={submit}>
        <Logo />
        <p className="login-sub">Plataforma interna · Prospección</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 20px' }}>
          <Waveform />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div>
            <label>Usuario o correo</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="tu-usuario"
              required
            />
          </div>
          <div>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function mapAuthError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Usuario o contraseña incorrectos.';
  if (code.includes('too-many-requests'))
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
  if (code.includes('network')) return 'Sin conexión. Revisa tu internet.';
  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}

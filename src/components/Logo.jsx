import { useState } from 'react';

// Muestra /logo.png. Si el archivo aun no existe, cae a un wordmark de texto
// para que la plataforma nunca se vea rota. Reemplaza public/logo.png por el real.
export default function Logo({ className = '' }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className={`logo ${className}`}>
      {!broken ? (
        <img src="/logo.png" alt="wxbsolutions" onError={() => setBroken(true)} />
      ) : (
        <span className="logo-fallback">
          <b>wxb</b>solutions
        </span>
      )}
    </div>
  );
}

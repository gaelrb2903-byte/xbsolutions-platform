import { auth } from './firebase';

// Llama a una Netlify Function adjuntando el ID token del usuario actual.
// Las funciones sensibles (crear/borrar vendedor, generar guion) verifican
// ese token en el servidor y exigen rol admin.
export async function callFunction(name, body = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No hay sesión activa.');
  const token = await currentUser.getIdToken();

  const res = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* respuesta vacía */ }

  if (!res.ok) {
    throw new Error((data && data.error) || `Error ${res.status}`);
  }
  return data;
}

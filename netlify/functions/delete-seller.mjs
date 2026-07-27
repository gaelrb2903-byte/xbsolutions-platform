import admin from 'firebase-admin';
import { getAdmin, requireAdmin, json } from './lib/admin.mjs';

// Elimina una cuenta de vendedor: borra el usuario de Auth y su doc en 'users'.
// Solo el admin puede llamarla, y no puede borrarse a si mismo.
export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo no permitido.' });

  try {
    const caller = await requireAdmin(event);
    getAdmin();

    const { uid } = JSON.parse(event.body || '{}');
    if (!uid) return json(400, { error: 'Falta el uid del vendedor.' });
    if (uid === caller.uid) return json(400, { error: 'No puedes eliminar tu propia cuenta.' });

    // Evita borrar por accidente a otro admin.
    const target = await admin.auth().getUser(uid).catch(() => null);
    if (target?.customClaims?.role === 'admin') {
      return json(403, { error: 'No se puede eliminar una cuenta admin desde aqui.' });
    }

    await admin.auth().deleteUser(uid).catch((err) => {
      if (err.code !== 'auth/user-not-found') throw err;
    });
    await admin.firestore().collection('users').doc(uid).delete();

    return json(200, { ok: true });
  } catch (e) {
    if (e.statusCode) return json(e.statusCode, { error: e.error });
    console.error('delete-seller:', e);
    return json(500, { error: 'Error interno al eliminar el vendedor.' });
  }
}

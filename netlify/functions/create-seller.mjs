import admin from 'firebase-admin';
import { getAdmin, requireAdmin, usernameToEmail, json } from './lib/admin.mjs';

// Crea una cuenta de vendedor: usuario de Firebase Auth + custom claim role=seller
// + doc en 'users'. Solo el admin puede llamarla.
export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido.' });

  try {
    await requireAdmin(event);
    getAdmin();

    const { name, username, password } = JSON.parse(event.body || '{}');
    if (!name || !username || !password) {
      return json(400, { error: 'Faltan datos: nombre, usuario y contraseña.' });
    }
    if (!/^[a-z0-9._-]{3,}$/.test(username)) {
      return json(400, { error: 'Usuario inválido (mín. 3, solo letras/números/._-).' });
    }
    if (password.length < 6) {
      return json(400, { error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const email = usernameToEmail(username);

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({ email, password, displayName: name });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return json(409, { error: 'Ese usuario ya existe.' });
      }
      throw err;
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'seller' });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name,
      username: username.toLowerCase(),
      role: 'seller',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return json(200, { ok: true, uid: userRecord.uid });
  } catch (e) {
    if (e.statusCode) return json(e.statusCode, { error: e.error });
    console.error('create-seller:', e);
    return json(500, { error: 'Error interno al crear el vendedor.' });
  }
}

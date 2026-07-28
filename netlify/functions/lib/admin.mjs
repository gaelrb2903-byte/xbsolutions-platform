import admin from 'firebase-admin';

// Inicializa Firebase Admin una sola vez por instancia de función.
// Credenciales desde FIREBASE_SERVICE_ACCOUNT (JSON en una linea) o
// GOOGLE_APPLICATION_CREDENTIALS (ruta a archivo).
let app;
export function getAdmin() {
  if (!app) {
    if (admin.apps.length) {
      app = admin.app();
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      // Las private_key suelen venir con \n escapados al pegarlas.
      if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
      app = admin.initializeApp({ credential: admin.credential.cert(cred) });
    } else {
      app = admin.initializeApp(); // usa GOOGLE_APPLICATION_CREDENTIALS
    }
  }
  return app;
}

export const SELLER_EMAIL_DOMAIN =
  process.env.SELLER_EMAIL_DOMAIN || 'sellers.wxbsolutions.app';

export const usernameToEmail = (u) =>
  `${String(u).trim().toLowerCase()}@${SELLER_EMAIL_DOMAIN}`;

// Verifica el ID token del header Authorization, sin exigir rol admin.
// Devuelve el token decodificado o lanza { statusCode, error }.
export async function requireAuth(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) throw { statusCode: 401, error: 'Falta el token de autenticación.' };

  getAdmin();
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (_) {
    throw { statusCode: 401, error: 'Token inválido o expirado.' };
  }
}

// Igual que requireAuth, pero además exige rol admin.
export async function requireAdmin(event) {
  const decoded = await requireAuth(event);
  if (decoded.role !== 'admin') {
    throw { statusCode: 403, error: 'Se requieren permisos de administrador.' };
  }
  return decoded;
}

export const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

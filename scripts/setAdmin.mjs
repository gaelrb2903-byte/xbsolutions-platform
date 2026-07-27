// Otorga el rol admin a un usuario ya existente en Firebase Auth.
//
// Uso:
//   1) Crea tu usuario admin en Firebase Console > Authentication (email/password).
//   2) Exporta las credenciales admin:
//        export FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccount.json | tr -d '\n')"
//      (o export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json)
//   3) node scripts/setAdmin.mjs tu-correo@ejemplo.com
//
import admin from 'firebase-admin';

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/setAdmin.mjs <email-del-admin>');
  process.exit(1);
}

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
  admin.initializeApp({ credential: admin.credential.cert(cred) });
} else {
  admin.initializeApp(); // usa GOOGLE_APPLICATION_CREDENTIALS
}

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
await admin.firestore().collection('users').doc(user.uid).set(
  { name: user.displayName || 'Admin', role: 'admin', username: email },
  { merge: true }
);

console.log(`✓ ${email} ahora es admin. Cierra sesion y vuelve a entrar para refrescar el token.`);
process.exit(0);

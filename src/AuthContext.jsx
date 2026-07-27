import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, usernameToEmail } from './firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { uid, role, name, username }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // El rol vive en custom claims (fuente de verdad) y se respalda en el doc.
      const tokenResult = await fbUser.getIdTokenResult(true);
      let role = tokenResult.claims.role || null;
      let name = null;
      let username = null;

      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          role = role || d.role;
          name = d.name || null;
          username = d.username || null;
        }
      } catch (_) { /* reglas pueden bloquear; el claim ya basta */ }

      setUser({ uid: fbUser.uid, email: fbUser.email, role: role || 'seller', name, username });
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithUsername = async (username, password) => {
    const email = usernameToEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
  };

  // El admin entra con email directo (se crea a mano en la consola de Firebase).
  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = () => fbSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithUsername, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

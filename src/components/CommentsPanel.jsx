import { useEffect, useState } from 'react';
import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import Drawer from './Drawer';

// Notas internas por negocio, visibles para todo el equipo (admin y vendedores).
// Colección: businesses/{id}/comments — se lee y escribe en vivo con onSnapshot.
// Panel lateral (no modal centrado) para poder seguir viendo la lista de atras.
export default function CommentsPanel({ business, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ref = query(
      collection(db, 'businesses', business.id, 'comments'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [business.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'businesses', business.id, 'comments'), {
        text: text.trim(),
        author: user?.name || user?.username || 'equipo',
        createdAt: serverTimestamp(),
      });
      // Denormalizado en el negocio para poder listar "con comentarios" sin
      // tener que leer la subcoleccion de cada uno.
      await updateDoc(doc(db, 'businesses', business.id), {
        commentCount: increment(1),
        lastCommentAt: serverTimestamp(),
      });
      setText('');
    } catch (err) {
      console.error(err);
      showToast('error', 'No se pudo agregar el comentario.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer title="Comentarios" subtitle={business.name} onClose={onClose}>
      <form onSubmit={submit} className="form-grid" style={{ marginBottom: 16 }}>
        <textarea
          rows={2}
          placeholder="Escribe un comentario para el equipo…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-sm" disabled={busy || !text.trim()}>
          {busy ? <span className="spinner" /> : 'Agregar comentario'}
        </button>
      </form>

      {loading ? (
        <div className="empty"><span className="spinner" /></div>
      ) : comments.length === 0 ? (
        <p className="muted">Aún no hay comentarios para este negocio.</p>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {comments.map((c) => (
            <div key={c.id} className="glass" style={{ padding: '10px 12px' }}>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{c.text}</p>
              <p className="faint" style={{ margin: '6px 0 0' }}>
                {c.author}
                {c.createdAt?.toDate ? ` · ${c.createdAt.toDate().toLocaleString('es-MX')}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

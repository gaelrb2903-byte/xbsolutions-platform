import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

// Suscripcion en tiempo real a una coleccion. Devuelve { items, loading }.
// Se usa para 'businesses' (estatus en vivo entre vendedores) y 'appointments'.
export function useCollection(name, orderField = null, dir = 'asc') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = orderField
      ? query(collection(db, name), orderBy(orderField, dir))
      : collection(db, name);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`onSnapshot ${name}:`, err);
        setLoading(false);
      }
    );
    return unsub;
  }, [name, orderField, dir]);

  return { items, loading };
}

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Suscripción en tiempo real a una colección. Devuelve { items, loading }.
// Se usa para 'businesses' (estatus en vivo entre vendedores) y 'appointments'.
// whereField/whereOp/whereValue son opcionales (ej. filtrar citas por
// sellerId): con un filtro de igualdad no se combina orderBy en la consulta
// para no requerir un indice compuesto — se ordena del lado del cliente.
export function useCollection(name, orderField = null, dir = 'asc', whereField = null, whereOp = '==', whereValue = null) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [];
    if (whereField) constraints.push(where(whereField, whereOp, whereValue));
    if (orderField && !whereField) constraints.push(orderBy(orderField, dir));
    const ref = constraints.length ? query(collection(db, name), ...constraints) : collection(db, name);

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
  }, [name, orderField, dir, whereField, whereOp, whereValue]);

  return { items, loading };
}

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// General CRUD Helpers
export const addDocument = (collectionName, data) => {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateDocument = (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteDocument = (collectionName, id) => {
  return deleteDoc(doc(db, collectionName, id));
};

// Real-time listener helper
export const subscribeToCollection = (collectionName, callback, filters = []) => {
  let q = collection(db, collectionName);
  
  if (filters.length > 0) {
    filters.forEach(f => {
      q = query(q, f);
    });
  }

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// Specific Logic: Automatic Expense Distribution
export const distributeExpenseToCorral = async (corralId, amount, type, date) => {
  // 1. Register the main expense
  const expenseRef = await addDocument("gastos", {
    corral_id: corralId,
    monto: amount,
    tipo: type,
    fecha: date
  });

  // 2. Find active animals in this corral
  const animalsQuery = query(
    collection(db, "animales"), 
    where("corral_id", "==", corralId),
    where("estado", "==", "Activo")
  );
  
  const animalsSnapshot = await getDocs(animalsQuery);
  const activeAnimalsCount = animalsSnapshot.size;

  if (activeAnimalsCount === 0) return expenseRef;

  const costPerAnimal = amount / activeAnimalsCount;

  // 3. Create individual cost records and update animal's accumulated cost
  const batchPromises = animalsSnapshot.docs.map(animalDoc => {
    const animalData = animalDoc.data();
    const newTotalCost = (animalData.costo_acumulado || 0) + costPerAnimal;

    // Update individual record
    const recordPromise = addDocument("costos_individuales", {
      animal_id: animalDoc.id,
      gasto_id: expenseRef.id,
      monto: costPerAnimal,
      fecha: date
    });

    // Update animal's total cost for fast reporting
    const updatePromise = updateDocument("animales", animalDoc.id, {
      costo_acumulado: newTotalCost
    });

    return Promise.all([recordPromise, updatePromise]);
  });

  await Promise.all(batchPromises);
  return expenseRef;
};

export const sellAnimal = async (animalId, precioVenta, fechaVenta, pesoFinal, costoTotal) => {
  // 1. Register the sale
  const saleRef = await addDocument("ventas", {
    animal_id: animalId,
    precio: precioVenta,
    costo_total_acumulado: costoTotal, // Includes purchase + expenses
    fecha: fechaVenta,
    peso_final: pesoFinal,
    utilidad: precioVenta - costoTotal
  });

  // 2. Update animal status and final record
  await updateDocument("animales", animalId, {
    estado: "Vendido",
    fecha_salida: fechaVenta,
    precio_venta: precioVenta,
    peso_final: pesoFinal
  });

  return saleRef;
};

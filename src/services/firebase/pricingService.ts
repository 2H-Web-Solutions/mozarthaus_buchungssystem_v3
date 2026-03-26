import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { TicketCategory } from '../../types/schema';

const COLLECTION_PATH = `apps/${APP_ID}/ticket_categories`;

export async function getTicketCategories(): Promise<TicketCategory[]> {
  const categoriesRef = collection(db, COLLECTION_PATH);
  const snap = await getDocs(categoriesRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketCategory));
}

export function listenTicketCategories(callback: (categories: TicketCategory[]) => void) {
  const categoriesRef = collection(db, COLLECTION_PATH);
  return onSnapshot(categoriesRef, (snap) => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketCategory));
    callback(data);
  });
}

export async function saveTicketCategory(category: TicketCategory): Promise<void> {
  const docRef = doc(db, COLLECTION_PATH, category.id);
  await setDoc(docRef, category, { merge: true });
}

export async function deleteTicketCategory(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_PATH, id);
  await deleteDoc(docRef);
}

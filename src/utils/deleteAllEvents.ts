import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { APP_ID } from '../lib/constants';

export async function deleteAllEvents() {
  try {
    const eventsSnap = await getDocs(collection(db, `apps/${APP_ID}/events`));
    
    let batch = writeBatch(db);
    let operationCount = 0;
    let deletedEventsCount = 0;

    for (const eventDoc of eventsSnap.docs) {
      const eventId = eventDoc.id;
      
      // 1. Sitze (Sub-Collection) finden und löschen
      const seatsSnap = await getDocs(collection(db, `apps/${APP_ID}/events/${eventId}/seats`));
      
      for (const seatDoc of seatsSnap.docs) {
        batch.delete(seatDoc.ref);
        operationCount++;
        
        // Batch-Limit (500) beachten
        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      // 2. Event selbst löschen
      batch.delete(eventDoc.ref);
      operationCount++;
      deletedEventsCount++;
      
      if (operationCount >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Restliche Operationen ausführen
    if (operationCount > 0) {
      await batch.commit();
    }
    
    return deletedEventsCount;
  } catch (error) {
    console.error("Fehler beim Löschen der Events:", error);
    throw error;
  }
}

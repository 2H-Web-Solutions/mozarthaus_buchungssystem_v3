import { collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { APP_ID } from '../lib/constants';
import { initializeEventSeats } from '../services/bookingService';

export async function syncMissingEvents() {
  try {
    const bookingsSnap = await getDocs(collection(db, `apps/${APP_ID}/bookings`));
    const uniqueEvents = new Map();

    // 1. Alle benötigten Events aus den Buchungen extrahieren
    bookingsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.eventId && data.dateTime) {
        if (!uniqueEvents.has(data.eventId)) {
          uniqueEvents.set(data.eventId, {
            date: data.dateTime,
            title: data.eventTitle || 'Importiertes Event (Regiondo)'
          });
        }
      }
    });

    let createdCount = 0;
    let initializedSeatsCount = 0;

    // 2. Events prüfen und fehlende Daten/Sitze ergänzen
    for (const [eventId, eventData] of uniqueEvents.entries()) {
      const eventRef = doc(db, `apps/${APP_ID}/events`, eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        // Fall A: Event fehlt komplett -> Sicher anlegen
        const batch = writeBatch(db);
        batch.set(eventRef, {
          title: eventData.title,
          date: eventData.date,
          status: 'active'
        });
        await batch.commit();
        await initializeEventSeats(eventId);
        createdCount++;
      } else {
        // Fall B: Event existiert (von n8n erstellt), ABER fehlen die Sitze?
        const seatsSnap = await getDocs(collection(db, `apps/${APP_ID}/events/${eventId}/seats`));
        if (seatsSnap.empty) {
          // Sitze fehlen -> Initialisieren, damit Auslastung berechnet werden kann
          await initializeEventSeats(eventId);
          initializedSeatsCount++;
        }
      }
    }

    return { createdCount, initializedSeatsCount };
  } catch (error) {
    console.error("Fehler beim Synchronisieren:", error);
    throw error;
  }
}

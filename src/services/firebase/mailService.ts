import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { Booking, Event } from '../../types/schema';
import { generateTicketHTML } from '../../utils/ticketTemplate';

/**
 * Sends a booking confirmation email by pushing a payload to the Firebase Mail Queue.
 */
export async function sendBookingConfirmation(bookingId: string) {
  try {
    // 1. Fetch Booking
    const bookingRef = doc(db, `apps/${APP_ID}/bookings`, bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error(`Booking ${bookingId} not found.`);
    }
    
    const booking = bookingSnap.data() as Booking;

    // 2. Validate Email
    const email = booking.customerData?.email;
    if (!email || email === 'abendkasse@mozarthaus.at' || email.trim() === '') {
      console.log(`Skipping email confirmation for booking ${bookingId} (No valid email: ${email})`);
      return; 
    }

    // 3. Fetch Event Details
    const eventRef = doc(db, `apps/${APP_ID}/events`, booking.eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Event ${booking.eventId} not found for booking.`);
    }
    
    const event = eventSnap.data() as Event;

    // 4. Generate HTML Template
    const htmlContent = generateTicketHTML(booking, event);
    
    // 5. Push to Mail Queue
    const mailId = `mail_booking_${bookingId}_${Date.now()}`;
    const mailRef = doc(db, `apps/${APP_ID}/mail`, mailId);
    
    await setDoc(mailRef, {
      to: email,
      message: {
        subject: `Ihre Tickets für das Mozarthaus: ${event.title}`,
        html: htmlContent
      },
      bookingRef: bookingId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log(`Successfully queued confirmation email for booking ${bookingId}`);
    return true;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}

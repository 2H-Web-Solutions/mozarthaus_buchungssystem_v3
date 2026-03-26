import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { Event, Booking } from '../../types/schema';

export interface DashboardStats {
  revenue: number;
  upcomingEventsCount: number;
  occupancyPercent: number;
  recentEvents: Event[];
  recentBookings: Booking[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // 1. Fetch upcoming events (for count and list)
  const eventsRef = collection(db, `apps/${APP_ID}/events`);
  const upcomingEventsQuery = query(
    eventsRef,
    where('date', '>=', today.toISOString().split('T')[0]),
    orderBy('date', 'asc'),
    limit(5)
  );
  
  const eventsSnap = await getDocs(upcomingEventsQuery);
  const recentEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  const upcomingEventsCount = eventsSnap.docs.filter(doc => {
    const eDate = doc.data().date;
    const d = new Date(eDate?.toDate ? eDate.toDate() : eDate);
    return d <= nextWeek;
  }).length;

  // Calculate average occupancy for next 3 events
  let occupancySum = 0;
  let eventOccupancyCount = 0;
  for (let i = 0; i < Math.min(3, recentEvents.length); i++) {
    const e = recentEvents[i];
    const capacity = 180; // Standard Mozarthaus capacity fallback
    
    const eventBookingsQuery = query(collection(db, `apps/${APP_ID}/bookings`), where('eventId', '==', e.id));
    const eventBookingsSnap = await getDocs(eventBookingsQuery);
    
    let booked = 0;
    eventBookingsSnap.forEach(bSnap => {
       const b = bSnap.data() as Booking;
       if (b.status !== 'cancelled') {
         booked += b.seatIds ? b.seatIds.length : (b.tickets?.reduce((acc, t) => acc + (t.quantity || 1), 0) || 0);
       }
    });
    
    occupancySum += (booked / capacity) * 100;
    eventOccupancyCount++;
  }
  
  const occupancyPercent = eventOccupancyCount > 0 
    ? Math.round(occupancySum / eventOccupancyCount)
    : 0;

  // 3. Fetch Recent Bookings
  const bookingsRef = collection(db, `apps/${APP_ID}/bookings`);
  const recentBookingsQuery = query(
    bookingsRef,
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  const bookingsSnap = await getDocs(recentBookingsQuery);
  const recentBookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

  // 4. Calculate Revenue for current month (Paid only)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthBookingsQuery = query(
    bookingsRef,
    orderBy('createdAt', 'desc'),
    limit(100) // limit for safety, filter by status and date in client to avoid Composite Index requirement
  );

  const monthSnap = await getDocs(currentMonthBookingsQuery);
  const revenue = monthSnap.docs.reduce((sum, doc) => {
    const b = doc.data() as Booking;
    // Check if it's paid and in current month
    if (b.status === 'paid') {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        if (createdAt >= startOfMonth) {
            return sum + (b.totalAmount || 0);
        }
    }
    return sum;
  }, 0);

  return {
    revenue,
    upcomingEventsCount,
    occupancyPercent,
    recentEvents,
    recentBookings
  };
}

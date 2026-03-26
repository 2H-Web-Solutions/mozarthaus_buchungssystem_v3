import { Timestamp } from 'firebase/firestore';

export interface EventEnsembleMember {
  musikerId: string;
  name: string;
  instrument: string;
  gage?: number;
  status: 'angefragt' | 'bestätigt' | 'abgesagt';
}

export interface Event {
  id: string;
  title: string;
  date: Timestamp | string;
  time?: string;
  status: 'active' | 'completed' | 'cancelled';
  ensemble?: EventEnsembleMember[];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: 'available' | 'sold' | 'blocked' | 'reserved' | 'cart';
  eventId: string;
  bookingId: string | null;
}

export interface Booking {
  id: string;
  eventId: string;
  variantId?: string;
  partnerId: string | null;
  isB2B: boolean;
  source: 'manual' | 'boxoffice' | 'phone' | 'website' | 'regiondo' | 'b2b';
  status: 'confirmed' | 'cancelled' | 'pending' | 'paid';
  paymentMethod?: 'bar' | 'karte' | 'voucher' | 'rechnung';
  seatIds?: string[];
  tickets?: { seatId?: string, categoryId: string, quantity?: number, price?: number }[];
  checkedInSeats?: string[]; // Specifically for Abendkasse per-seat tracking
  customerData: {
    name: string;
    email: string;
  };
  eventDate?: string;
  eventTitle?: string;
  totalAmount: number;
  createdAt: Timestamp;
  updatedAt?: string | Timestamp;
}

export interface Partner {
  id: string;
  companyName: string;
  type: string;
  contactPerson: string;
  email: string;
  commissionRate?: number;
}

export interface TicketCategory {
  id: string; // e.g., 'cat_a', 'cat_b', 'student'
  name: string; // e.g., 'Kategorie A'
  price: number; 
  colorCode: string; // Hex color
  isActive: boolean;
  description?: string;
}

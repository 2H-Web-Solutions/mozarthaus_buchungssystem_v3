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
  regiondoId?: string | number; // NEU: Mapping-ID für Regiondo Inbound Sync
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
  bookingNumber?: string; // NEU: Fortlaufende Nummer (z.B. 2026-1) oder Regiondo Order-ID
  eventId: string;
  variantId?: string;
  partnerId: string | null;
  isB2B: boolean;
  source: 'manual' | 'boxoffice' | 'phone' | 'website' | 'regiondo' | 'b2b';
  status: 'confirmed' | 'cancelled' | 'pending' | 'paid';
  paymentMethod?: 'bar' | 'karte' | 'voucher' | 'rechnung';
  seatIds?: string[];
  tickets?: { seatId?: string, categoryId: string, categoryName?: string, quantity?: number, price?: number, regiondoOptionId?: string | number }[];
  checkedInSeats?: string[]; // Specifically for Abendkasse per-seat tracking
  customerData: {
    name: string;
    email: string;
    phone?: string; // NEU: Telefonnummer für Regiondo
  };
  eventDate?: string; // Optional: The human-readable date string of the event (e.g. 21.05.2024)
  dateTime?: string; // Optional: The human-readable timestamp of the event for display
  categoryId?: string; // NEU: Category ID from Regiondo
  categoryName?: string; // NEU: Lesbarer Name der Option/Kategorie
  eventTitle?: string;
  totalAmount: number;
  regiondoProductId?: string | number; // NEU: Die Event-ID für Regiondo
  /** Gespeichert nach erfolgreichem POST /checkout/purchase */
  regiondoOrderId?: string;
  regiondoOrderNumber?: string;
  /**
   * Snapshot von POST /checkout/totals (Zahlung, buyer_data, Roh-JSON) — nur lokal;
   * wird nicht an den minimalen Regiondo-Purchase (`items` + `contact_data`) gesendet.
   */
  regiondoCheckoutMeta?: Record<string, unknown>;

  // Neue Felder für Buchungsvarianten
  bookingType?: 'einzel' | 'gruppe' | 'privat';
  sellerReference?: string;
  contactPerson?: string;
  groupPersons?: number;
  customTotalPrice?: number;
  /** Privat- / Gruppenbuchung: eingegebener Preis pro Person (€). */
  pricePerPerson?: number;
  receiptUrl?: string; // Link zum externen Stripe-Beleg / Regiondo-Ticket

  createdAt: Timestamp;
  updatedAt?: string | Timestamp;
}

export interface Partner {
  id: string;
  companyName: string; // Used as firmenname in import
  type: string;
  contactPerson?: string;
  email: string;
  commissionRate?: number; // Used as provisionsSatz

  // New fields from bulk import
  art?: string;
  merchantNr?: string;
  strasse?: string;
  ort?: string;
  telefon?: string;
  steuernummer?: string;
  aktiv?: boolean;
}

export interface TicketCategory {
  id: string; // e.g., 'cat_a', 'cat_b', 'student'
  name: string; // e.g., 'Kategorie A'
  price: number; 
  colorCode: string; // Hex color
  isActive: boolean;
  description?: string;
  regiondoOptionId?: string | number; // NEU: Die Option-ID für Regiondo
}

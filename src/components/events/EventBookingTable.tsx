import { Booking } from '../../types/schema';
import { CheckCircle2, AlertCircle, CheckSquare, Square, Mail } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { sendBookingConfirmation } from '../../services/firebase/mailService';
import toast from 'react-hot-toast';

interface Props {
  bookings: Booking[];
}

interface FlattenedTicket {
  id: string;
  bookingId: string;
  row: string;
  seatNumber: string;
  customerName: string;
  source: string;
  paymentStatus: string;
  amount: number;
  paymentMethod: string;
  info: string;
  createdAt: Date;
  isCheckedIn: boolean;
}

export function EventBookingTable({ bookings }: Props) {
  
  // Flatten bookings into individual tickets
  const flattenedTickets: FlattenedTicket[] = [];
  
  bookings.forEach(booking => {
     if (booking.status === 'cancelled') return; // Skip cancelled bookings or show them? Often excluded in pure occupancy view
     
     const createdDate = (booking.createdAt as any)?.toDate ? (booking.createdAt as any).toDate() : new Date(booking.createdAt as any);
     
     // Determine per-ticket price roughly if there are multiple tickets but we don't have accurate mapping
     const totalSeats = booking.seatIds ? booking.seatIds.length : (booking.tickets?.length || 1);
     const amountPerSeat = booking.totalAmount / totalSeats;
     
     if (booking.seatIds && booking.seatIds.length > 0) {
        booking.seatIds.forEach((seatId: string) => {
           // seatId generic format assumed: 'row_a_seat_1'
           const match = seatId.match(/row_([a-z]+)_seat_(\d+)/i);
           const rowName = match ? match[1].toUpperCase() : '-';
           const seatNumber = match ? match[2] : '-';
           
           flattenedTickets.push({
             id: seatId,
             bookingId: booking.id,
             row: rowName,
             seatNumber: seatNumber,
             customerName: booking.customerData.name,
             source: booking.source,
             paymentStatus: booking.status,
             amount: amountPerSeat,
             paymentMethod: booking.paymentMethod || '-',
             info: booking.isB2B ? 'B2B Partner Buchung' : '',
             createdAt: createdDate,
             isCheckedIn: (booking.checkedInSeats || []).includes(seatId)
           });
        });
     } else if (booking.tickets && booking.tickets.length > 0) {
        // Fallback for bookings without specific seatIds (e.g., manual count tickets)
        booking.tickets.forEach((t: any, i: number) => {
           for (let q = 0; q < (t.quantity || 1); q++) {
               flattenedTickets.push({
                 id: `${booking.id}-t${i}-q${q}`,
                 bookingId: booking.id,
                 row: '-',
                 seatNumber: '-',
                 customerName: booking.customerData.name,
                 source: booking.source,
                 paymentStatus: booking.status,
                 amount: t.price || amountPerSeat,
                 paymentMethod: booking.paymentMethod || '-',
                 info: `Kategorie: ${t.categoryId}`,
                 createdAt: createdDate,
                 isCheckedIn: (booking.checkedInSeats || []).includes(`${booking.id}-t${i}-q${q}`)
               });
           }
        });
     }
  });

  // Sort default by Row A-Z, then SeatNumber 1-99
  flattenedTickets.sort((a, b) => {
     if (a.row !== b.row) return a.row.localeCompare(b.row);
     return parseInt(a.seatNumber) - parseInt(b.seatNumber);
  });

  const toggleCheckIn = async (bookingId: string, ticketId: string, isCurrentlyCheckedIn: boolean) => {
     try {
       const bookingRef = doc(db, `apps/${APP_ID}/bookings`, bookingId);
       if (isCurrentlyCheckedIn) {
         await updateDoc(bookingRef, { checkedInSeats: arrayRemove(ticketId) });
       } else {
         await updateDoc(bookingRef, { checkedInSeats: arrayUnion(ticketId) });
       }
     } catch (err) {
       console.error("Fehler beim Check-In:", err);
       alert("Speichern fehlgeschlagen.");
     }
  };

  const handleResendMail = async (bookingId: string) => {
    toast.promise(
      sendBookingConfirmation(bookingId),
      {
         loading: 'Sende Ticket...',
         success: 'E-Mail erfolgreich versendet!',
         error: 'Fehler beim Senden',
      }
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-gray-400">
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
        <h3 className="font-bold text-gray-900 print:text-xl">Gebuchte Plätze ({flattenedTickets.length})</h3>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left text-sm whitespace-nowrap print:text-black">
          <thead className="bg-white">
            <tr className="text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200 text-xs print:text-black print:border-black">
              <th className="p-4 w-12 text-center border-r border-gray-100 print:border-black">Check-In</th>
              <th className="p-4 w-16 text-center border-r border-gray-100 print:border-black">Reihe</th>
              <th className="p-4 w-16 text-center border-r border-gray-100 print:border-black">Platz</th>
              <th className="p-4 border-r border-gray-100 print:border-black">Name</th>
              <th className="p-4 border-r border-gray-100 print:border-black print:hidden">Verkäufer</th>
              <th className="p-4 border-r border-gray-100 print:border-black">Zahlstatus</th>
              <th className="p-4 text-right border-r border-gray-100 print:border-black print:hidden">Betrag</th>
              <th className="p-4 border-r border-gray-100 print:border-black print:hidden">Zahlart</th>
              <th className="p-4 print:border-black">Information</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 print:divide-black/20">
            {flattenedTickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Bisher keine Plätze gebucht.</td>
              </tr>
            ) : (
              flattenedTickets.map(ticket => (
                <tr key={ticket.id} className={`transition-colors group print:border-b print:border-gray-300 ${ticket.isCheckedIn ? 'bg-green-50/40 text-gray-500' : 'hover:bg-brand-primary/5'}`}>
                  <td className="p-4 text-center cursor-pointer print:hidden" onClick={() => toggleCheckIn(ticket.bookingId, ticket.id, ticket.isCheckedIn)}>
                    <div className="flex justify-center">
                      {ticket.isCheckedIn ? (
                        <CheckSquare className="w-6 h-6 text-green-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-300 hover:text-brand-primary transition-colors" />
                      )}
                    </div>
                  </td>
                  {/* Print Checkbox visually representing CheckIn */}
                  <td className="hidden print:table-cell p-4 text-center border-r border-gray-100 border-black">
                     <div className="w-5 h-5 border-2 border-black inline-block rounded-sm">
                       {ticket.isCheckedIn && <div className="w-full h-full bg-black"></div>}
                     </div>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-900 border-r border-gray-100 print:border-black">{ticket.row}</td>
                  <td className="p-4 text-center font-bold text-gray-900 border-r border-gray-100 print:border-black">{ticket.seatNumber}</td>
                  <td className={`p-4 font-bold ${ticket.isCheckedIn ? 'text-gray-500' : 'text-gray-800'} border-r border-gray-100 print:border-black`}>
                    {ticket.customerName}
                  </td>
                  <td className="p-4 text-gray-600 border-r border-gray-100 print:hidden">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold uppercase tracking-wider border border-gray-200">
                      {ticket.source}
                    </span>
                  </td>
                  <td className="p-4 border-r border-gray-100 print:border-black">
                    {ticket.paymentStatus === 'paid' ? (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-green-700 bg-green-50 border border-green-200 print:border-none print:p-0 print:text-black print:bg-transparent">
                         <CheckCircle2 className="w-3.5 h-3.5 print:hidden" /> Bezahlt
                       </span>
                    ) : ticket.paymentStatus === 'confirmed' ? (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 print:border-none print:p-0 print:text-black print:bg-transparent">
                         <CheckCircle2 className="w-3.5 h-3.5 print:hidden" /> Bestätigt
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 print:border-none print:p-0 print:text-black print:bg-transparent">
                         <AlertCircle className="w-3.5 h-3.5 print:hidden" /> Offen
                       </span>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900 border-r border-gray-100 print:hidden">
                    € {ticket.amount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-gray-600 border-r border-gray-100 print:hidden">
                    {ticket.paymentMethod !== '-' ? (
                       <span className="font-bold uppercase tracking-wider text-xs text-gray-500">
                         {ticket.paymentMethod}
                       </span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-gray-500 text-xs flex items-center gap-2 italic">
                    <span className="truncate max-w-[120px] block">{ticket.info || '-'}</span>
                    <button
                      onClick={() => handleResendMail(ticket.bookingId)}
                      title="Bestätigung & Ticket erneut senden"
                      className="p-1.5 ml-auto text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors print:hidden"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

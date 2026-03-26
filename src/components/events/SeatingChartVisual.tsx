import { useState } from 'react';
import { SEATING_PLAN_TEMPLATE } from '../../config/seatingPlan';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { X } from 'lucide-react';

interface Props {
  eventId: string;
  bookedSeatIds: string[];
}

export function SeatingChartVisual({ eventId, bookedSeatIds }: Props) {
  const [selectedSeat, setSelectedSeat] = useState<{ id: string, name: string } | null>(null);
  const [customerName, setCustomerName] = useState('Abendkasse');
  const [paymentMethod, setPaymentMethod] = useState<'bar' | 'karte'>('bar');
  const [priceCategory, setPriceCategory] = useState('Standard (€69)');
  const [isSaving, setIsSaving] = useState(false);

  const priceMapping: Record<string, number> = {
    'Standard (€69)': 69,
    'Ermäßigt (€49)': 49,
    'Student (€29)': 29
  };

  const openQuickSell = (seatId: string) => {
    setSelectedSeat({
      id: seatId,
      name: seatId.replace(/row_|_seat_/g, ' ').toUpperCase()
    });
    setCustomerName('Abendkasse');
    setPaymentMethod('bar');
    setPriceCategory('Standard (€69)');
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    setIsSaving(true);
    
    // Slugifizierte ID wie gefordert: ticket_[eventId]_[reihe]_[platz]
    const ticketId = `ticket_${eventId}_${selectedSeat.id}`;
    
    try {
      await setDoc(doc(db, `apps/${APP_ID}/bookings`, ticketId), {
        eventId,
        customerData: {
          name: customerName,
          email: 'abendkasse@mozarthaus.at'
        },
        source: 'boxoffice',
        status: 'paid',
        paymentMethod,
        seatIds: [selectedSeat.id],
        totalAmount: priceMapping[priceCategory] || 69,
        createdAt: serverTimestamp()
      });
      setSelectedSeat(null);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Ausstellen des Tickets.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
      <div className="w-full max-w-sm h-10 bg-brand-primary rounded-b-xl flex items-center justify-center text-white font-bold tracking-[0.2em] mb-6 shadow-sm">
        KONZERTBÜHNE
      </div>
      
      {SEATING_PLAN_TEMPLATE.map((rowBlueprint) => (
        <div key={rowBlueprint.rowId} className="flex flex-row justify-center items-center gap-1.5 w-full">
          {/* Left Label */}
          <div className="w-6 flex-shrink-0 text-center font-bold text-gray-500 text-sm">
            {rowBlueprint.rowId}
          </div>
          
          <div className="flex flex-row gap-1.5 justify-center items-center">
            {rowBlueprint.elements.map((el, i) => {
              if (el.type === 'spacer') {
                const missingSeats = el.width;
                const spacerWidth = (missingSeats * 1.5) + ((missingSeats - 1) * 0.375); // based on w-6 (1.5rem) and gap-1.5 (0.375rem)
                return <div key={`spacer-${rowBlueprint.rowId}-${i}`} style={{ width: `${spacerWidth}rem`, flexShrink: 0 }} />;
              }
              
              const isBooked = bookedSeatIds.includes(el.id);
              
              return (
                <button 
                  key={el.id}
                  disabled={isBooked}
                  onClick={() => openQuickSell(el.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors print:w-5 print:h-5 ${
                    isBooked 
                      ? 'border-brand-primary bg-brand-primary/10 cursor-not-allowed print:border-black print:bg-black' 
                      : 'border-gray-300 bg-white hover:border-brand-primary/50 cursor-pointer print:border-gray-400'
                  }`}
                  title={el.id.replace(/row_|_seat_/g, ' ').toUpperCase()}
                >
                  {isBooked ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary print:hidden"></div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Right Label */}
          <div className="w-6 flex-shrink-0 text-center font-bold text-gray-500 text-sm">
            {rowBlueprint.rowId}
          </div>
        </div>
      ))}
      
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-600 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded bg-white"></div> Frei
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-primary bg-brand-primary/10 rounded flex items-center justify-center print:border-black print:bg-black">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary print:hidden"></div>
          </div> Gebucht
        </div>
      </div>

      {selectedSeat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold font-heading text-lg text-brand-primary">Abendkasse</h3>
              <button onClick={() => setSelectedSeat(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ausgewählter Platz</label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded font-medium text-gray-900 text-center">
                  {selectedSeat.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name (Optional)</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kategorie / Preis</label>
                <select 
                  value={priceCategory}
                  onChange={(e) => setPriceCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white"
                >
                  {Object.keys(priceMapping).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Zahlart</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('bar')} className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${paymentMethod === 'bar' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary/50'}`}>Bar</button>
                  <button type="button" onClick={() => setPaymentMethod('karte')} className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${paymentMethod === 'karte' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary/50'}`}>Karte</button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 mt-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Speichert...' : 'Ticket ausstellen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { RegiondoSupplierBookingsPanel } from '../components/bookings/RegiondoSupplierBookingsPanel';
import { RegiondoCreateBookingPanel } from '../components/bookings/RegiondoCreateBookingPanel';
import { Search } from 'lucide-react';

export function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'list' | 'create'>('list');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading text-brand-primary">Buchungen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regiondo Supplier &amp; Checkout API
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50/80 shrink-0">
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'list'
                ? 'bg-white text-brand-primary shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alle Buchungen
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'create'
                ? 'bg-white text-brand-primary shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Neue Buchung
          </button>
        </div>
      </div>

      {tab === 'list' ? (
        <>
          <div className="bg-white p-4 rounded-t-lg shadow-sm border border-gray-200 border-b-0 flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Suche in Regiondo-Buchungen…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>
          <RegiondoSupplierBookingsPanel searchTerm={searchTerm} />
        </>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-gray-50/30 p-4 sm:p-6">
          <RegiondoCreateBookingPanel />
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { RegiondoSupplierBookingsPanel } from '../components/bookings/RegiondoSupplierBookingsPanel';
import { Search } from 'lucide-react';

export function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-heading text-brand-primary">Buchungen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Regiondo Supplier API — <code className="text-xs bg-gray-100 px-1 rounded">GET /supplier/bookings</code>
        </p>
      </div>

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
    </div>
  );
}

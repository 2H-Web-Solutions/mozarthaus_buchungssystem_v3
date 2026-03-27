import { Seat } from '../../types/schema';
import { X } from 'lucide-react';

interface Props {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seatId: string) => void;
  categoryColor?: string;
  onClickInfo?: () => void;
}

export function SeatButton({ seat, isSelected, onToggle, categoryColor, onClickInfo }: Props) {
  let baseClass = "relative w-10 h-10 flex items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 select-none ";
  let stateClass = "";
  
  if (isSelected) {
     stateClass = "bg-[#c02a2a] border-[#c02a2a] text-white shadow-md";
  } else if (seat.status === 'available') {
     stateClass = "bg-white border-[#bababa] text-gray-700 hover:border-[#c02a2a] hover:text-[#c02a2a] hover:-translate-y-0.5";
  } else if (seat.status === 'sold') {
     stateClass = "text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity";
  } else if (seat.status === 'blocked') {
     stateClass = "bg-gray-800 border-gray-900 text-white cursor-not-allowed";
  } else if (seat.status === 'reserved') {
     stateClass = "text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity";
  } else if (seat.status === 'cart') {
     stateClass = "bg-orange-400 border-orange-500 text-white cursor-not-allowed";
  }

  const disabled = seat.status === 'blocked' || seat.status === 'cart';

  const handleSeatClick = () => {
    if (seat.status === 'available' || isSelected) {
      onToggle(seat.id);
    } else if (seat.status === 'sold' || seat.status === 'reserved') {
      onClickInfo?.();
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={handleSeatClick}
      className={baseClass + stateClass}
      style={{
        backgroundColor: (seat.status === 'sold' || seat.status === 'reserved') ? (categoryColor || (seat.status === 'sold' ? '#d1d5db' : '#3b82f6')) : undefined,
        borderColor: (seat.status === 'sold' || seat.status === 'reserved') ? (categoryColor || (seat.status === 'sold' ? '#9ca3af' : '#2563eb')) : undefined
      }}
      aria-label={`Reihe ${seat.row}, Platz ${seat.number}, ${seat.status}`}
      title={`Reihe ${seat.row} Platz ${seat.number}`}
    >
      {seat.status === 'blocked' ? <X className="w-5 h-5 text-gray-400" /> : seat.number}
    </button>
  );
}
